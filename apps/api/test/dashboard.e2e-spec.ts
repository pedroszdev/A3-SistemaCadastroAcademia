import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { hoje } from '../src/common/utils/date';
import { Cargo, StatusPagamento } from '../src/generated/prisma/enums';
import {
  bearer,
  criarApp,
  criarAtividade,
  criarMembro,
  criarPagamento,
  diasAtras,
  limparBanco,
  loginComo,
  prismaDe,
} from './utils';

describe('Dashboard (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await criarApp();
    const prisma = prismaDe(app);
    await limparBanco(prisma);

    const membroA = await criarMembro(prisma);
    const membroB = await criarMembro(prisma);
    const inativo = await criarMembro(prisma, { ativo: false });

    // RN09: 15 dias de atraso torna A inadimplente; 5 dias (B) ainda está na tolerância
    await criarPagamento(prisma, membroA.id, {
      dataVencimento: diasAtras(15),
    });
    await criarPagamento(prisma, membroB.id, { dataVencimento: diasAtras(5) });
    // o inativo com 15 dias de atraso conta nos atrasados, mas não nos inadimplentes
    await criarPagamento(prisma, inativo.id, {
      dataVencimento: diasAtras(15),
    });
    // cancelado vencido não conta como atraso nem como inadimplência
    await criarPagamento(prisma, membroB.id, {
      dataVencimento: diasAtras(20),
      status: StatusPagamento.CANCELADO,
    });
    // só o pago de hoje entra na receita; o do último dia do mês anterior não
    await criarPagamento(prisma, membroA.id, {
      valor: '100.00',
      status: StatusPagamento.PAGO,
      dataPagamento: hoje(),
    });
    await criarPagamento(prisma, membroA.id, {
      valor: '80.00',
      status: StatusPagamento.PAGO,
      dataVencimento: diasAtras(hoje().getUTCDate()),
      dataPagamento: diasAtras(hoje().getUTCDate()),
    });

    await criarAtividade(prisma, { membroId: membroA.id });
    await criarAtividade(prisma, {
      membroId: membroA.id,
      data: diasAtras(1),
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('sem token → 401', async () => {
    await request(app.getHttpServer()).get('/dashboard').expect(401);
  });

  it.each([Cargo.ADMIN, Cargo.RECEPCIONISTA, Cargo.INSTRUTOR])(
    '%s recebe os números do resumo',
    async (cargo) => {
      const { token } = await loginComo(app, cargo);

      const resposta = await request(app.getHttpServer())
        .get('/dashboard')
        .set('Authorization', bearer(token))
        .expect(200);

      expect(resposta.body).toEqual({
        membrosAtivos: 2,
        membrosInadimplentes: 1,
        pagamentosAtrasados: 3,
        receitaMes: 100,
        atividadesHoje: 1,
      });
    },
  );
});
