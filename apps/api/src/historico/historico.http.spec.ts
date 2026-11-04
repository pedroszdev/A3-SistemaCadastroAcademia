import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { HistoricoController } from './historico.controller';
import { HistoricoService } from './historico.service';

const ID = '0199f0a2-7b3c-7d4e-8f00-123456789abc';
const MEMBRO_ID = '0199f0a2-7b3c-7d4e-8f00-123456789def';

// Exercita roteamento e pipes sobre HTTP, sem banco: o service é mockado.
describe('HistoricoController (HTTP)', () => {
  let app: INestApplication<App>;
  const service = {
    findAll: jest.fn(),
    findOne: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HistoricoController],
      providers: [{ provide: HistoricoService, useValue: service }],
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
});
