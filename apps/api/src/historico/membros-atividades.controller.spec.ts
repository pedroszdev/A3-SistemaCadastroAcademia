import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { QueryAtividadeDto } from './dto/query-atividade.dto';
import { HistoricoService } from './historico.service';
import { MembrosAtividadesController } from './membros-atividades.controller';

const ID = '0199f0a2-7b3c-7d4e-8f00-123456789abc';

describe('MembrosAtividadesController', () => {
  let service: { findAllDoMembro: jest.Mock };
  let controller: MembrosAtividadesController;

  beforeEach(() => {
    service = { findAllDoMembro: jest.fn() };
    controller = new MembrosAtividadesController(
      service as unknown as HistoricoService,
    );
  });

  it('findAll delega o id e a query ao service', async () => {
    const query = { page: 1, pageSize: 20 } as QueryAtividadeDto;
    const pagina = { data: [], total: 0, page: 1, pageSize: 20 };
    service.findAllDoMembro.mockResolvedValue(pagina);

    await expect(controller.findAll(ID, query)).resolves.toBe(pagina);
    expect(service.findAllDoMembro).toHaveBeenCalledWith(ID, query);
  });

  describe('GET /membros/:id/atividades', () => {
    let app: INestApplication<App>;

    beforeEach(async () => {
      const moduleRef = await Test.createTestingModule({
        controllers: [MembrosAtividadesController],
        providers: [{ provide: HistoricoService, useValue: service }],
      }).compile();

      app = moduleRef.createNestApplication();
      await app.init();
    });

    afterEach(async () => {
      await app.close();
    });

    it('responde 400 para id que não é UUID, sem chamar o service', async () => {
      await request(app.getHttpServer())
        .get('/membros/abc/atividades')
        .expect(400);

      expect(service.findAllDoMembro).not.toHaveBeenCalled();
    });

    it('aceita um UUID válido e delega ao service', async () => {
      service.findAllDoMembro.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        pageSize: 20,
      });

      await request(app.getHttpServer())
        .get(`/membros/${ID}/atividades`)
        .expect(200);

      expect(service.findAllDoMembro).toHaveBeenCalledWith(
        ID,
        expect.anything(),
      );
    });
  });
});
