import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { QueryMembroDto } from './query-membro.dto';

async function validar(query: Record<string, unknown>) {
  const dto = plainToInstance(QueryMembroDto, query);
  const erros = await validate(dto);
  const mensagens = erros.flatMap((e) => Object.values(e.constraints ?? {}));
  return { dto, mensagens };
}

describe('QueryMembroDto', () => {
  it('aceita query vazia com page 1 e pageSize 20', async () => {
    const { dto, mensagens } = await validar({});

    expect(mensagens).toEqual([]);
    expect(dto.page).toBe(1);
    expect(dto.pageSize).toBe(20);
    expect(dto.busca).toBeUndefined();
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

  it('apara a busca e aceita paginação', async () => {
    const { dto, mensagens } = await validar({
      busca: '  ana ',
      page: '3',
      pageSize: '10',
    });

    expect(mensagens).toEqual([]);
    expect(dto.busca).toBe('ana');
    expect(dto.page).toBe(3);
    expect(dto.pageSize).toBe(10);
  });

  it.each([
    [{ ativo: 'sim' }, 'ativo deve ser true ou false'],
    [{ busca: 'a'.repeat(121) }, 'busca deve ter no máximo 120 caracteres'],
    [{ busca: ['ana', 'bia'] }, 'busca deve ser um texto'],
    [{ page: '0' }, 'page deve ser no mínimo 1'],
    [{ pageSize: '101' }, 'pageSize deve ser no máximo 100'],
  ])('%o → "%s"', async (query, mensagem) => {
    const { mensagens } = await validar(query);

    expect(mensagens).toContain(mensagem);
  });
});
