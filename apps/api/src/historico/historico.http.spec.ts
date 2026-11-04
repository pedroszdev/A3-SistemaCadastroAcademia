import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { App } from 'supertest/types';
import type { UsuarioAutenticado } from '../auth/usuario-autenticado';
import { Cargo } from '../generated/prisma/enums';
import { HistoricoController } from './historico.controller';
import { HistoricoService } from './historico.service';
import { MembrosAtividadesController } from './membros-atividades.controller';

const ID = '0199f0a2-7b3c-7d4e-8f00-123456789abc';
const MEMBRO_ID = '0199f0a2-7b3c-7d4e-8f00-123456789def';
const FUNCIONARIO_ID = '0199f0a2-7b3c-7d4e-8f00-123456789a01';
const OUTRO_FUNCIONARIO_ID = '0199f0a2-7b3c-7d4e-8f00-123456789a02';

const USUARIO: UsuarioAutenticado = {
  id: FUNCIONARIO_ID,
  tipo: 'FUNCIONARIO',
  cargo: Cargo.INSTRUTOR,
};

const CORPO = {
  membroId: MEMBRO_ID,
  atividade: 'Supino reto',
  data: '2026-10-15',
  tempoExecucao: 45,
};

// Exercita roteamento, pipes e @UsuarioAtual sobre HTTP, sem banco: o service é mockado.
describe('HistoricoController (HTTP)', () => {
  let app: INestApplication<App>;
  const service = {
    findAll: jest.fn(),
    registrar: jest.fn(),
    findOne: jest.fn(),
    findAllDoMembro: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HistoricoController, MembrosAtividadesController],
      providers: [{ provide: HistoricoService, useValue: service }],
    }).compile();

    app = moduleRef.createNestApplication();
    // simula o usuário que o JwtAuthGuard poria na request a partir do token
    app.use((req: Request, _res: Response, next: NextFunction) => {
      (req as Request & { user: UsuarioAutenticado }).user = USUARIO;
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

  describe('GET /atividades', () => {
    it('chama findAll com a query convertida', async () => {
      await http()
        .get('/atividades')
        .query({
          membroId: MEMBRO_ID,
          dataDe: '2026-10-01',
          dataAte: '2026-10-31',
          page: '2',
          pageSize: '10',
        })
        .expect(200);

      expect(service.findAll).toHaveBeenCalledWith({
        membroId: MEMBRO_ID,
        dataDe: new Date('2026-10-01T00:00:00.000Z'),
        dataAte: new Date('2026-10-31T00:00:00.000Z'),
        page: 2,
        pageSize: 10,
      });
    });

    it('rejeita intervalo invertido, sem chamar o service', async () => {
      await http()
        .get('/atividades')
        .query({ dataDe: '2026-12-01', dataAte: '2026-01-01' })
        .expect(400);

      expect(service.findAll).not.toHaveBeenCalled();
    });
  });

  describe('GET /atividades/:id', () => {
    it('chama findOne só com o id', async () => {
      await http().get(`/atividades/${ID}`).expect(200);

      expect(service.findOne).toHaveBeenCalledWith(ID);
    });

    it('responde 400 para id que não é UUID, sem chamar o service', async () => {
      await http().get('/atividades/abc').expect(400);

      expect(service.findOne).not.toHaveBeenCalled();
    });
  });

  describe('POST /atividades', () => {
    it('responde 201 e registra com o funcionário do token (RN11)', async () => {
      service.registrar.mockResolvedValue({ id: ID });

      await http().post('/atividades').send(CORPO).expect(201);

      expect(service.registrar).toHaveBeenCalledWith(
        {
          membroId: MEMBRO_ID,
          atividade: 'Supino reto',
          data: new Date('2026-10-15T00:00:00.000Z'),
          tempoExecucao: 45,
        },
        FUNCIONARIO_ID,
      );
    });

    it('rejeita funcionarioId no body pela whitelist, sem chamar o service', async () => {
      await http()
        .post('/atividades')
        .send({ ...CORPO, funcionarioId: OUTRO_FUNCIONARIO_ID })
        .expect(400);

      expect(service.registrar).not.toHaveBeenCalled();
    });

    it.each([
      ['tempoExecucao 0', { tempoExecucao: 0 }],
      ['data futura', { data: '2999-01-01' }],
    ])('rejeita body inválido (%s), sem chamar o service', async (_, extra) => {
      await http()
        .post('/atividades')
        .send({ ...CORPO, ...extra })
        .expect(400);

      expect(service.registrar).not.toHaveBeenCalled();
    });
  });

  describe('GET /membros/:id/atividades', () => {
    it('chama findAllDoMembro com o id do path e a query convertida', async () => {
      await http()
        .get(`/membros/${MEMBRO_ID}/atividades`)
        .query({ dataDe: '2026-10-01', page: '3' })
        .expect(200);

      expect(service.findAllDoMembro).toHaveBeenCalledWith(MEMBRO_ID, {
        dataDe: new Date('2026-10-01T00:00:00.000Z'),
        page: 3,
        pageSize: 20,
      });
      expect(service.findAll).not.toHaveBeenCalled();
    });

    it('responde 400 para id que não é UUID, sem chamar o service', async () => {
      await http().get('/membros/abc/atividades').expect(400);

      expect(service.findAllDoMembro).not.toHaveBeenCalled();
    });
  });
});
