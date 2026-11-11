import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { MENSAGEM_TIPO_TREINO } from '../tipos-treino';
import { QueryTreinoDto, QueryTreinoMembroDto } from './query-treino.dto';

async function validar(query: Record<string, unknown>) {
  const dto = plainToInstance(QueryTreinoDto, query);
  const erros = await validate(dto);
  const mensagens = erros.flatMap((e) => Object.values(e.constraints ?? {}));
  return { dto, mensagens };
}

describe('QueryTreinoDto', () => {
  it('aceita query vazia com page 1 e pageSize 20', async () => {
    const { dto, mensagens } = await validar({});

    expect(mensagens).toEqual([]);
    expect(dto.page).toBe(1);
    expect(dto.pageSize).toBe(20);
  });

  it('aceita todos os filtros e converte a paginação para número', async () => {
    const { dto, mensagens } = await validar({
      membroId: '0199f0a2-7b3c-7d4e-8f00-123456789abc',
      tipo: 'Cardio',
      page: '2',
      pageSize: '10',
    });

    expect(mensagens).toEqual([]);
    expect(dto.page).toBe(2);
    expect(dto.pageSize).toBe(10);
  });

  it.each([
    [{ membroId: 'x' }, 'membroId deve ser um UUID válido'],
    [{ tipo: 'Yoga' }, MENSAGEM_TIPO_TREINO],
    [{ pageSize: '101' }, 'pageSize deve ser no máximo 100'],
  ])('%o → "%s"', async (query, mensagem) => {
    const { mensagens } = await validar(query);

    expect(mensagens).toContain(mensagem);
  });
});

describe('QueryTreinoMembroDto', () => {
  it('aceita só tipo e paginação e converte a página para número', async () => {
    const dto = plainToInstance(QueryTreinoMembroDto, {
      tipo: 'Cardio',
      page: '2',
    });
    const erros = await validate(dto);

    expect(erros).toEqual([]);
    expect(dto.tipo).toBe('Cardio');
    expect(dto.page).toBe(2);
    expect(dto.pageSize).toBe(20);
  });

  it('recusa tipo fora da lista', async () => {
    const erros = await validate(
      plainToInstance(QueryTreinoMembroDto, { tipo: 'Yoga' }),
    );
    const mensagens = erros.flatMap((e) => Object.values(e.constraints ?? {}));

    expect(mensagens).toContain(MENSAGEM_TIPO_TREINO);
  });
});
