import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RegistrarPagamentoDto } from './registrar-pagamento.dto';

async function validar(body: Record<string, unknown>) {
  const dto = plainToInstance(RegistrarPagamentoDto, body);
  const erros = await validate(dto);
  const mensagens = erros.flatMap((e) => Object.values(e.constraints ?? {}));
  return { dto, mensagens };
}

describe('RegistrarPagamentoDto', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-16T15:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('assume hoje quando dataPagamento não é informada', async () => {
    const { dto, mensagens } = await validar({});

    expect(mensagens).toEqual([]);
    expect(dto.dataPagamento.toISOString()).toBe('2026-10-16T00:00:00.000Z');
  });

  it.each([['2026-10-16'], ['2026-10-15']])(
    'aceita %s (hoje ou passado)',
    async (dataPagamento) => {
      const { dto, mensagens } = await validar({ dataPagamento });

      expect(mensagens).toEqual([]);
      expect(dto.dataPagamento.toISOString()).toBe(
        `${dataPagamento}T00:00:00.000Z`,
      );
    },
  );

  it('rejeita amanhã', async () => {
    const { mensagens } = await validar({ dataPagamento: '2026-10-17' });

    expect(mensagens).toEqual(['dataPagamento não pode ser uma data futura']);
  });

  it('rejeita dataPagamento null', async () => {
    const { mensagens } = await validar({ dataPagamento: null });

    expect(mensagens).toEqual([
      'dataPagamento deve ser uma data válida no formato AAAA-MM-DD',
    ]);
  });

  it('rejeita uma data que não existe no calendário', async () => {
    const { mensagens } = await validar({ dataPagamento: '2026-02-30' });

    expect(mensagens).toEqual([
      'dataPagamento deve ser uma data válida no formato AAAA-MM-DD',
    ]);
  });
});
