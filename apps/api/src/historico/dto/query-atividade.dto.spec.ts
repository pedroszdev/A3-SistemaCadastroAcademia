import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { QueryAtividadeDto } from './query-atividade.dto';

async function validar(query: Record<string, unknown>) {
  const dto = plainToInstance(QueryAtividadeDto, query);
  const erros = await validate(dto);
  const mensagens = erros.flatMap((e) => Object.values(e.constraints ?? {}));
  return { dto, mensagens };
}

describe('QueryAtividadeDto', () => {
  it('aceita query vazia com page 1 e pageSize 20', async () => {
    const { dto, mensagens } = await validar({});

    expect(mensagens).toEqual([]);
    expect(dto.page).toBe(1);
    expect(dto.pageSize).toBe(20);
  });

  it('converte dataDe e dataAte para Date', async () => {
    const { dto, mensagens } = await validar({
      dataDe: '2026-10-01',
      dataAte: '2026-10-31',
    });

    expect(mensagens).toEqual([]);
    expect(dto.dataDe?.toISOString()).toBe('2026-10-01T00:00:00.000Z');
    expect(dto.dataAte?.toISOString()).toBe('2026-10-31T00:00:00.000Z');
  });

  it('aceita todos os filtros juntos', async () => {
    const { mensagens } = await validar({
      membroId: '0199f0a2-7b3c-7d4e-8f00-123456789abc',
      funcionarioId: '0199f0a2-7b3c-7d4e-8f00-123456789abd',
      dataDe: '2026-10-01',
      dataAte: '2026-10-31',
      page: '2',
      pageSize: '50',
    });

    expect(mensagens).toEqual([]);
  });

  it.each([
    [{ membroId: 'abc' }, 'membroId deve ser um UUID válido'],
    [{ funcionarioId: 'abc' }, 'funcionarioId deve ser um UUID válido'],
    [
      { dataDe: '2026-02-30' },
      'dataDe deve ser uma data válida no formato AAAA-MM-DD',
    ],
    [
      { dataAte: '10/11/2026' },
      'dataAte deve ser uma data válida no formato AAAA-MM-DD',
    ],
    [{ pageSize: '101' }, 'pageSize deve ser no máximo 100'],
  ])('%o → "%s"', async (query, mensagem) => {
    const { mensagens } = await validar(query);

    expect(mensagens).toContain(mensagem);
  });
});
