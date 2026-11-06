import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { MENSAGEM_TIPO_TREINO, TIPOS_TREINO } from '../tipos-treino';
import { CreateTreinoDto } from './create-treino.dto';

async function validar(body: Record<string, unknown>) {
  const dto = plainToInstance(CreateTreinoDto, body);
  const erros = await validate(dto);
  const mensagens = erros.flatMap((e) => Object.values(e.constraints ?? {}));
  return { dto, mensagens };
}

const base = {
  membroId: '0199f0a2-7b3c-7d4e-8f00-123456789abc',
  tipo: 'Musculação',
  descricao: 'Treino de peito e tríceps',
  duracao: 60,
  dataInicio: '2026-10-15',
};

const MSG_MEMBRO = 'membroId deve ser um UUID válido';
const MSG_TEXTO = 'descricao deve ser um texto';
const MSG_TAMANHO = 'descricao deve ter entre 3 e 500 caracteres';
const MSG_DATA = 'dataInicio deve ser uma data válida no formato AAAA-MM-DD';
const MSG_INTEIRO = 'duracao deve ser um número inteiro de minutos';

describe('CreateTreinoDto', () => {
  it('aceita um body válido e converte dataInicio para Date', async () => {
    const { dto, mensagens } = await validar(base);

    expect(mensagens).toEqual([]);
    expect(dto.dataInicio).toBeInstanceOf(Date);
    expect(dto.dataInicio.toISOString()).toBe('2026-10-15T00:00:00.000Z');
  });

  it.each(TIPOS_TREINO.map((tipo) => [tipo]))(
    'aceita o tipo %s',
    async (tipo) => {
      const { mensagens } = await validar({ ...base, tipo });

      expect(mensagens).toEqual([]);
    },
  );

  it.each([[1], [300]])('aceita duracao limite %d', async (duracao) => {
    const { mensagens } = await validar({ ...base, duracao });

    expect(mensagens).toEqual([]);
  });

  it.each([[3], [500]])(
    'aceita descricao com %d caracteres',
    async (tamanho) => {
      const { mensagens } = await validar({
        ...base,
        descricao: 'a'.repeat(tamanho),
      });

      expect(mensagens).toEqual([]);
    },
  );

  it('remove os espaços das pontas de descricao', async () => {
    const { dto, mensagens } = await validar({
      ...base,
      descricao: '  Cardio leve  ',
    });

    expect(mensagens).toEqual([]);
    expect(dto.descricao).toBe('Cardio leve');
  });

  it.each([
    [{ membroId: undefined }, MSG_MEMBRO],
    [{ membroId: 'abc' }, MSG_MEMBRO],
    [{ tipo: undefined }, MENSAGEM_TIPO_TREINO],
    [{ tipo: 'Yoga' }, MENSAGEM_TIPO_TREINO],
    [{ tipo: 'musculação' }, MENSAGEM_TIPO_TREINO],
    [{ descricao: undefined }, MSG_TEXTO],
    [{ descricao: 123 }, MSG_TEXTO],
    [{ descricao: 'ab' }, MSG_TAMANHO],
    [{ descricao: '  ab  ' }, MSG_TAMANHO],
    [{ descricao: 'a'.repeat(501) }, MSG_TAMANHO],
    [{ duracao: undefined }, MSG_INTEIRO],
    [{ duracao: '60' }, MSG_INTEIRO],
    [{ duracao: 1.5 }, MSG_INTEIRO],
    [{ duracao: 0 }, 'duracao deve ser no mínimo 1 minuto'],
    [{ duracao: 301 }, 'duracao deve ser no máximo 300 minutos'],
    [{ dataInicio: undefined }, MSG_DATA],
    [{ dataInicio: '2026-13-01' }, MSG_DATA],
    [{ dataInicio: '15/10/2026' }, MSG_DATA],
  ])('%o → "%s"', async (sobrescrita, mensagem) => {
    const { mensagens } = await validar({ ...base, ...sobrescrita });

    expect(mensagens).toContain(mensagem);
  });
});
