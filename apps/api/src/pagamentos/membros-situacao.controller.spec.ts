import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { MembrosSituacaoController } from './membros-situacao.controller';
import { PagamentosService } from './pagamentos.service';

const ID = '0199f0a2-7b3c-7d4e-8f00-123456789abc';

describe('MembrosSituacaoController', () => {
  let service: { situacaoMembro: jest.Mock };
  let controller: MembrosSituacaoController;

  beforeEach(() => {
    service = { situacaoMembro: jest.fn() };
    controller = new MembrosSituacaoController(
      service as unknown as PagamentosService,
    );
  });

  it('situacao delega o id ao service', async () => {
    const situacao = {
      situacao: 'INADIMPLENTE',
      pagamentosAtrasados: 2,
      maiorAtrasoDias: 15,
    };
    service.situacaoMembro.mockResolvedValue(situacao);

    await expect(controller.situacao(ID)).resolves.toBe(situacao);
    expect(service.situacaoMembro).toHaveBeenCalledWith(ID);
  });

  describe('GET /membros/:id/situacao', () => {
    let app: INestApplication<App>;

    beforeEach(async () => {
      const moduleRef = await Test.createTestingModule({
        controllers: [MembrosSituacaoController],
        providers: [{ provide: PagamentosService, useValue: service }],
      }).compile();

      app = moduleRef.createNestApplication();
      await app.init();
    });

    afterEach(async () => {
      await app.close();
    });

    it('responde 400 para id que não é UUID, sem chamar o service', async () => {
      await request(app.getHttpServer())
        .get('/membros/abc/situacao')
        .expect(400);

      expect(service.situacaoMembro).not.toHaveBeenCalled();
    });

    it('aceita um UUID válido e delega ao service', async () => {
      service.situacaoMembro.mockResolvedValue({
        situacao: 'EM_DIA',
        pagamentosAtrasados: 0,
        maiorAtrasoDias: 0,
      });

      await request(app.getHttpServer())
        .get(`/membros/${ID}/situacao`)
        .expect(200);

      expect(service.situacaoMembro).toHaveBeenCalledWith(ID);
    });
  });
});
