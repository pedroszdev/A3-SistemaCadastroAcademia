import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PaginationQueryDto } from './pagination-query.dto';

async function validar(query: Record<string, unknown>) {
  const dto = plainToInstance(PaginationQueryDto, query);
  const erros = await validate(dto);
  const mensagens = erros.flatMap((e) => Object.values(e.constraints ?? {}));
  return { dto, mensagens };
}

describe('PaginationQueryDto', () => {
  it('usa page 1 e pageSize 20 quando nada é informado', async () => {
    const { dto, mensagens } = await validar({});

    expect(mensagens).toEqual([]);
    expect(dto.page).toBe(1);
    expect(dto.pageSize).toBe(20);
  });

  it('converte os valores da query string para número', async () => {
    const { dto, mensagens } = await validar({ page: '2', pageSize: '50' });

    expect(mensagens).toEqual([]);
    expect(dto.page).toBe(2);
    expect(dto.pageSize).toBe(50);
  });

  it('aceita pageSize no limite de 100', async () => {
    const { mensagens } = await validar({ pageSize: '100' });

    expect(mensagens).toEqual([]);
  });

  it.each([
    [{ page: '0' }, 'page deve ser no mínimo 1'],
    [{ page: 'abc' }, 'page deve ser um número inteiro'],
    [{ page: '1.5' }, 'page deve ser um número inteiro'],
    [{ pageSize: '0' }, 'pageSize deve ser no mínimo 1'],
    [{ pageSize: '101' }, 'pageSize deve ser no máximo 100'],
    [{ pageSize: 'abc' }, 'pageSize deve ser um número inteiro'],
  ])('%o → "%s"', async (query, mensagem) => {
    const { mensagens } = await validar(query);

    expect(mensagens).toContain(mensagem);
  });
});
