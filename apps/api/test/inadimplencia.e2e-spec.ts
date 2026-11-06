import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { hoje } from '../src/common/utils/date';
import { Cargo } from '../src/generated/prisma/enums';
import { DIAS_TOLERANCIA } from '../src/pagamentos/pagamento-status';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  bearer,
  criarApp,
  criarMembro,
  diaIso,
  diasAtras,
  limparBanco,
  loginComo,
  noMesmoDia,
  prismaDe,
} from './utils';

// RN09 ponta a ponta: inadimplente (atraso > DIAS_TOLERANCIA) não registra
// atividade, e GET /membros/:id/situacao mostra a mesma situação.

const NO_LIMITE = DIAS_TOLERANCIA;
const ALEM_DO_LIMITE = DIAS_TOLERANCIA + 1;
const DENTRO_DO_LIMITE = Math.floor(DIAS_TOLERANCIA / 2);

describe('Regra de inadimplência (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let tokenRecepcao: string;
  let tokenInstrutor: string;
  let instrutorId: string;

  // Os funcionários e os tokens não mudam entre os testes: são criados uma vez.
  beforeAll(async () => {
    app = await criarApp();
    prisma = prismaDe(app);
    await limparBanco(prisma);
    tokenRecepcao = (await loginComo(app, Cargo.RECEPCIONISTA)).token;
    const instrutor = await loginComo(app, Cargo.INSTRUTOR);
    tokenInstrutor = instrutor.token;
    instrutorId = instrutor.funcionario.id;
  });

  // Entre os testes, só os dados de membros (o limparBanco do beforeAll já
  // garantiu que o banco é o de teste). Ordem das FKs: filhos antes do membro.
  beforeEach(async () => {
    await prisma.historicoAtividade.deleteMany();
    await prisma.pagamento.deleteMany();
    await prisma.treino.deleteMany();
    await prisma.membro.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  /** Lança o pagamento pela API e confere que ele já nasce atrasado. */
  async function lancarAtrasado(
    membroId: string,
    diasDeAtraso: number,
  ): Promise<{ id: string }> {
    const resposta = await request(app.getHttpServer())
      .post('/pagamentos')
      .set('Authorization', bearer(tokenRecepcao))
      .send({
        membroId,
        valor: 120,
        dataVencimento: diaIso(diasAtras(diasDeAtraso)),
      })
      .expect(201);

    expect(resposta.body).toMatchObject({
      status: 'ATRASADO',
      diasEmAtraso: diasDeAtraso,
    });
    return resposta.body as { id: string };
  }

  async function pagar(pagamentoId: string) {
    const resposta = await request(app.getHttpServer())
      .patch(`/pagamentos/${pagamentoId}/pagar`)
      .set('Authorization', bearer(tokenRecepcao))
      .send({})
      .expect(200);

    expect(resposta.body).toMatchObject({
      id: pagamentoId,
      status: 'PAGO',
      diasEmAtraso: 0,
    });
  }

  function registrarAtividade(membroId: string) {
    return request(app.getHttpServer())
      .post('/atividades')
      .set('Authorization', bearer(tokenInstrutor))
      .send({
        membroId,
        atividade: 'Esteira',
        data: diaIso(hoje()),
        tempoExecucao: 30,
      });
  }

  async function esperarBloqueio(membroId: string) {
    const resposta = await registrarAtividade(membroId).expect(422);

    expect(resposta.body).toMatchObject({
      statusCode: 422,
      message: 'Membro com pagamento em atraso',
    });
    expect(await prisma.historicoAtividade.count({ where: { membroId } })).toBe(
      0,
    );
  }

  async function esperarLiberacao(membroId: string) {
    const resposta = await registrarAtividade(membroId).expect(201);

    expect(resposta.body).toMatchObject({
      membroId,
      funcionario: { id: instrutorId },
    });
  }

  async function situacao(membroId: string) {
    const resposta = await request(app.getHttpServer())
      .get(`/membros/${membroId}/situacao`)
      .set('Authorization', bearer(tokenRecepcao))
      .expect(200);

    return resposta.body as {
      situacao: string;
      pagamentosAtrasados: number;
      maiorAtrasoDias: number;
    };
  }

  describe('limite da tolerância', () => {
    it(`atraso de exatamente DIAS_TOLERANCIA (${NO_LIMITE}) dias → EM_DIA e 201`, () =>
      noMesmoDia(async () => {
        const membro = await criarMembro(prisma);
        await lancarAtrasado(membro.id, NO_LIMITE);

        expect(await situacao(membro.id)).toEqual({
          situacao: 'EM_DIA',
          pagamentosAtrasados: 1,
          maiorAtrasoDias: NO_LIMITE,
        });
        await esperarLiberacao(membro.id);
      }));

    it(`atraso de DIAS_TOLERANCIA + 1 (${ALEM_DO_LIMITE}) dias → INADIMPLENTE e 422`, () =>
      noMesmoDia(async () => {
        const membro = await criarMembro(prisma);
        await lancarAtrasado(membro.id, ALEM_DO_LIMITE);

        expect(await situacao(membro.id)).toEqual({
          situacao: 'INADIMPLENTE',
          pagamentosAtrasados: 1,
          maiorAtrasoDias: ALEM_DO_LIMITE,
        });
        await esperarBloqueio(membro.id);
      }));
  });

  it('atraso dentro da tolerância → EM_DIA e 201', async () => {
    const membro = await criarMembro(prisma);
    await lancarAtrasado(membro.id, DENTRO_DO_LIMITE);

    expect(await situacao(membro.id)).toMatchObject({ situacao: 'EM_DIA' });
    await esperarLiberacao(membro.id);
  });

  it('atraso além da tolerância → 422; depois de pagar → EM_DIA e 201', async () => {
    const membro = await criarMembro(prisma);
    const pagamento = await lancarAtrasado(membro.id, DIAS_TOLERANCIA + 5);

    await esperarBloqueio(membro.id);

    await pagar(pagamento.id);

    expect(await situacao(membro.id)).toEqual({
      situacao: 'EM_DIA',
      pagamentosAtrasados: 0,
      maiorAtrasoDias: 0,
    });
    await esperarLiberacao(membro.id);
  });

  describe('vários pagamentos atrasados', () => {
    it('pagar o mais antigo não libera se outro continua além da tolerância', async () => {
      const membro = await criarMembro(prisma);
      const maisAntigo = await lancarAtrasado(membro.id, DIAS_TOLERANCIA + 5);
      const maisRecente = await lancarAtrasado(membro.id, DIAS_TOLERANCIA + 2);

      expect(await situacao(membro.id)).toEqual({
        situacao: 'INADIMPLENTE',
        pagamentosAtrasados: 2,
        maiorAtrasoDias: DIAS_TOLERANCIA + 5,
      });

      await pagar(maisAntigo.id);

      expect(await situacao(membro.id)).toEqual({
        situacao: 'INADIMPLENTE',
        pagamentosAtrasados: 1,
        maiorAtrasoDias: DIAS_TOLERANCIA + 2,
      });
      await esperarBloqueio(membro.id);

      await pagar(maisRecente.id);

      await esperarLiberacao(membro.id);
    });

    it('pagar o único além da tolerância libera, mesmo com outro atrasado dentro dela', async () => {
      const membro = await criarMembro(prisma);
      const alem = await lancarAtrasado(membro.id, DIAS_TOLERANCIA + 5);
      await lancarAtrasado(membro.id, DENTRO_DO_LIMITE);

      await esperarBloqueio(membro.id);

      await pagar(alem.id);

      expect(await situacao(membro.id)).toEqual({
        situacao: 'EM_DIA',
        pagamentosAtrasados: 1,
        maiorAtrasoDias: DENTRO_DO_LIMITE,
      });
      await esperarLiberacao(membro.id);
    });
  });
});
