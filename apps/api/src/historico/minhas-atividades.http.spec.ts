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
import { HistoricoService } from './historico.service';
import { MinhasAtividadesController } from './minhas-atividades.controller';

const ID = '0199f0a2-7b3c-7d4e-8f00-123456789abc';
const ALUNO_ID = '0199f0a2-7b3c-7d4e-8f00-123456789def';
const OUTRO_MEMBRO_ID = '0199f0a2-7b3c-7d4e-8f00-123456789c01';

const ALUNO: UsuarioAutenticado = { id: ALUNO_ID, tipo: 'ALUNO' };

// Exercita roteamento, pipes e @UsuarioAtual sobre HTTP, sem banco: o service é mockado.
describe('MinhasAtividadesController (HTTP)', () => {
  let app: INestApplication<App>;
  const service = {
    findAllDoAluno: jest.fn(),
    resumoMembro: jest.fn(),
    findOneDoAluno: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [MinhasAtividadesController],
      providers: [{ provide: HistoricoService, useValue: service }],
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

  describe('GET /me/atividades', () => {
    it('chama findAllDoAluno com o id do token e a query convertida', async () => {
      await http()
        .get('/me/atividades')
        .query({ dataDe: '2026-10-01', page: '2' })
        .expect(200);

      expect(service.findAllDoAluno).toHaveBeenCalledWith(ALUNO_ID, {
        dataDe: new Date('2026-10-01T00:00:00.000Z'),
        page: 2,
        pageSize: 20,
      });
    });

    it('recusa membroId na query, sem chamar o service (RN16)', async () => {
      await http()
        .get('/me/atividades')
        .query({ membroId: OUTRO_MEMBRO_ID })
        .expect(400);

      expect(service.findAllDoAluno).not.toHaveBeenCalled();
    });

    it('rejeita intervalo invertido, sem chamar o service', async () => {
      await http()
        .get('/me/atividades')
        .query({ dataDe: '2026-12-01', dataAte: '2026-01-01' })
        .expect(400);

      expect(service.findAllDoAluno).not.toHaveBeenCalled();
    });
  });

  describe('GET /me/atividades/resumo', () => {
    it('chama resumoMembro com o id do token e o período, sem cair no :id', async () => {
      const resumo = { totalAtividades: 3, totalMinutos: 135 };
      service.resumoMembro.mockResolvedValue(resumo);

      const resposta = await http()
        .get('/me/atividades/resumo')
        .query({ dataDe: '2026-10-01', dataAte: '2026-10-31' })
        .expect(200);

      expect(resposta.body).toEqual(resumo);
      expect(service.resumoMembro).toHaveBeenCalledWith(
        ALUNO_ID,
        new Date('2026-10-01T00:00:00.000Z'),
        new Date('2026-10-31T00:00:00.000Z'),
      );
      expect(service.findOneDoAluno).not.toHaveBeenCalled();
    });

    it('sem período chama resumoMembro com o período aberto', async () => {
      await http().get('/me/atividades/resumo').expect(200);

      expect(service.resumoMembro).toHaveBeenCalledWith(
        ALUNO_ID,
        undefined,
        undefined,
      );
    });

    it.each([
      ['page', { page: '1' }],
      ['membroId', { membroId: OUTRO_MEMBRO_ID }],
    ])('recusa %s na query, sem chamar o service', async (_, query) => {
      await http().get('/me/atividades/resumo').query(query).expect(400);

      expect(service.resumoMembro).not.toHaveBeenCalled();
    });

    it('rejeita intervalo invertido, sem chamar o service', async () => {
      await http()
        .get('/me/atividades/resumo')
        .query({ dataDe: '2026-12-01', dataAte: '2026-01-01' })
        .expect(400);

      expect(service.resumoMembro).not.toHaveBeenCalled();
    });
  });

  describe('GET /me/atividades/:id', () => {
    it('chama findOneDoAluno com o id do path e o id do token', async () => {
      await http().get(`/me/atividades/${ID}`).expect(200);

      expect(service.findOneDoAluno).toHaveBeenCalledWith(ID, ALUNO_ID);
    });

    it('responde 400 para id que não é UUID, sem chamar o service', async () => {
      await http().get('/me/atividades/abc').expect(400);

      expect(service.findOneDoAluno).not.toHaveBeenCalled();
    });

    it('responde 404 para atividade de outro membro (RN16)', async () => {
      service.findOneDoAluno.mockRejectedValue(
        new NotFoundException('Atividade não encontrada'),
      );

      const resposta = await http().get(`/me/atividades/${ID}`).expect(404);

      expect(resposta.body).toEqual({
        statusCode: 404,
        message: 'Atividade não encontrada',
        error: 'Not Found',
      });
    });
  });
});
