import { plainToInstance } from 'class-transformer';
import { validate, ValidatorOptions } from 'class-validator';
import { CreateAtividadeDto } from './create-atividade.dto';

async function validar(
  body: Record<string, unknown>,
  opcoes?: ValidatorOptions,
) {
  const dto = plainToInstance(CreateAtividadeDto, body);
  const erros = await validate(dto, opcoes);
  const mensagens = erros.flatMap((e) => Object.values(e.constraints ?? {}));
  return { dto, mensagens };
}

const base = {
  membroId: '0199f0a2-7b3c-7d4e-8f00-123456789abc',
  atividade: 'Supino reto',
  data: '2026-10-15',
  tempoExecucao: 45,
};

const MSG_MEMBRO = 'membroId deve ser um UUID válido';
const MSG_TREINO = 'treinoId deve ser um UUID válido';
const MSG_TEXTO = 'atividade deve ser um texto';
const MSG_TAMANHO = 'atividade deve ter entre 3 e 120 caracteres';
const MSG_DATA = 'data deve ser uma data válida no formato AAAA-MM-DD';
const MSG_INTEIRO = 'tempoExecucao deve ser um número inteiro de minutos';

describe('CreateAtividadeDto', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-16T15:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('aceita um body válido sem treinoId e converte data para Date', async () => {
    const { dto, mensagens } = await validar(base);

    expect(mensagens).toEqual([]);
    expect(dto.treinoId).toBeUndefined();
    expect(dto.data).toBeInstanceOf(Date);
    expect(dto.data.toISOString()).toBe('2026-10-15T00:00:00.000Z');
  });

  it('aceita treinoId UUID', async () => {
    const { mensagens } = await validar({
      ...base,
      treinoId: '0199f0a2-7b3c-7d4e-8f00-123456789abd',
    });

    expect(mensagens).toEqual([]);
  });

  it('aceita data de hoje', async () => {
    const { mensagens } = await validar({ ...base, data: '2026-10-16' });

    expect(mensagens).toEqual([]);
  });

  it.each([[1], [600]])('aceita tempoExecucao limite %d', async (tempo) => {
    const { mensagens } = await validar({ ...base, tempoExecucao: tempo });

    expect(mensagens).toEqual([]);
  });

  it.each([[3], [120]])(
    'aceita atividade com %d caracteres',
    async (tamanho) => {
      const { mensagens } = await validar({
        ...base,
        atividade: 'a'.repeat(tamanho),
      });

      expect(mensagens).toEqual([]);
    },
  );

  it('remove os espaços das pontas de atividade', async () => {
    const { dto, mensagens } = await validar({
      ...base,
      atividade: '  Supino  ',
    });

    expect(mensagens).toEqual([]);
    expect(dto.atividade).toBe('Supino');
  });

  it('rejeita atividade que só tem 2 caracteres depois do trim', async () => {
    const { mensagens } = await validar({ ...base, atividade: '   ab   ' });

    expect(mensagens).toContain(MSG_TAMANHO);
  });

  it.each([
    [{ membroId: undefined }, MSG_MEMBRO],
    [{ membroId: 'abc' }, MSG_MEMBRO],
    [{ treinoId: 'abc' }, MSG_TREINO],
    [{ atividade: undefined }, MSG_TEXTO],
    [{ atividade: 123 }, MSG_TEXTO],
    [{ atividade: 'ab' }, MSG_TAMANHO],
    [{ atividade: 'a'.repeat(121) }, MSG_TAMANHO],
    [{ data: undefined }, MSG_DATA],
    [{ data: '2026-02-30' }, MSG_DATA],
    [{ data: '15/10/2026' }, MSG_DATA],
    [{ data: '2026-10-17' }, 'data não pode ser uma data futura'],
    [{ tempoExecucao: undefined }, MSG_INTEIRO],
    [{ tempoExecucao: '30' }, MSG_INTEIRO],
    [{ tempoExecucao: 30.5 }, MSG_INTEIRO],
    [{ tempoExecucao: 0 }, 'tempoExecucao deve ser no mínimo 1 minuto'],
    [{ tempoExecucao: 601 }, 'tempoExecucao deve ser no máximo 600 minutos'],
  ])('%o → "%s"', async (sobrescrita, mensagem) => {
    const { mensagens } = await validar({ ...base, ...sobrescrita });

    expect(mensagens).toContain(mensagem);
  });

  it('rejeita funcionarioId no body pela whitelist (RN11)', async () => {
    const { mensagens } = await validar(
      { ...base, funcionarioId: '0199f0a2-7b3c-7d4e-8f00-123456789abe' },
      { whitelist: true, forbidNonWhitelisted: true },
    );

    expect(mensagens).toContain('property funcionarioId should not exist');
  });
});
