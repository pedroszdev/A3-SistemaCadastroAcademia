import { INestApplication, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { App } from 'supertest/types';
import type { UsuarioAutenticado } from '../auth/usuario-autenticado';
import { Cargo } from '../generated/prisma/enums';
import { MembrosResumoController } from './membros-resumo.controller';
import { MembrosResumoService } from './membros-resumo.service';

const ID = '0199f0a2-7b3c-7d4e-8f00-123456789abc';
const FUNCIONARIO_ID = '0199f0a2-7b3c-7d4e-8f00-123456789a01';

// Exercita roteamento, pipes e @UsuarioAtual sobre HTTP, sem banco: o service é mockado.
describe('MembrosResumoController (HTTP)', () => {
  let app: INestApplication<App>;
  let usuario: UsuarioAutenticado;
  const service = { resumo: jest.fn() };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [MembrosResumoController],
      providers: [{ provide: MembrosResumoService, useValue: service }],
    }).compile();

    app = moduleRef.createNestApplication();
    // simula o usuário que o JwtAuthGuard poria na request a partir do token
    app.use((req: Request, _res: Response, next: NextFunction) => {
      (req as Request & { user: UsuarioAutenticado }).user = usuario;
      next();
    });
    await app.init();
  });

  beforeEach(() => {
    jest.resetAllMocks();
    usuario = {
      id: FUNCIONARIO_ID,
      tipo: 'FUNCIONARIO',
      cargo: Cargo.INSTRUTOR,
    };
  });

  afterAll(async () => {
    await app.close();
  });

  const http = () => request(app.getHttpServer());

  describe('GET /membros/:id/resumo', () => {
    it('responde 200 e chama o service com o id e o cargo do token', async () => {
      service.resumo.mockResolvedValue({
        membro: { id: ID },
        situacaoFinanceira: null,
        treinoMaisRecente: null,
        atividadesUltimos30Dias: 0,
      });

      const resposta = await http().get(`/membros/${ID}/resumo`).expect(200);

      expect(resposta.body).toEqual({
        membro: { id: ID },
        situacaoFinanceira: null,
        treinoMaisRecente: null,
        atividadesUltimos30Dias: 0,
      });
      expect(service.resumo).toHaveBeenCalledWith(ID, Cargo.INSTRUTOR);
    });

    it('responde 400 para id que não é UUID, sem chamar o service', async () => {
      await http().get('/membros/abc/resumo').expect(400);

      expect(service.resumo).not.toHaveBeenCalled();
    });

    it('responde 404 quando o service não acha o membro', async () => {
      service.resumo.mockRejectedValue(
        new NotFoundException('Membro não encontrado'),
      );

      await http().get(`/membros/${ID}/resumo`).expect(404);
    });
  });
});
