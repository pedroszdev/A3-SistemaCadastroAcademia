import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { criarApp } from './utils';

const MEMBRO_ID = '0199f0a2-7b3c-7d4e-8f00-123456789def';

// As rotas de membros ficam atrás do JwtAuthGuard global do AppModule.
describe('Membros (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await criarApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it.each([
    ['get', '/membros'],
    ['post', '/membros'],
    ['get', `/membros/${MEMBRO_ID}`],
    ['patch', `/membros/${MEMBRO_ID}`],
    ['patch', `/membros/${MEMBRO_ID}/desativar`],
    ['patch', `/membros/${MEMBRO_ID}/reativar`],
  ] as const)('%s %s sem token → 401', async (metodo, rota) => {
    await request(app.getHttpServer())[metodo](rota).expect(401);
  });

  it.each([
    `/membros/${MEMBRO_ID}/situacao`,
    `/membros/${MEMBRO_ID}/atividades`,
  ])('GET %s sem token → 401 (a rota existe)', async (rota) => {
    await request(app.getHttpServer()).get(rota).expect(401);
  });
});
