import { INestApplication } from '@nestjs/common';
import { hashSync } from 'bcryptjs';
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
  SENHA_PADRAO,
} from './utils';

describe('Dashboard (e2e)', () => {
  let app: INestApplication<App>;
  let cpfAluno: string;
  let membroA: { id: string; nome: string };

  beforeAll(async () => {
    app = await criarApp();
    const prisma = prismaDe(app);
    await limparBanco(prisma);

    membroA = await criarMembro(prisma);
    // B tem acesso ao portal (AUTH-04) para o teste do aluno, sem mudar as contagens
    const membroB = await criarMembro(prisma, {
      senhaHash: hashSync(SENHA_PADRAO, 4),
    });
    cpfAluno = membroB.cpf;
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

  it('aluno → 403 (RN17)', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login-aluno')
      .send({ cpf: cpfAluno, senha: SENHA_PADRAO })
      .expect(200);
    const { accessToken } = login.body as { accessToken: string };

    await request(app.getHttpServer())
      .get('/dashboard')
      .set('Authorization', bearer(accessToken))
      .expect(403);
  });

  it.each([Cargo.ADMIN, Cargo.RECEPCIONISTA])(
    '%s recebe a lista de inadimplentes',
    async (cargo) => {
      const { token } = await loginComo(app, cargo);

      const resposta = await request(app.getHttpServer())
        .get('/dashboard/inadimplentes')
        .set('Authorization', bearer(token))
        .expect(200);

      expect(resposta.body).toEqual([
        { id: membroA.id, nome: membroA.nome, maiorAtrasoDias: 15 },
      ]);
    },
  );

  it('instrutor não vê a lista de inadimplentes → 403', async () => {
    const { token } = await loginComo(app, Cargo.INSTRUTOR);

    await request(app.getHttpServer())
      .get('/dashboard/inadimplentes')
      .set('Authorization', bearer(token))
      .expect(403);
  });

  it('aluno não vê a lista de inadimplentes → 403', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login-aluno')
      .send({ cpf: cpfAluno, senha: SENHA_PADRAO })
      .expect(200);
    const { accessToken } = login.body as { accessToken: string };

    await request(app.getHttpServer())
      .get('/dashboard/inadimplentes')
      .set('Authorization', bearer(accessToken))
      .expect(403);
  });
});
