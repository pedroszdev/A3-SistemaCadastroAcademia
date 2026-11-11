import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { hoje } from '../src/common/utils/date';
import { Cargo } from '../src/generated/prisma/enums';
import {
  bearer,
  criarApp,
  criarFuncionario,
  diaIso,
  diasAtras,
  gerarCpf,
  limparBanco,
  loginComo,
  prismaDe,
  SENHA_PADRAO,
} from './utils';

// Teste de sistema do fluxo principal (docs/ESCOPO.md, seção 7), com banco real.
// Cada etapa verifica um critério de aceitação, na ordem do fluxo:
//
//   etapa 1 · Login do funcionário       → CA01 (POST /auth/login e GET /auth/me)
//   etapa 2 · Cadastrar membro           → CA02 (POST /membros e GET /membros)
//   etapa 3 · Criar treino               → CA03 (POST /treinos e GET /membros/:id/treinos)
//   etapa 4 · Lançar pagamento           → CA04 (POST /pagamentos)
//   etapa 5 · Registrar o pagamento      → CA05 (PATCH /pagamentos/:id/pagar)
//   etapa 6 · Registrar atividade        → CA06 (POST /atividades)
//   etapa 7 · Consultar o histórico      → CA07 (GET /membros/:id/atividades)
//   etapa 8 · Conferir o dashboard       → CA08 (GET /dashboard)
//
// As etapas dependem umas das outras: o Jest roda os `it` de um arquivo em
// ordem, e o estado (membro, treino, pagamento, atividade) passa de uma para a
// próxima. Os cenários de inadimplência (CA09 em diante) ficam no
// inadimplencia.e2e-spec.ts (E2E-03).

const OITO_HORAS_EM_SEGUNDOS = 8 * 60 * 60;
const DIAS_ATE_O_VENCIMENTO = 5;
const NOME_RECEPCIONISTA = 'Recepcionista Fluxo E2E';

describe('Fluxo principal (e2e) — CA01 a CA08', () => {
  let app: INestApplication<App>;

  // estado compartilhado entre as etapas
  let tokenRecepcao: string;
  let recepcionistaId: string;
  let tokenInstrutor: string;
  let instrutorId: string;
  let instrutorNome: string;
  let membroId: string;
  let treinoId: string;
  let pagamentoId: string;
  let atividadeId: string;

  const cpf = gerarCpf();
  const dataHoje = hoje();

  beforeAll(async () => {
    app = await criarApp();
    // banco zerado: o dashboard do CA08 precisa contar só os dados deste fluxo
    await limparBanco(prismaDe(app));
  });

  afterAll(async () => {
    await app.close();
  });

  it('CA01 · login do funcionário: token válido por 8 horas e GET /auth/me devolve o cargo', async () => {
    // Dado: um funcionário ativo com login e senha válidos
    const recepcionista = await criarFuncionario(prismaDe(app), {
      nome: NOME_RECEPCIONISTA,
      cargo: Cargo.RECEPCIONISTA,
    });
    recepcionistaId = recepcionista.id;

    // Quando: ele faz login
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ login: recepcionista.login, senha: SENHA_PADRAO })
      .expect(200);

    // Então: recebe um token válido por 8 horas...
    const { accessToken } = login.body as { accessToken: string };
    expect(typeof accessToken).toBe('string');
    expect(accessToken).not.toBe('');
    const payload = JSON.parse(
      Buffer.from(accessToken.split('.')[1], 'base64url').toString('utf8'),
    ) as { iat: number; exp: number };
    expect(payload.exp - payload.iat).toBe(OITO_HORAS_EM_SEGUNDOS);
    tokenRecepcao = accessToken;

    // ... e GET /auth/me com esse token devolve o seu cargo
    const me = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', bearer(tokenRecepcao))
      .expect(200);
    expect(me.body).toMatchObject({
      id: recepcionistaId,
      nome: NOME_RECEPCIONISTA,
      cargo: 'RECEPCIONISTA',
    });
  });

  it('CA02 · cadastrar membro: o membro fica ativo e aparece na lista de membros', async () => {
    // Dado: uma recepcionista logada (CA01) e um CPF válido ainda não cadastrado
    // Quando: ela cadastra o membro
    const criado = await request(app.getHttpServer())
      .post('/membros')
      .set('Authorization', bearer(tokenRecepcao))
      .send({
        nome: 'Membro Fluxo E2E',
        cpf,
        telefone: '48999990000',
        endereco: 'Rua Fictícia, 100',
      })
      .expect(201);

    // Então: o membro fica ativo...
    expect(criado.body).toMatchObject({
      nome: 'Membro Fluxo E2E',
      cpf,
      ativo: true,
    });
    membroId = (criado.body as { id: string }).id;

    // ... e aparece na lista de membros
    const lista = await request(app.getHttpServer())
      .get('/membros')
      .set('Authorization', bearer(tokenRecepcao))
      .expect(200);
    const { data } = lista.body as { data: { id: string; ativo: boolean }[] };
    expect(data.find((membro) => membro.id === membroId)).toMatchObject({
      ativo: true,
    });
  });

  it('CA03 · criar treino: o treino fica vinculado ao membro', async () => {
    // Dado: um instrutor logado (login real) e um membro ativo (CA02)
    const instrutor = await loginComo(app, Cargo.INSTRUTOR);
    tokenInstrutor = instrutor.token;
    instrutorId = instrutor.funcionario.id;
    instrutorNome = instrutor.funcionario.nome;

    // Quando: ele cria um treino com tipo da lista, duração entre 1 e 300 min
    // e início a partir de hoje
    const criado = await request(app.getHttpServer())
      .post('/treinos')
      .set('Authorization', bearer(tokenInstrutor))
      .send({
        membroId,
        tipo: 'Musculação',
        descricao: 'Treino de força do fluxo principal',
        duracao: 60,
        dataInicio: diaIso(dataHoje),
      })
      .expect(201);

    // Então: o treino fica vinculado ao membro
    expect(criado.body).toMatchObject({
      membroId,
      tipo: 'Musculação',
      duracao: 60,
      dataInicio: dataHoje.toISOString(),
    });
    treinoId = (criado.body as { id: string }).id;

    const doMembro = await request(app.getHttpServer())
      .get(`/membros/${membroId}/treinos`)
      .set('Authorization', bearer(tokenRecepcao))
      .expect(200);
    const { data } = doMembro.body as { data: { id: string }[] };
    expect(data.map((treino) => treino.id)).toEqual([treinoId]);
  });

  it('CA04 · lançar pagamento: mensalidade de R$ 100,00 com vencimento futuro nasce PENDENTE', async () => {
    // Dado: uma recepcionista logada e um membro ativo
    // Quando: ela lança uma mensalidade de R$ 100,00 com vencimento futuro
    const vencimento = diasAtras(-DIAS_ATE_O_VENCIMENTO);
    const criado = await request(app.getHttpServer())
      .post('/pagamentos')
      .set('Authorization', bearer(tokenRecepcao))
      .send({
        membroId,
        valor: 100,
        dataVencimento: diaIso(vencimento),
      })
      .expect(201);

    // Então: o pagamento é criado com status PENDENTE
    expect(criado.body).toMatchObject({
      membroId,
      valor: 100,
      status: 'PENDENTE',
      dataVencimento: vencimento.toISOString(),
      dataPagamento: null,
      diasEmAtraso: 0,
    });
    pagamentoId = (criado.body as { id: string }).id;
  });

  it('CA05 · registrar pagamento: sem informar a data, o status passa a PAGO com a data de hoje', async () => {
    // Dado: um pagamento PENDENTE (CA04)
    // Quando: a recepcionista registra o pagamento sem informar a data
    const pago = await request(app.getHttpServer())
      .patch(`/pagamentos/${pagamentoId}/pagar`)
      .set('Authorization', bearer(tokenRecepcao))
      .send({})
      .expect(200);

    // Então: o status passa a PAGO, com a data de hoje
    expect(pago.body).toMatchObject({
      id: pagamentoId,
      valor: 100,
      status: 'PAGO',
      dataPagamento: dataHoje.toISOString(),
    });
  });

  it('CA06 · registrar atividade: atividade de 60 min com data de hoje gravada com o instrutor como responsável', async () => {
    // Dado: um instrutor logado, um membro ativo e em dia (CA05) e o treino do CA03
    // Quando: ele registra uma atividade de 60 min com data de hoje
    const criada = await request(app.getHttpServer())
      .post('/atividades')
      .set('Authorization', bearer(tokenInstrutor))
      .send({
        membroId,
        treinoId,
        atividade: 'Supino reto',
        data: diaIso(dataHoje),
        tempoExecucao: 60,
      })
      .expect(201);

    // Então: a atividade é gravada com o instrutor como responsável (RN11)
    expect(criada.body).toMatchObject({
      membroId,
      treinoId,
      atividade: 'Supino reto',
      data: dataHoje.toISOString(),
      tempoExecucao: 60,
      funcionarioId: instrutorId,
      funcionario: { id: instrutorId },
    });
    atividadeId = (criada.body as { id: string }).id;
  });

  it('CA07 · consultar histórico: a atividade aparece no histórico do membro, com o nome do instrutor e os 60 minutos', async () => {
    // Dado: o membro com a atividade do CA06
    // Quando: a recepcionista consulta o histórico do membro
    const historico = await request(app.getHttpServer())
      .get(`/membros/${membroId}/atividades`)
      .set('Authorization', bearer(tokenRecepcao))
      .expect(200);

    // Então: a atividade aparece no histórico, com o nome do instrutor e os 60 minutos
    const corpo = historico.body as { data: unknown[]; total: number };
    expect(corpo.total).toBe(1);
    expect(corpo.data).toHaveLength(1);
    expect(corpo.data[0]).toMatchObject({
      id: atividadeId,
      membroId,
      tempoExecucao: 60,
      funcionario: { id: instrutorId, nome: instrutorNome },
    });
  });

  it('CA08 · conferir o dashboard: membro ativo, R$ 100,00 na receita do mês e a atividade em atividades de hoje', async () => {
    // Dado: o membro, o pagamento e a atividade dos CA02 a CA06
    // Quando: a recepcionista consulta o dashboard
    const dashboard = await request(app.getHttpServer())
      .get('/dashboard')
      .set('Authorization', bearer(tokenRecepcao))
      .expect(200);

    // Então: o membro conta nos membros ativos, os R$ 100,00 entram na receita
    // do mês e a atividade entra nas atividades de hoje (nada em atraso)
    expect(dashboard.body).toEqual({
      membrosAtivos: 1,
      membrosInadimplentes: 0,
      pagamentosAtrasados: 0,
      receitaMes: 100,
      atividadesHoje: 1,
    });
  });
});
