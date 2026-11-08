import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { MENSAGEM_TIPO_TREINO } from '../tipos-treino';
import { UpdateTreinoDto } from './update-treino.dto';

async function validar(corpo: Record<string, unknown>) {
  const dto = plainToInstance(UpdateTreinoDto, corpo);
  const erros = await validate(dto);
  const mensagens = erros.flatMap((e) => Object.values(e.constraints ?? {}));
  return { dto, mensagens };
}

const MSG_MEMBRO = 'membroId não pode ser alterado';
const MSG_TEXTO = 'descricao deve ser um texto';
const MSG_TAMANHO = 'descricao deve ter entre 3 e 500 caracteres';
const MSG_INTEIRO = 'duracao deve ser um número inteiro de minutos';
const MSG_DATA = 'dataInicio deve ser uma data válida no formato AAAA-MM-DD';

describe('UpdateTreinoDto', () => {
  it('aceita body vazio', async () => {
    const { mensagens } = await validar({});

    expect(mensagens).toEqual([]);
  });

  it('aceita edição parcial, com trim e conversão de data', async () => {
    const { dto, mensagens } = await validar({
      descricao: '  Cardio leve  ',
      dataInicio: '2026-10-20',
    });

    expect(mensagens).toEqual([]);
    expect(dto.descricao).toBe('Cardio leve');
    expect(dto.dataInicio?.toISOString()).toBe('2026-10-20T00:00:00.000Z');
    expect(dto.duracao).toBeUndefined();
  });

  it.each([
    [{ membroId: '0199f0a2-7b3c-7d4e-8f00-123456789abc' }, MSG_MEMBRO],
    [{ membroId: '' }, MSG_MEMBRO],
    [{ membroId: null }, MSG_MEMBRO],
    [{ tipo: null }, MENSAGEM_TIPO_TREINO],
    [{ tipo: 'Yoga' }, MENSAGEM_TIPO_TREINO],
    [{ descricao: null }, MSG_TEXTO],
    [{ descricao: 'ab' }, MSG_TAMANHO],
    [{ descricao: 'a'.repeat(501) }, MSG_TAMANHO],
    [{ duracao: null }, MSG_INTEIRO],
    [{ duracao: 1.5 }, MSG_INTEIRO],
    [{ duracao: 0 }, 'duracao deve ser no mínimo 1 minuto'],
    [{ duracao: 301 }, 'duracao deve ser no máximo 300 minutos'],
    [{ dataInicio: null }, MSG_DATA],
    [{ dataInicio: '15/10/2026' }, MSG_DATA],
  ])('%o → "%s"', async (campos, mensagem) => {
    const { mensagens } = await validar(campos);

    expect(mensagens).toContain(mensagem);
  });
});
