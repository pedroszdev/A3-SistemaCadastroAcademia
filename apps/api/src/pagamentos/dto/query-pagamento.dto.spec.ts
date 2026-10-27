import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  QueryPagamentoDto,
  STATUS_FILTRO_PAGAMENTO,
} from './query-pagamento.dto';

async function validar(query: Record<string, unknown>) {
  const dto = plainToInstance(QueryPagamentoDto, query);
  const erros = await validate(dto);
  const mensagens = erros.flatMap((e) => Object.values(e.constraints ?? {}));
  return { dto, mensagens };
}

describe('QueryPagamentoDto', () => {
  it('aceita query vazia com page 1 e pageSize 20', async () => {
    const { dto, mensagens } = await validar({});

    expect(mensagens).toEqual([]);
    expect(dto.page).toBe(1);
    expect(dto.pageSize).toBe(20);
  });

  it.each(STATUS_FILTRO_PAGAMENTO.map((status) => [status]))(
    'aceita status %s',
    async (status) => {
      const { mensagens } = await validar({ status });

      expect(mensagens).toEqual([]);
    },
  );

  it('converte vencimentoDe e vencimentoAte para Date', async () => {
    const { dto, mensagens } = await validar({
      vencimentoDe: '2026-10-01',
      vencimentoAte: '2026-10-31',
    });

    expect(mensagens).toEqual([]);
    expect(dto.vencimentoDe?.toISOString()).toBe('2026-10-01T00:00:00.000Z');
    expect(dto.vencimentoAte?.toISOString()).toBe('2026-10-31T00:00:00.000Z');
  });

  it('aceita todos os filtros juntos', async () => {
    const { mensagens } = await validar({
      membroId: '0199f0a2-7b3c-7d4e-8f00-123456789abc',
      status: 'ATRASADO',
      vencimentoDe: '2026-10-01',
      vencimentoAte: '2026-10-31',
      page: '2',
      pageSize: '50',
    });

    expect(mensagens).toEqual([]);
  });

  it.each([
    [
      { status: 'VENCIDO' },
      'status deve ser PENDENTE, PAGO, ATRASADO ou CANCELADO',
    ],
    [{ membroId: 'abc' }, 'membroId deve ser um UUID válido'],
    [
      { vencimentoDe: '2026-02-30' },
      'vencimentoDe deve ser uma data válida no formato AAAA-MM-DD',
    ],
    [
      { vencimentoAte: '10/11/2026' },
      'vencimentoAte deve ser uma data válida no formato AAAA-MM-DD',
    ],
    [{ pageSize: '101' }, 'pageSize deve ser no máximo 100'],
  ])('%o → "%s"', async (query, mensagem) => {
    const { mensagens } = await validar(query);

    expect(mensagens).toContain(mensagem);
  });
});
