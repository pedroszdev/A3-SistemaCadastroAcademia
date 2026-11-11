import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { MembrosTreinosController } from './membros-treinos.controller';
import { TreinosController } from './treinos.controller';
import { TreinosService } from './treinos.service';

const ID = '0199f0a2-7b3c-7d4e-8f00-123456789abc';
const MEMBRO_ID = '0199f0a2-7b3c-7d4e-8f00-123456789def';

const CORPO = {
  membroId: MEMBRO_ID,
  tipo: 'Musculação',
  descricao: 'Treino de peito e tríceps',
  duracao: 60,
  dataInicio: '2026-11-11',
};

// Exercita roteamento, pipes e HttpCode sobre HTTP, sem banco: o service é mockado.
describe('TreinosController (HTTP)', () => {
  let app: INestApplication<App>;
  const service = {
    findAll: jest.fn(),
    create: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findAllDoMembro: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [TreinosController, MembrosTreinosController],
      providers: [{ provide: TreinosService, useValue: service }],
    }).compile();

    app = moduleRef.createNestApplication();
    // mesmas opções do main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  const http = () => request(app.getHttpServer());

  describe('GET /treinos', () => {
    it('chama findAll com a query convertida', async () => {
      await http()
        .get('/treinos')
        .query({ membroId: MEMBRO_ID, tipo: 'Cardio', page: '2' })
        .expect(200);

      expect(service.findAll).toHaveBeenCalledWith({
        membroId: MEMBRO_ID,
        tipo: 'Cardio',
        page: 2,
        pageSize: 20,
      });
    });

    it('rejeita tipo fora da lista, sem chamar o service', async () => {
      await http().get('/treinos').query({ tipo: 'Yoga' }).expect(400);

      expect(service.findAll).not.toHaveBeenCalled();
    });
  });

  describe('POST /treinos', () => {
    it('responde 201 e chama create com o dto convertido', async () => {
      service.create.mockResolvedValue({ id: ID });

      await http().post('/treinos').send(CORPO).expect(201);

      expect(service.create).toHaveBeenCalledWith({
        ...CORPO,
        dataInicio: new Date('2026-11-11T00:00:00.000Z'),
      });
    });

    it('rejeita body inválido (duracao 0), sem chamar o service', async () => {
      await http()
        .post('/treinos')
        .send({ ...CORPO, duracao: 0 })
        .expect(400);

      expect(service.create).not.toHaveBeenCalled();
    });
  });

  describe('GET /treinos/:id', () => {
    it('chama findOne só com o id', async () => {
      await http().get(`/treinos/${ID}`).expect(200);

      expect(service.findOne).toHaveBeenCalledWith(ID);
    });

    it('responde 400 para id que não é UUID, sem chamar o service', async () => {
      await http().get('/treinos/abc').expect(400);

      expect(service.findOne).not.toHaveBeenCalled();
    });
  });

  describe('PATCH /treinos/:id', () => {
    it('chama update com o id e o dto', async () => {
      await http().patch(`/treinos/${ID}`).send({ duracao: 50 }).expect(200);

      expect(service.update).toHaveBeenCalledWith(ID, { duracao: 50 });
    });

    it('recusa membroId no body, sem chamar o service', async () => {
      await http()
        .patch(`/treinos/${ID}`)
        .send({ membroId: MEMBRO_ID })
        .expect(400);

      expect(service.update).not.toHaveBeenCalled();
    });

    it('responde 400 para id que não é UUID, sem chamar o service', async () => {
      await http().patch('/treinos/abc').send({ duracao: 50 }).expect(400);

      expect(service.update).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /treinos/:id', () => {
    it('responde 204 sem corpo e chama remove com o id', async () => {
      const resposta = await http().delete(`/treinos/${ID}`).expect(204);

      expect(resposta.body).toEqual({});
      expect(service.remove).toHaveBeenCalledWith(ID);
    });

    it('responde 400 para id que não é UUID, sem chamar o service', async () => {
      await http().delete('/treinos/abc').expect(400);

      expect(service.remove).not.toHaveBeenCalled();
    });
  });

  describe('GET /membros/:id/treinos', () => {
    it('chama findAllDoMembro com o id do path e a query convertida', async () => {
      await http()
        .get(`/membros/${MEMBRO_ID}/treinos`)
        .query({ tipo: 'Cardio', page: '3' })
        .expect(200);

      expect(service.findAllDoMembro).toHaveBeenCalledWith(MEMBRO_ID, {
        tipo: 'Cardio',
        page: 3,
        pageSize: 20,
      });
      expect(service.findAll).not.toHaveBeenCalled();
    });

    it('recusa membroId na query, sem chamar o service', async () => {
      await http()
        .get(`/membros/${MEMBRO_ID}/treinos`)
        .query({ membroId: ID })
        .expect(400);

      expect(service.findAllDoMembro).not.toHaveBeenCalled();
    });

    it('responde 400 para id que não é UUID, sem chamar o service', async () => {
      await http().get('/membros/abc/treinos').expect(400);

      expect(service.findAllDoMembro).not.toHaveBeenCalled();
    });
  });
});
