import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { criarApp } from './utils';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await criarApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health → 200 com status ok', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect({ status: 'ok' });
  });

  it('GET /funcionarios sem token → 401', () => {
    return request(app.getHttpServer()).get('/funcionarios').expect(401);
  });

  it('POST /auth/login com credencial inexistente → 401', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ login: 'inexistente', senha: 'senha-qualquer' })
      .expect(401)
      .expect({
        statusCode: 401,
        message: 'Login ou senha inválidos',
        error: 'Unauthorized',
      });
  });
});
