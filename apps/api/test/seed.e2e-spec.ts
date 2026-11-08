import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { seed } from '../prisma/seed';
import { isCpfValido } from '../src/common/validators/cpf';
import { hoje } from '../src/common/utils/date';
import { StatusPagamento } from '../src/generated/prisma/enums';
import {
  calcularStatus,
  DIAS_TOLERANCIA,
} from '../src/pagamentos/pagamento-status';
import {
  bearer,
  criarApp,
  criarFuncionario,
  criarMembro,
  diasAtras,
  limparBanco,
  noMesmoDia,
  prismaDe,
} from './utils';

const SENHA_SEED = 'senha1234';
const CPF_ANA = '41872395619';
const CPF_BRUNO = '15350946056';
const CPF_CARLA = '71460238184';
const TIPOS_TREINO = [
  'Musculação',
  'Cardio',
  'Funcional',
  'Alongamento',
  'Crossfit',
  'Outro',
];

describe('Seed (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: ReturnType<typeof prismaDe>;
  let idsPrimeiraExecucao: string[];

  beforeAll(async () => {
    app = await criarApp();
    prisma = prismaDe(app);
  });

  beforeEach(async () => {
    await limparBanco(prisma);
    await seed(prisma);
    idsPrimeiraExecucao = (await prisma.membro.findMany()).map(({ id }) => id);
    await seed(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  async function tokenAdmin(): Promise<string> {
    const resposta = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ login: 'admin', senha: SENHA_SEED })
      .expect(200);
    return (resposta.body as { accessToken: string }).accessToken;
  }

  async function dashboard(): Promise<unknown> {
    const token = await tokenAdmin();
    const resposta = await request(app.getHttpServer())
      .get('/dashboard')
      .set('Authorization', bearer(token))
      .expect(200);
    return resposta.body;
  }

  async function idDoMembro(cpf: string): Promise<string> {
    const membro = await prisma.membro.findUniqueOrThrow({ where: { cpf } });
    return membro.id;
  }

  it('rodar duas vezes mantém as contagens e os ids dos membros', async () => {
    expect(await prisma.funcionario.count()).toBe(3);
    expect(await prisma.membro.count()).toBe(10);
    expect(await prisma.membro.count({ where: { ativo: true } })).toBe(8);
    expect(await prisma.membro.count({ where: { ativo: false } })).toBe(2);
    expect(
      await prisma.membro.count({ where: { senhaHash: { not: null } } }),
    ).toBe(2);
    expect(await prisma.treino.count()).toBe(9);
    expect(await prisma.pagamento.count()).toBe(15);
    expect(await prisma.historicoAtividade.count()).toBe(30);

    const ids = (await prisma.membro.findMany()).map(({ id }) => id);
    expect(ids.sort()).toEqual([...idsPrimeiraExecucao].sort());
  });

  it('recusa rodar em produção, sem tocar no banco', async () => {
    const bruno = await idDoMembro(CPF_BRUNO);
    await prisma.pagamento.updateMany({
      where: { membroId: bruno, dataPagamento: null },
      data: { dataPagamento: hoje(), status: StatusPagamento.PAGO },
    });

    const nodeEnvOriginal = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      await expect(seed(prisma)).rejects.toThrow(
        'O seed não pode rodar em produção',
      );
    } finally {
      process.env.NODE_ENV = nodeEnvOriginal;
    }

    expect(
      await prisma.pagamento.count({
        where: { membroId: bruno, dataPagamento: null },
      }),
    ).toBe(0);
  });

  it('os 10 CPFs são válidos (RN01)', async () => {
    const membros = await prisma.membro.findMany();
    expect(membros.every(({ cpf }) => isCpfValido(cpf))).toBe(true);
  });

  it('pagamentos cobrem os 4 status, sem duplicar cobrança (RN06)', async () => {
    const pagamentos = await prisma.pagamento.findMany();

    const status = new Set(pagamentos.map((p) => calcularStatus(p)));
    expect(status).toEqual(
      new Set(['PAGO', 'PENDENTE', 'ATRASADO', 'CANCELADO']),
    );

    const chaves = pagamentos
      .filter((p) => p.status !== StatusPagamento.CANCELADO)
      .map((p) => `${p.membroId}|${p.dataVencimento.toISOString()}`);
    expect(new Set(chaves).size).toBe(chaves.length);

    for (const pagamento of pagamentos) {
      const valor = pagamento.valor.toNumber();
      expect(valor).toBeGreaterThan(0);
      expect(valor).toBeLessThanOrEqual(10_000);
    }
  });

  it('só o Bruno é inadimplente; Carla, com 5 dias de atraso, está em dia (RN09)', async () => {
    const situacao = async (token: string, cpf: string) => {
      const id = await idDoMembro(cpf);
      const resposta = await request(app.getHttpServer())
        .get(`/membros/${id}/situacao`)
        .set('Authorization', bearer(token))
        .expect(200);
      return resposta.body as { situacao: string; maiorAtrasoDias: number };
    };

    // O atraso é contado na hora da requisição: refaz o seed se o dia virar.
    const [bruno, carla] = await noMesmoDia(async () => {
      await seed(prisma);
      const token = await tokenAdmin();
      return [
        await situacao(token, CPF_BRUNO),
        await situacao(token, CPF_CARLA),
      ];
    });

    expect(bruno).toMatchObject({
      situacao: 'INADIMPLENTE',
      maiorAtrasoDias: 15,
    });
    expect(carla).toMatchObject({ situacao: 'EM_DIA', maiorAtrasoDias: 5 });
  });

  it('atividades respeitam data, tempo, treino do próprio membro (RN10) e a inadimplência do Bruno', async () => {
    const atividades = await prisma.historicoAtividade.findMany({
      include: { treino: true },
    });
    const bruno = await idDoMembro(CPF_BRUNO);
    // A cobrança do Bruno venceu há 15 dias; ele passa de DIAS_TOLERANCIA dias de
    // atraso, e vira inadimplente, neste dia.
    const diaDaInadimplencia = diasAtras(15 - DIAS_TOLERANCIA - 1);

    for (const atividade of atividades) {
      expect(atividade.data.getTime()).toBeLessThanOrEqual(hoje().getTime());
      expect(atividade.tempoExecucao).toBeGreaterThanOrEqual(1);
      expect(atividade.tempoExecucao).toBeLessThanOrEqual(600);
      if (atividade.treino) {
        expect(atividade.treino.membroId).toBe(atividade.membroId);
        expect(atividade.data.getTime()).toBeGreaterThanOrEqual(
          atividade.treino.dataInicio.getTime(),
        );
      }
      if (atividade.membroId === bruno) {
        expect(atividade.data.getTime()).toBeLessThan(
          diaDaInadimplencia.getTime(),
        );
      }
    }
  });

  it('treinos têm tipo da lista (RN05) e duração entre 1 e 300', async () => {
    const treinos = await prisma.treino.findMany();
    for (const treino of treinos) {
      expect(TIPOS_TREINO).toContain(treino.tipo);
      expect(treino.duracao).toBeGreaterThanOrEqual(1);
      expect(treino.duracao).toBeLessThanOrEqual(300);
    }
  });

  it('GET /dashboard devolve os números da demonstração', async () => {
    const resposta = await noMesmoDia(async () => {
      await seed(prisma);
      return dashboard();
    });

    expect(resposta).toEqual({
      membrosAtivos: 8,
      membrosInadimplentes: 1,
      pagamentosAtrasados: 2,
      receitaMes: 369.9,
      atividadesHoje: 3,
    });
  });

  it('os 2 alunos logam com CPF e senha; o admin loga com login e senha', async () => {
    for (const cpf of [CPF_ANA, CPF_BRUNO]) {
      await request(app.getHttpServer())
        .post('/auth/login-aluno')
        .send({ cpf, senha: SENHA_SEED })
        .expect(200);
    }
    await tokenAdmin();
  });

  it('rodar de novo não mexe em quem não é do seed e restaura a demo', async () => {
    const outroMembro = await criarMembro(prisma);
    const outroFuncionario = await criarFuncionario(prisma);

    const bruno = await idDoMembro(CPF_BRUNO);
    await prisma.pagamento.updateMany({
      where: { membroId: bruno, dataPagamento: null },
      data: { dataPagamento: hoje(), status: StatusPagamento.PAGO },
    });
    expect(await dashboard()).toMatchObject({ membrosInadimplentes: 0 });

    await noMesmoDia(async () => {
      await seed(prisma);
      expect(await dashboard()).toMatchObject({ membrosInadimplentes: 1 });
    });

    expect(
      await prisma.membro.findUnique({ where: { id: outroMembro.id } }),
    ).not.toBeNull();
    expect(
      await prisma.funcionario.findUnique({
        where: { id: outroFuncionario.id },
      }),
    ).not.toBeNull();
  });
});
