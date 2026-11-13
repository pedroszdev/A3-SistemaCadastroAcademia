import { INestApplication, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { configurarApp } from '../configurar-app';
import { MembrosResumoController } from './membros-resumo.controller';
import { MembrosResumoService } from './membros-resumo.service';

const ID = '0199f0a2-7b3c-7d4e-8f00-123456789abc';

const RESUMO = {
  membro: { id: ID, nome: 'Ana Pereira', acessoLiberado: false },
  situacaoFinanceira: {
    situacao: 'EM_DIA',
    pagamentosAtrasados: 0,
    maiorAtrasoDias: 0,
  },
  treinoMaisRecente: null,
  atividadesUltimos30Dias: 0,
};

describe('MembrosResumoController', () => {
  let service: { resumo: jest.Mock };
  let controller: MembrosResumoController;

  beforeEach(() => {
    service = { resumo: jest.fn() };
    controller = new MembrosResumoController(
      service as unknown as MembrosResumoService,
    );
  });

  it('resumo delega o id ao service', async () => {
    service.resumo.mockResolvedValue(RESUMO);

    await expect(controller.resumo(ID)).resolves.toBe(RESUMO);
    expect(service.resumo).toHaveBeenCalledWith(ID);
  });

  describe('GET /membros/:id/resumo', () => {
    let app: INestApplication<App>;

    beforeEach(async () => {
      const moduleRef = await Test.createTestingModule({
        controllers: [MembrosResumoController],
        providers: [{ provide: MembrosResumoService, useValue: service }],
      }).compile();

      app = moduleRef.createNestApplication();
      configurarApp(app);
      await app.init();
    });

    afterEach(async () => {
      await app.close();
    });

    it('responde 200 com o resumo do service', async () => {
      service.resumo.mockResolvedValue(RESUMO);

      const resposta = await request(app.getHttpServer())
        .get(`/membros/${ID}/resumo`)
        .expect(200);

      expect(resposta.body).toEqual(RESUMO);
      expect(service.resumo).toHaveBeenCalledWith(ID);
    });

    it('responde 400 para id que não é UUID, sem chamar o service', async () => {
      await request(app.getHttpServer()).get('/membros/abc/resumo').expect(400);

      expect(service.resumo).not.toHaveBeenCalled();
    });

    it('repassa o 404 de membro inexistente', async () => {
      service.resumo.mockRejectedValue(
        new NotFoundException('Membro não encontrado'),
      );

      const resposta = await request(app.getHttpServer())
        .get(`/membros/${ID}/resumo`)
        .expect(404);

      expect((resposta.body as { message: string }).message).toBe(
        'Membro não encontrado',
      );
    });
  });
});
