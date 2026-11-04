import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

const MEMBRO_ID = '0199f0a2-7b3c-7d4e-8f00-123456789def';

// As rotas de histórico ficam atrás do JwtAuthGuard global do AppModule.
describe('Histórico (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it.each([
    ['get', '/atividades'],
    ['post', '/atividades'],
    ['get', `/atividades/${MEMBRO_ID}`],
    ['get', `/membros/${MEMBRO_ID}/atividades`],
  ] as const)('%s %s sem token → 401', async (metodo, rota) => {
    await request(app.getHttpServer())[metodo](rota).expect(401);
  });
});
