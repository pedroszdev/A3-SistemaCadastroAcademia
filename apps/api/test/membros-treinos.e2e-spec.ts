import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { hoje } from '../src/common/utils/date';
import { Cargo } from '../src/generated/prisma/enums';
import { PrismaService } from '../src/prisma/prisma.service';
import { MENSAGEM_TIPO_TREINO } from '../src/treinos/tipos-treino';
import {
  bearer,
  criarApp,
  criarMembro,
  diaIso,
  diasAtras,
  gerarCpf,
  limparBanco,
  loginComo,
  noMesmoDia,
  prismaDe,
} from './utils';

// E2E-04: RN01 a RN05 de membros e treinos com banco real (o 401 das rotas fica em membros.e2e-spec.ts).

const INEXISTENTE = '0199f0a2-7b3c-7d4e-8f00-000000000000';

interface Erro {
  message: string | string[];
}

interface MembroResposta {
  id: string;
  nome: string;
  cpf: string;
  ativo: boolean;
}

interface ListaMembros {
  data: MembroResposta[];
  total: number;
}

describe('Membros e treinos: RN01 a RN05 (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let tokenRecepcao: string;
  let tokenInstrutor: string;

  beforeAll(async () => {
    app = await criarApp();
    prisma = prismaDe(app);
    await limparBanco(prisma);
    tokenRecepcao = (await loginComo(app, Cargo.RECEPCIONISTA)).token;
    tokenInstrutor = (await loginComo(app, Cargo.INSTRUTOR)).token;
  });

  beforeEach(async () => {
    await prisma.historicoAtividade.deleteMany();
    await prisma.pagamento.deleteMany();
    await prisma.treino.deleteMany();
    await prisma.membro.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  const dadosMembro = (extra: Record<string, unknown> = {}) => ({
    nome: 'Ana Souza Teste',
    cpf: gerarCpf(),
    telefone: '48999990000',
    endereco: 'Rua Fictícia, 10',
    ...extra,
  });

  const dadosTreino = (
    membroId: string,
    extra: Record<string, unknown> = {},
  ) => ({
    membroId,
    tipo: 'Musculação',
    descricao: 'Treino de teste e2e',
    duracao: 60,
    dataInicio: diaIso(hoje()),
    ...extra,
  });

  const postMembro = (body: object) =>
    request(app.getHttpServer())
      .post('/membros')
      .set('Authorization', bearer(tokenRecepcao))
      .send(body);

  const postTreino = (body: object) =>
    request(app.getHttpServer())
      .post('/treinos')
      .set('Authorization', bearer(tokenInstrutor))
      .send(body);

  const get = (rota: string, token = tokenRecepcao) =>
    request(app.getHttpServer()).get(rota).set('Authorization', bearer(token));

  const patch = (rota: string, body: object = {}) =>
    request(app.getHttpServer())
      .patch(rota)
      .set('Authorization', bearer(tokenRecepcao))
      .send(body);

  const mascarar = (cpf: string) =>
    `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;

  const comDigitoErrado = (cpf: string) =>
    `${cpf.slice(0, 10)}${(Number(cpf[10]) + 1) % 10}`;

  const mensagens = (corpo: unknown): string[] => {
    const { message } = corpo as Erro;
    return Array.isArray(message) ? message : [message];
  };

  describe('RN01 · CPF válido', () => {
    it.each([
      ['dígito verificador errado', comDigitoErrado(gerarCpf())],
      ['sequência repetida', '11111111111'],
      ['curto demais', '123'],
    ])('RN01 · CPF com %s → 400', async (_caso, cpf) => {
      const resposta = await postMembro(dadosMembro({ cpf })).expect(400);

      expect(mensagens(resposta.body)).toContain('cpf deve ser um CPF válido');
      expect(await prisma.membro.count()).toBe(0);
    });

    it('RN01 · CPF com máscara → 201 e grava só os dígitos', async () => {
      const cpf = gerarCpf();

      const resposta = await postMembro(
        dadosMembro({ cpf: mascarar(cpf) }),
      ).expect(201);

      expect((resposta.body as MembroResposta).cpf).toBe(cpf);
    });
  });

  describe('RN02 · CPF único e imutável', () => {
    it.each([
      ['igual', (cpf: string) => cpf],
      ['com máscara', mascarar],
    ])('RN02 · CPF repetido (%s) → 409', async (_caso, formatar) => {
      const cpf = gerarCpf();
      await postMembro(dadosMembro({ cpf })).expect(201);

      const resposta = await postMembro(
        dadosMembro({ cpf: formatar(cpf) }),
      ).expect(409);

      expect(mensagens(resposta.body)).toContain('CPF já cadastrado');
      expect(await prisma.membro.count()).toBe(1);
    });

    it('RN02 · PATCH com cpf → 400 e o CPF não muda', async () => {
      const membro = await criarMembro(prisma);

      const resposta = await patch(`/membros/${membro.id}`, {
        cpf: gerarCpf(),
      }).expect(400);

      expect(mensagens(resposta.body)).toContain('cpf não pode ser alterado');
      const atual = await get(`/membros/${membro.id}`).expect(200);
      expect((atual.body as MembroResposta).cpf).toBe(membro.cpf);
    });
  });

  describe('busca de membros', () => {
    it('busca por nome (sem diferenciar maiúsculas) e por início do CPF → 200', async () => {
      await criarMembro(prisma, { nome: 'Beatriz Ramos' });
      await criarMembro(prisma, { nome: 'Bernardo Ramos' });
      const carla = await criarMembro(prisma, { nome: 'Carla Dias' });

      const porNome = await get('/membros?busca=ramos').expect(200);
      const lista = porNome.body as ListaMembros;
      expect(lista.total).toBe(2);
      expect(lista.data.map((m) => m.nome).sort()).toEqual([
        'Beatriz Ramos',
        'Bernardo Ramos',
      ]);

      const maiusculas = await get('/membros?busca=CARLA').expect(200);
      expect((maiusculas.body as ListaMembros).total).toBe(1);

      // 9 dígitos: o gerarCpf() repete o começo (vem do relógio) e muda no fim da base.
      const porCpf = await get(
        `/membros?busca=${carla.cpf.slice(0, 9)}`,
      ).expect(200);
      expect((porCpf.body as ListaMembros).data.map((m) => m.id)).toEqual([
        carla.id,
      ]);

      // Procura pelo início do CPF: um trecho do meio não acha ninguém.
      const meioDoCpf = await get(
        `/membros?busca=${carla.cpf.slice(1)}`,
      ).expect(200);
      expect((meioDoCpf.body as ListaMembros).total).toBe(0);
    });
  });

  describe('RN03 · desativar em vez de excluir', () => {
    it('RN03 · desativa, o membro continua existindo e reativa → 200', async () => {
      const membro = await criarMembro(prisma);

      const desativado = await patch(`/membros/${membro.id}/desativar`).expect(
        200,
      );
      expect((desativado.body as MembroResposta).ativo).toBe(false);

      const atual = await get(`/membros/${membro.id}`).expect(200);
      expect((atual.body as MembroResposta).ativo).toBe(false);

      const inativos = await get('/membros?ativo=false').expect(200);
      expect((inativos.body as ListaMembros).data.map((m) => m.id)).toContain(
        membro.id,
      );
      const ativos = await get('/membros?ativo=true').expect(200);
      expect((ativos.body as ListaMembros).data.map((m) => m.id)).not.toContain(
        membro.id,
      );

      const reativado = await patch(`/membros/${membro.id}/reativar`).expect(
        200,
      );
      expect((reativado.body as MembroResposta).ativo).toBe(true);
      const ativosDepois = await get('/membros?ativo=true').expect(200);
      expect(
        (ativosDepois.body as ListaMembros).data.map((m) => m.id),
      ).toContain(membro.id);
    });

    it('RN03 · não existe DELETE /membros/:id → 404', async () => {
      const membro = await criarMembro(prisma);

      await request(app.getHttpServer())
        .delete(`/membros/${membro.id}`)
        .set('Authorization', bearer(tokenRecepcao))
        .expect(404);

      expect(await prisma.membro.count()).toBe(1);
    });
  });

  describe('RN04 · membro inativo não recebe treino', () => {
    it('RN04 · treino para membro inativo → 422; depois de reativar → 201', async () => {
      const membro = await criarMembro(prisma);
      await patch(`/membros/${membro.id}/desativar`).expect(200);

      const recusado = await postTreino(dadosTreino(membro.id)).expect(422);

      expect(mensagens(recusado.body)).toContain(
        'Membro inativo não pode receber treino',
      );
      expect(
        await prisma.treino.count({ where: { membroId: membro.id } }),
      ).toBe(0);

      await patch(`/membros/${membro.id}/reativar`).expect(200);
      // A data de hoje é calculada no teste e conferida pela API: protege a virada do dia.
      await noMesmoDia(() => postTreino(dadosTreino(membro.id)).expect(201));
    });
  });

  describe('RN05 · regras do treino', () => {
    let membroId: string;

    beforeEach(async () => {
      membroId = (await criarMembro(prisma)).id;
    });

    it.each([
      ['duracao 0', { duracao: 0 }, 'duracao deve ser no mínimo 1 minuto'],
      [
        'duracao 301',
        { duracao: 301 },
        'duracao deve ser no máximo 300 minutos',
      ],
      ['tipo fora da lista', { tipo: 'Natação' }, MENSAGEM_TIPO_TREINO],
    ])('RN05 · %s → 400', async (_caso, extra, mensagem) => {
      const resposta = await postTreino(dadosTreino(membroId, extra)).expect(
        400,
      );

      expect(mensagens(resposta.body)).toContain(mensagem);
      expect(await prisma.treino.count()).toBe(0);
    });

    it('RN05 · dataInicio de ontem → 400', async () => {
      await noMesmoDia(async () => {
        const resposta = await postTreino(
          dadosTreino(membroId, { dataInicio: diaIso(diasAtras(1)) }),
        ).expect(400);

        expect(mensagens(resposta.body)).toContain(
          'dataInicio não pode ser anterior a hoje',
        );
      });
      expect(await prisma.treino.count()).toBe(0);
    });

    it.each([1, 300])('RN05 · duracao %i (limite) → 201', async (duracao) => {
      await noMesmoDia(() =>
        postTreino(dadosTreino(membroId, { duracao })).expect(201),
      );
    });

    it('RN05 · dataInicio de hoje → 201', async () => {
      await noMesmoDia(async () => {
        const dataInicio = diaIso(hoje());

        const resposta = await postTreino(
          dadosTreino(membroId, { dataInicio }),
        ).expect(201);

        expect(resposta.body).toMatchObject({
          membroId,
          dataInicio: expect.stringContaining(dataInicio) as unknown,
        });
      });
    });
  });

  describe('identificador inválido ou inexistente', () => {
    it.each([['/membros/nao-e-uuid'], ['/treinos/nao-e-uuid']])(
      'GET %s → 400',
      async (rota) => {
        await get(rota, tokenInstrutor).expect(400);
      },
    );

    it('POST /treinos com membroId inválido → 400', async () => {
      const resposta = await postTreino(dadosTreino('nao-e-uuid')).expect(400);

      expect(mensagens(resposta.body)).toContain(
        'membroId deve ser um UUID válido',
      );
    });

    it('GET /membros/:id inexistente → 404', async () => {
      const resposta = await get(`/membros/${INEXISTENTE}`).expect(404);

      expect(mensagens(resposta.body)).toContain('Membro não encontrado');
    });

    it('POST /treinos para membro inexistente → 404', async () => {
      const resposta = await postTreino(dadosTreino(INEXISTENTE)).expect(404);

      expect(mensagens(resposta.body)).toContain('Membro não encontrado');
    });

    it('GET /treinos/:id inexistente → 404', async () => {
      const resposta = await get(
        `/treinos/${INEXISTENTE}`,
        tokenInstrutor,
      ).expect(404);

      expect(mensagens(resposta.body)).toContain('Treino não encontrado');
    });
  });
});
