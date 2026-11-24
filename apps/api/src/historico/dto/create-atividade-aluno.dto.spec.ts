import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateAtividadeAlunoDto } from './create-atividade-aluno.dto';

const TREINO_ID = '0199f0a2-7b3c-7d4e-8f00-123456789b01';
const valido = { treinoId: TREINO_ID, data: '2026-11-01', tempoExecucao: 45 };

async function validar(corpo: Record<string, unknown>) {
  const dto = plainToInstance(CreateAtividadeAlunoDto, corpo);
  const erros = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return {
    dto,
    mensagens: erros.flatMap((e) => Object.values(e.constraints ?? {})),
  };
}

describe('CreateAtividadeAlunoDto (RN19)', () => {
  it('aceita treino, data e tempo, sem o texto da atividade', async () => {
    const { mensagens } = await validar(valido);

    expect(mensagens).toEqual([]);
  });

  it('apara o texto da atividade', async () => {
    const { dto, mensagens } = await validar({
      ...valido,
      atividade: '  Peito  ',
    });

    expect(mensagens).toEqual([]);
    expect(dto.atividade).toBe('Peito');
  });

  it('exige o treino', async () => {
    const { mensagens } = await validar({ ...valido, treinoId: undefined });

    expect(mensagens).toContain('treinoId deve ser um UUID válido');
  });

  it.each([
    [{ tempoExecucao: 0 }, 'tempoExecucao deve ser no mínimo 1 minuto'],
    [{ tempoExecucao: 601 }, 'tempoExecucao deve ser no máximo 600 minutos'],
    [{ atividade: 'ab' }, 'atividade deve ter entre 3 e 120 caracteres'],
  ])('recusa %o', async (extra, mensagem) => {
    const { mensagens } = await validar({ ...valido, ...extra });

    expect(mensagens).toContain(mensagem);
  });

  it('recusa o membroId e o funcionarioId no corpo (RN16)', async () => {
    const { mensagens } = await validar({
      ...valido,
      membroId: TREINO_ID,
      funcionarioId: TREINO_ID,
    });

    expect(mensagens).toHaveLength(2);
  });
});
