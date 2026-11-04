import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { diasEntre, hoje } from '../src/common/utils/date';
import { isCpfValido } from '../src/common/validators/cpf';
import { Cargo } from '../src/generated/prisma/enums';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  bearer,
  criarApp,
  criarAtividade,
  criarFuncionario,
  criarMembro,
  criarPagamento,
  criarTreino,
  diasAtras,
  limparBanco,
  loginComo,
  prismaDe,
} from './utils';

describe('Utilitários de e2e', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await criarApp();
    prisma = prismaDe(app);
  });

  beforeEach(async () => {
    await limparBanco(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('criarApp', () => {
    it('aplica o ValidationPipe do main.ts: campo extra no login → 400', async () => {
      const resposta = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ login: 'x', senha: 'y', extra: 1 })
        .expect(400);

      expect(JSON.stringify(resposta.body)).toContain('extra');
    });

    it('sobe o AppModule inteiro: GET /health → 200', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect({ status: 'ok' });
    });

    it('mantém o guard global: GET /auth/me sem token → 401', () => {
      return request(app.getHttpServer()).get('/auth/me').expect(401);
    });
  });

  describe('limparBanco', () => {
    it('esvazia todas as tabelas', async () => {
      const funcionario = await criarFuncionario(prisma);
      const membro = await criarMembro(prisma);
      const treino = await criarTreino(prisma, membro.id);
      await criarPagamento(prisma, membro.id);
      await criarAtividade(prisma, {
        membroId: membro.id,
        funcionarioId: funcionario.id,
        treinoId: treino.id,
      });

      await limparBanco(prisma);

      expect(await prisma.funcionario.count()).toBe(0);
      expect(await prisma.membro.count()).toBe(0);
      expect(await prisma.treino.count()).toBe(0);
      expect(await prisma.pagamento.count()).toBe(0);
      expect(await prisma.historicoAtividade.count()).toBe(0);
    });

    it('recusa rodar num banco cujo nome não termina em _test', async () => {
      const queryRaw = jest.fn().mockResolvedValue([{ nome: 'academia' }]);
      const executeRawUnsafe = jest.fn();
      const falso = {
        $queryRaw: queryRaw,
        $executeRawUnsafe: executeRawUnsafe,
      } as unknown as PrismaService;

      await expect(limparBanco(falso)).rejects.toThrow(/_test.*academia/);
      expect(executeRawUnsafe).not.toHaveBeenCalled();
    });
  });

  describe('loginComo', () => {
    it.each([Cargo.ADMIN, Cargo.RECEPCIONISTA, Cargo.INSTRUTOR])(
      'devolve um token válido para %s',
      async (cargo) => {
        const { token, funcionario } = await loginComo(app, cargo);

        const resposta = await request(app.getHttpServer())
          .get('/auth/me')
          .set('Authorization', bearer(token))
          .expect(200);

        expect(resposta.body).toMatchObject({
          id: funcionario.id,
          cargo,
          ativo: true,
        });
      },
    );
  });

  describe('fábricas', () => {
    it('criarMembro grava vários membros sem colidir no CPF', async () => {
      const a = await criarMembro(prisma);
      const b = await criarMembro(prisma);

      expect(a.cpf).not.toBe(b.cpf);
      expect(isCpfValido(a.cpf)).toBe(true);
      expect(isCpfValido(b.cpf)).toBe(true);
    });

    it('criarMembro respeita a sobrescrita parcial', async () => {
      const membro = await criarMembro(prisma, { nome: 'Fulano' });

      expect(membro.nome).toBe('Fulano');
      expect(membro.telefone).toMatch(/^\d+$/);
      expect(membro.ativo).toBe(true);
    });

    it('criarFuncionario grava vários funcionários sem colidir no login', async () => {
      const a = await criarFuncionario(prisma);
      const b = await criarFuncionario(prisma, { cargo: Cargo.INSTRUTOR });

      expect(a.login).not.toBe(b.login);
      expect(b.cargo).toBe(Cargo.INSTRUTOR);
      expect(a).not.toHaveProperty('senhaHash');
    });

    it('criarPagamento grava o dia de vencimento pedido', async () => {
      const membro = await criarMembro(prisma);

      const pagamento = await criarPagamento(prisma, membro.id, {
        dataVencimento: diasAtras(15),
      });

      expect(pagamento.membroId).toBe(membro.id);
      expect(pagamento.status).toBe('PENDENTE');
      expect(pagamento.dataPagamento).toBeNull();
      expect(diasEntre(pagamento.dataVencimento, hoje())).toBe(15);
    });

    it('criarTreino e criarAtividade ficam ligados ao membro', async () => {
      const membro = await criarMembro(prisma);

      const treino = await criarTreino(prisma, membro.id);
      const atividade = await criarAtividade(prisma, {
        membroId: membro.id,
        treinoId: treino.id,
      });

      expect(treino.membroId).toBe(membro.id);
      expect(atividade.membroId).toBe(membro.id);
      expect(atividade.treinoId).toBe(treino.id);
      expect(atividade.funcionarioId).toBeNull();
    });
  });

  describe('diasAtras', () => {
    it('devolve o dia de calendário n dias antes de hoje()', () => {
      expect(diasEntre(diasAtras(15), hoje())).toBe(15);
      expect(diasAtras(0).getTime()).toBe(hoje().getTime());
    });
  });
});
