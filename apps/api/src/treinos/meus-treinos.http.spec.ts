import {
  INestApplication,
  NotFoundException,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { App } from 'supertest/types';
import type { UsuarioAutenticado } from '../auth/usuario-autenticado';
import { MeusTreinosController } from './meus-treinos.controller';
import { TreinosService } from './treinos.service';

const ID = '0199f0a2-7b3c-7d4e-8f00-123456789abc';
const ALUNO_ID = '0199f0a2-7b3c-7d4e-8f00-123456789def';
const OUTRO_MEMBRO_ID = '0199f0a2-7b3c-7d4e-8f00-123456789c01';

const ALUNO: UsuarioAutenticado = { id: ALUNO_ID, tipo: 'ALUNO' };

// Exercita roteamento, pipes e @UsuarioAtual sobre HTTP, sem banco: o service é mockado.
describe('MeusTreinosController (HTTP)', () => {
  let app: INestApplication<App>;
  const service = {
    findDoMembro: jest.fn(),
    findOneDoMembro: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [MeusTreinosController],
      providers: [{ provide: TreinosService, useValue: service }],
    }).compile();

    app = moduleRef.createNestApplication();
    // simula o usuário que o JwtAuthGuard poria na request a partir do token
    app.use((req: Request, _res: Response, next: NextFunction) => {
      (req as Request & { user: UsuarioAutenticado }).user = ALUNO;
      next();
    });
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

  describe('GET /me/treinos', () => {
    it('chama findDoMembro com o id do token e a query convertida', async () => {
      await http()
        .get('/me/treinos')
        .query({ tipo: 'Cardio', page: '2' })
        .expect(200);

      expect(service.findDoMembro).toHaveBeenCalledWith(ALUNO_ID, {
        tipo: 'Cardio',
        page: 2,
        pageSize: 20,
      });
    });

    it('recusa membroId na query, sem chamar o service (RN16)', async () => {
      await http()
        .get('/me/treinos')
        .query({ membroId: OUTRO_MEMBRO_ID })
        .expect(400);

      expect(service.findDoMembro).not.toHaveBeenCalled();
    });

    it('rejeita tipo fora da lista, sem chamar o service', async () => {
      await http().get('/me/treinos').query({ tipo: 'Yoga' }).expect(400);

      expect(service.findDoMembro).not.toHaveBeenCalled();
    });
  });

  describe('GET /me/treinos/:id', () => {
    it('chama findOneDoMembro com o id do token e o id do path', async () => {
      await http().get(`/me/treinos/${ID}`).expect(200);

      expect(service.findOneDoMembro).toHaveBeenCalledWith(ALUNO_ID, ID);
    });

    it('responde 400 para id que não é UUID, sem chamar o service', async () => {
      await http().get('/me/treinos/abc').expect(400);

      expect(service.findOneDoMembro).not.toHaveBeenCalled();
    });

    it('responde 404 para treino de outro membro (RN16)', async () => {
      service.findOneDoMembro.mockRejectedValue(
        new NotFoundException('Treino não encontrado'),
      );

      const resposta = await http().get(`/me/treinos/${ID}`).expect(404);

      expect(resposta.body).toEqual({
        statusCode: 404,
        message: 'Treino não encontrado',
        error: 'Not Found',
      });
    });
  });
});
