import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreatePagamentoDto } from './create-pagamento.dto';

async function validar(body: Record<string, unknown>) {
  const dto = plainToInstance(CreatePagamentoDto, body);
  const erros = await validate(dto);
  const mensagens = erros.flatMap((e) => Object.values(e.constraints ?? {}));
  return { dto, mensagens };
}

const base = {
  membroId: '0199f0a2-7b3c-7d4e-8f00-123456789abc',
  valor: 150.5,
  dataVencimento: '2026-11-10',
};

const MSG_UUID = 'membroId deve ser um UUID válido';
const MSG_DECIMAIS = 'valor deve ser um número com no máximo 2 casas decimais';
const MSG_DATA =
  'dataVencimento deve ser uma data válida no formato AAAA-MM-DD';

describe('CreatePagamentoDto', () => {
  it('aceita um body válido e converte dataVencimento para Date', async () => {
    const { dto, mensagens } = await validar(base);

    expect(mensagens).toEqual([]);
    expect(dto.dataVencimento).toBeInstanceOf(Date);
    expect(dto.dataVencimento.toISOString()).toBe('2026-11-10T00:00:00.000Z');
  });

  it.each([[0.01], [10000]])('aceita o valor limite %d', async (valor) => {
    const { mensagens } = await validar({ ...base, valor });

    expect(mensagens).toEqual([]);
  });

  it.each([
    [{ membroId: undefined }, MSG_UUID],
    [{ membroId: 'abc' }, MSG_UUID],
    [{ valor: undefined }, MSG_DECIMAIS],
    [{ valor: '150.5' }, MSG_DECIMAIS],
    [{ valor: 0 }, 'valor deve ser no mínimo 0,01'],
    [{ valor: 10000.01 }, 'valor deve ser no máximo 10.000'],
    [{ valor: 0.001 }, MSG_DECIMAIS],
    [{ dataVencimento: undefined }, MSG_DATA],
    [{ dataVencimento: '2026-02-30' }, MSG_DATA],
    [{ dataVencimento: '10/11/2026' }, MSG_DATA],
    [{ dataVencimento: '2026-11-10T10:00:00Z' }, MSG_DATA],
  ])('%o → "%s"', async (sobrescrita, mensagem) => {
    const { mensagens } = await validar({ ...base, ...sobrescrita });

    expect(mensagens).toContain(mensagem);
  });
});
