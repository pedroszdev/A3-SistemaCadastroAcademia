import { INestApplication } from '@nestjs/common';
import { hashSync } from 'bcryptjs';
import request from 'supertest';
import { App } from 'supertest/types';
import { hoje } from '../src/common/utils/date';
import { Cargo } from '../src/generated/prisma/enums';
import { MensalidadesService } from '../src/mensalidades/mensalidades.service';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  bearer,
  criarApp,
  criarMembro,
  criarPagamento,
  criarTreino,
  diaIso,
  diasAtras,
  gerarCpf,
  limparBanco,
  loginComo,
  prismaDe,
  SENHA_PADRAO,
} from './utils';

// RN18 (mensalidade automática), RN19 (o aluno registra a própria atividade) e
// RN20 (cada um muda os próprios dados), com o AppModule e o banco reais.
describe('Mensalidade automática, atividade do aluno e meus dados (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let tokenRecepcao: string;

  beforeAll(async () => {
    app = await criarApp();
    prisma = prismaDe(app);
  });

  beforeEach(async () => {
    await limparBanco(prisma);
    tokenRecepcao = (await loginComo(app, Cargo.RECEPCIONISTA)).token;
  });

  afterAll(async () => {
    await app.close();
  });

  async function alunoLogado() {
    const membro = await criarMembro(prisma, {
      senhaHash: hashSync(SENHA_PADRAO, 4),
    });
    const resposta = await request(app.getHttpServer())
      .post('/auth/login-aluno')
      .send({ cpf: membro.cpf, senha: SENHA_PADRAO })
      .expect(200);
    const token = (resposta.body as { accessToken: string }).accessToken;
    return { membro, token };
  }

  describe('RN18 · mensalidade automática', () => {
    it('o cadastro sem valor da mensalidade → 400', async () => {
      await request(app.getHttpServer())
        .post('/membros')
        .set('Authorization', bearer(tokenRecepcao))
        .send({
          nome: 'Sem Plano',
          cpf: gerarCpf(),
          telefone: '48999990000',
          endereco: 'Rua Fictícia, 1',
        })
        .expect(400);
    });

    it('o cadastro gera a primeira cobrança e a rotina não duplica', async () => {
      const criado = await request(app.getHttpServer())
        .post('/membros')
        .set('Authorization', bearer(tokenRecepcao))
        .send({
          nome: 'Com Plano',
          cpf: gerarCpf(),
          telefone: '48999990000',
          endereco: 'Rua Fictícia, 2',
          valorMensalidade: 89.9,
        })
        .expect(201);
      const { id } = criado.body as { id: string };
      expect(criado.body).toMatchObject({
        valorMensalidade: 89.9,
        diaVencimento: hoje().getUTCDate(),
      });

      await app.get(MensalidadesService).gerarPendentes();

      const pagamentos = await prisma.pagamento.findMany({
        where: { membroId: id },
      });
      expect(pagamentos).toHaveLength(1);
      expect(pagamentos[0].valor.toNumber()).toBe(89.9);
      expect(pagamentos[0].dataVencimento).toEqual(hoje());
    });

    it('depois do vencimento, a rotina cria a do mês seguinte', async () => {
      const membro = await criarMembro(prisma, {
        valorMensalidade: 120,
        diaVencimento: diasAtras(1).getUTCDate(),
      });
      await criarPagamento(prisma, membro.id, { dataVencimento: diasAtras(1) });

      await app.get(MensalidadesService).gerarPendentes();

      const datas = (
        await prisma.pagamento.findMany({
          where: { membroId: membro.id },
          orderBy: { dataVencimento: 'asc' },
        })
      ).map((p) => p.dataVencimento);
      expect(datas).toHaveLength(2);
      expect(datas[1] > hoje()).toBe(true);
    });

    it('membro inativo não ganha cobrança', async () => {
      const membro = await criarMembro(prisma, {
        ativo: false,
        valorMensalidade: 120,
        diaVencimento: 10,
      });

      await app.get(MensalidadesService).gerarPendentes();

      expect(
        await prisma.pagamento.count({ where: { membroId: membro.id } }),
      ).toBe(0);
    });

    it('desativar cancela a cobrança que ainda não venceu e reativar não deixa inadimplente', async () => {
      // A cobrança que a rotina teria criado com o membro ativo: vence daqui a 5 dias.
      const vencimento = diasAtras(-5);
      const membro = await criarMembro(prisma, {
        valorMensalidade: 120,
        diaVencimento: vencimento.getUTCDate(),
      });
      const futura = await criarPagamento(prisma, membro.id, {
        dataVencimento: vencimento,
      });

      await request(app.getHttpServer())
        .patch(`/membros/${membro.id}/desativar`)
        .set('Authorization', bearer(tokenRecepcao))
        .expect(200);
      expect(
        (
          await prisma.pagamento.findUniqueOrThrow({
            where: { id: futura.id },
          })
        ).status,
      ).toBe('CANCELADO');

      await request(app.getHttpServer())
        .patch(`/membros/${membro.id}/reativar`)
        .set('Authorization', bearer(tokenRecepcao))
        .expect(200);
      expect(
        await prisma.pagamento.count({
          where: {
            membroId: membro.id,
            status: 'PENDENTE',
            dataVencimento: { gte: hoje() },
          },
        }),
      ).toBe(1);

      const situacao = await request(app.getHttpServer())
        .get(`/membros/${membro.id}/situacao`)
        .set('Authorization', bearer(tokenRecepcao))
        .expect(200);
      expect(situacao.body).toMatchObject({ situacao: 'EM_DIA' });
    });

    it('desativar mantém a cobrança já vencida como dívida', async () => {
      const membro = await criarMembro(prisma, {
        valorMensalidade: 120,
        diaVencimento: diasAtras(15).getUTCDate(),
      });
      const vencida = await criarPagamento(prisma, membro.id, {
        dataVencimento: diasAtras(15),
      });

      await request(app.getHttpServer())
        .patch(`/membros/${membro.id}/desativar`)
        .set('Authorization', bearer(tokenRecepcao))
        .expect(200);

      expect(
        (
          await prisma.pagamento.findUniqueOrThrow({
            where: { id: vencida.id },
          })
        ).status,
      ).toBe('PENDENTE');
    });
  });

  describe('RN19 · atividade registrada pelo aluno', () => {
    it('num treino dele → 201, sem funcionário', async () => {
      const { membro, token } = await alunoLogado();
      const treino = await criarTreino(prisma, membro.id);

      const criada = await request(app.getHttpServer())
        .post('/me/atividades')
        .set('Authorization', bearer(token))
        .send({ treinoId: treino.id, data: diaIso(hoje()), tempoExecucao: 45 })
        .expect(201);

      expect(criada.body).toMatchObject({
        treinoId: treino.id,
        atividade: treino.descricao,
        tempoExecucao: 45,
        funcionario: null,
      });
    });

    it('sem treino → 400', async () => {
      const { token } = await alunoLogado();

      await request(app.getHttpServer())
        .post('/me/atividades')
        .set('Authorization', bearer(token))
        .send({ data: diaIso(hoje()), tempoExecucao: 45 })
        .expect(400);
    });

    it('no treino de outro membro → 404 (RN16)', async () => {
      const { token } = await alunoLogado();
      const outro = await criarMembro(prisma);
      const treinoDoOutro = await criarTreino(prisma, outro.id);

      await request(app.getHttpServer())
        .post('/me/atividades')
        .set('Authorization', bearer(token))
        .send({
          treinoId: treinoDoOutro.id,
          data: diaIso(hoje()),
          tempoExecucao: 45,
        })
        .expect(404);
      expect(await prisma.historicoAtividade.count()).toBe(0);
    });

    it('inadimplente → 422 (RN09)', async () => {
      const { membro, token } = await alunoLogado();
      const treino = await criarTreino(prisma, membro.id);
      await criarPagamento(prisma, membro.id, {
        dataVencimento: diasAtras(15),
      });

      await request(app.getHttpServer())
        .post('/me/atividades')
        .set('Authorization', bearer(token))
        .send({ treinoId: treino.id, data: diaIso(hoje()), tempoExecucao: 45 })
        .expect(422);
    });
  });

  describe('pagamentos do aluno', () => {
    it('lista só os próprios, com o status calculado, e o resumo', async () => {
      const { membro, token } = await alunoLogado();
      const outro = await criarMembro(prisma);
      await criarPagamento(prisma, membro.id, { dataVencimento: diasAtras(3) });
      await criarPagamento(prisma, outro.id);

      const lista = await request(app.getHttpServer())
        .get('/me/pagamentos')
        .set('Authorization', bearer(token))
        .expect(200);
      expect(lista.body).toMatchObject({
        total: 1,
        data: [{ membroId: membro.id, status: 'ATRASADO', diasEmAtraso: 3 }],
      });

      const resumo = await request(app.getHttpServer())
        .get('/me/pagamentos/resumo')
        .set('Authorization', bearer(token))
        .expect(200);
      expect(resumo.body).toMatchObject({
        situacao: 'EM_DIA',
        pagamentosAtrasados: 1,
        maiorAtrasoDias: 3,
        proximoPagamento: null,
      });
    });

    it('membroId na query → 400 (RN16)', async () => {
      const { token } = await alunoLogado();
      const outro = await criarMembro(prisma);

      await request(app.getHttpServer())
        .get(`/me/pagamentos?membroId=${outro.id}`)
        .set('Authorization', bearer(token))
        .expect(400);
    });
  });

  describe('RN20 · meus dados', () => {
    it('o aluno muda telefone e endereço, mas não o nome', async () => {
      const { token } = await alunoLogado();

      const atualizado = await request(app.getHttpServer())
        .patch('/auth/me')
        .set('Authorization', bearer(token))
        .send({ telefone: '(48) 98888-7777', endereco: 'Rua Nova, 20' })
        .expect(200);
      expect(atualizado.body).toMatchObject({
        telefone: '48988887777',
        endereco: 'Rua Nova, 20',
      });
      expect(atualizado.body).not.toHaveProperty('senhaHash');

      await request(app.getHttpServer())
        .patch('/auth/me')
        .set('Authorization', bearer(token))
        .send({ nome: 'Outro Nome' })
        .expect(400);
    });

    it('o funcionário muda o nome e troca a senha com a atual certa', async () => {
      const { token, funcionario } = await loginComo(app, Cargo.INSTRUTOR);

      await request(app.getHttpServer())
        .patch('/auth/me')
        .set('Authorization', bearer(token))
        .send({ nome: 'Instrutor Renomeado' })
        .expect(200);

      await request(app.getHttpServer())
        .patch('/auth/me/senha')
        .set('Authorization', bearer(token))
        .send({ senhaAtual: 'errada-123', novaSenha: 'nova-senha-123' })
        .expect(422);
      await request(app.getHttpServer())
        .patch('/auth/me/senha')
        .set('Authorization', bearer(token))
        .send({ senhaAtual: funcionario.senha, novaSenha: 'nova-senha-123' })
        .expect(204);

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ login: funcionario.login, senha: 'nova-senha-123' })
        .expect(200);
    });
  });
});
