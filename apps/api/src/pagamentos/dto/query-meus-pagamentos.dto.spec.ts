import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { QueryMeusPagamentosDto } from './query-meus-pagamentos.dto';

async function mensagens(query: Record<string, unknown>) {
  const erros = await validate(plainToInstance(QueryMeusPagamentosDto, query), {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return erros.flatMap((e) => Object.values(e.constraints ?? {}));
}

describe('QueryMeusPagamentosDto', () => {
  it.each(['PENDENTE', 'PAGO', 'ATRASADO', 'CANCELADO'])(
    'aceita o status %s',
    async (status) => {
      await expect(mensagens({ status })).resolves.toEqual([]);
    },
  );

  it('recusa outro status', async () => {
    await expect(mensagens({ status: 'PERDIDO' })).resolves.toEqual([
      'status deve ser PENDENTE, PAGO, ATRASADO ou CANCELADO',
    ]);
  });

  it('recusa o membroId, que vem do token (RN16)', async () => {
    await expect(
      mensagens({ membroId: '0199f0a2-7b3c-7d4e-8f00-123456789def' }),
    ).resolves.toHaveLength(1);
  });
});
