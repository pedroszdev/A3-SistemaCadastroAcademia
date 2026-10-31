import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { QueryFuncionarioDto } from './query-funcionario.dto';

async function validar(query: Record<string, unknown>) {
  const dto = plainToInstance(QueryFuncionarioDto, query);
  const erros = await validate(dto);
  const mensagens = erros.flatMap((e) => Object.values(e.constraints ?? {}));
  return { dto, mensagens };
}

describe('QueryFuncionarioDto', () => {
  it('aceita query vazia com page 1 e pageSize 20', async () => {
    const { dto, mensagens } = await validar({});

    expect(mensagens).toEqual([]);
    expect(dto.page).toBe(1);
    expect(dto.pageSize).toBe(20);
    expect(dto.ativo).toBeUndefined();
  });

  it.each([
    ['true', true],
    ['false', false],
  ])('converte ativo "%s" para %s', async (entrada, esperado) => {
    const { dto, mensagens } = await validar({ ativo: entrada });

    expect(mensagens).toEqual([]);
    expect(dto.ativo).toBe(esperado);
  });

  it('aceita cargo e paginação', async () => {
    const { dto, mensagens } = await validar({
      cargo: 'ADMIN',
      page: '2',
      pageSize: '50',
    });

    expect(mensagens).toEqual([]);
    expect(dto.cargo).toBe('ADMIN');
    expect(dto.page).toBe(2);
  });

  it.each([
    [{ cargo: 'GERENTE' }, 'cargo deve ser ADMIN, RECEPCIONISTA ou INSTRUTOR'],
    [{ ativo: 'talvez' }, 'ativo deve ser true ou false'],
    [{ ativo: '1' }, 'ativo deve ser true ou false'],
    [{ pageSize: '101' }, 'pageSize deve ser no máximo 100'],
  ])('%o → "%s"', async (query, mensagem) => {
    const { mensagens } = await validar(query);

    expect(mensagens).toContain(mensagem);
  });
});
