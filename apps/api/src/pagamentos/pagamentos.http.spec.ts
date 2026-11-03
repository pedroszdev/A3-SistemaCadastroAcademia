import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { hoje } from '../common/utils/date';
import { PagamentosController } from './pagamentos.controller';
import { PagamentosService } from './pagamentos.service';

const ID = '0199f0a2-7b3c-7d4e-8f00-123456789abc';
const CORPO_DATA = JSON.stringify({ dataPagamento: '2026-10-01' });

// Exercita roteamento, pipes e guards sobre HTTP, sem banco: o service é mockado.
describe('PagamentosController (HTTP)', () => {
  let app: INestApplication<App>;
  const service = {
    findAll: jest.fn(),
    create: jest.fn(),
    findOne: jest.fn(),
    registrarPagamento: jest.fn(),
    cancelar: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [PagamentosController],
      providers: [{ provide: PagamentosService, useValue: service }],
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

  describe('rotas', () => {
    it('GET /pagamentos chama findAll', async () => {
      await http().get('/pagamentos').expect(200);

      expect(service.findAll).toHaveBeenCalledTimes(1);
    });

    it('POST /pagamentos chama create com a data convertida', async () => {
      await http()
        .post('/pagamentos')
        .send({ membroId: ID, valor: 150.5, dataVencimento: '2099-01-10' })
        .expect(201);

      expect(service.create).toHaveBeenCalledWith({
        membroId: ID,
        valor: 150.5,
        dataVencimento: new Date('2099-01-10T00:00:00.000Z'),
      });
    });

    it('GET /pagamentos/:id chama findOne', async () => {
      await http().get(`/pagamentos/${ID}`).expect(200);

      expect(service.findOne).toHaveBeenCalledWith(ID);
    });

    it('PATCH /pagamentos/:id/pagar chama só registrarPagamento', async () => {
      await http()
        .patch(`/pagamentos/${ID}/pagar`)
        .send({ dataPagamento: '2026-10-01' })
        .expect(200);

      expect(service.registrarPagamento).toHaveBeenCalledWith(ID, {
        dataPagamento: new Date('2026-10-01T00:00:00.000Z'),
      });
      expect(service.cancelar).not.toHaveBeenCalled();
    });

    it('PATCH /pagamentos/:id/cancelar chama só cancelar', async () => {
      await http().patch(`/pagamentos/${ID}/cancelar`).expect(200);

      expect(service.cancelar).toHaveBeenCalledWith(ID);
      expect(service.registrarPagamento).not.toHaveBeenCalled();
    });
  });

  describe('id inválido', () => {
    it.each([
      ['get', '/pagamentos/abc'],
      ['patch', '/pagamentos/abc/pagar'],
      ['patch', '/pagamentos/abc/cancelar'],
    ] as const)('%s %s → 400', async (metodo, rota) => {
      await http()[metodo](rota).expect(400);

      expect(service.findOne).not.toHaveBeenCalled();
      expect(service.registrarPagamento).not.toHaveBeenCalled();
      expect(service.cancelar).not.toHaveBeenCalled();
    });
  });

  describe('PATCH /pagamentos/:id/pagar', () => {
    it('sem corpo e sem headers assume hoje', async () => {
      await http().patch(`/pagamentos/${ID}/pagar`).expect(200);

      expect(service.registrarPagamento).toHaveBeenCalledWith(ID, {
        dataPagamento: hoje(),
      });
    });

    it('com Content-Length: 0 assume hoje', async () => {
      await http()
        .patch(`/pagamentos/${ID}/pagar`)
        .set('Content-Length', '0')
        .expect(200);

      expect(service.registrarPagamento).toHaveBeenCalledWith(ID, {
        dataPagamento: hoje(),
      });
    });

    it('com corpo sem Content-Type → 415, sem registrar', async () => {
      await http()
        .patch(`/pagamentos/${ID}/pagar`)
        .send(Buffer.from(CORPO_DATA))
        .expect(415);

      expect(service.registrarPagamento).not.toHaveBeenCalled();
    });

    it('com corpo em text/plain → 415, sem registrar', async () => {
      await http()
        .patch(`/pagamentos/${ID}/pagar`)
        .set('Content-Type', 'text/plain')
        .send(CORPO_DATA)
        .expect(415);

      expect(service.registrarPagamento).not.toHaveBeenCalled();
    });

    it('com Content-Type JSON com charset é aceito', async () => {
      await http()
        .patch(`/pagamentos/${ID}/pagar`)
        .set('Content-Type', 'application/json; charset=utf-8')
        .send(CORPO_DATA)
        .expect(200);

      expect(service.registrarPagamento).toHaveBeenCalledWith(ID, {
        dataPagamento: new Date('2026-10-01T00:00:00.000Z'),
      });
    });

    it('rejeita dataPagamento antiga demais', async () => {
      await http()
        .patch(`/pagamentos/${ID}/pagar`)
        .send({ dataPagamento: '1900-01-01' })
        .expect(400);

      expect(service.registrarPagamento).not.toHaveBeenCalled();
    });
  });

  describe('validação', () => {
    it('POST rejeita vencimento antigo demais', async () => {
      await http()
        .post('/pagamentos')
        .send({ membroId: ID, valor: 150.5, dataVencimento: '2020-01-10' })
        .expect(400);

      expect(service.create).not.toHaveBeenCalled();
    });

    it('GET rejeita intervalo de vencimento invertido', async () => {
      await http()
        .get('/pagamentos')
        .query({ vencimentoDe: '2026-12-01', vencimentoAte: '2026-01-01' })
        .expect(400);

      expect(service.findAll).not.toHaveBeenCalled();
    });
  });
});
