import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { Cargo } from '../src/generated/prisma/enums';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  criarApp,
  criarFuncionario,
  limparBanco,
  prismaDe,
  SENHA_PADRAO,
} from './utils';

const NOME = 'Funcionária E2E';
const MENSAGEM_TOKEN = 'Token ausente, inválido ou expirado';

// Caminho feliz do login com banco real: select com senhaHash, JWT real e a
// strategy consultando o funcionário no Postgres a cada requisição.
describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let id: string;
  let login: string;
  let token: string;

  beforeAll(async () => {
    app = await criarApp();
    prisma = prismaDe(app);
    await limparBanco(prisma);

    const funcionario = await criarFuncionario(prisma, {
      nome: NOME,
      cargo: Cargo.RECEPCIONISTA,
    });
    id = funcionario.id;
    login = funcionario.login;
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /auth/login com credencial válida → 200 com token e funcionário', async () => {
    const resposta = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ login, senha: SENHA_PADRAO })
      .expect(200);

    const corpo = resposta.body as {
      accessToken: unknown;
      funcionario: unknown;
    };
    expect(typeof corpo.accessToken).toBe('string');
    expect(corpo.accessToken).not.toBe('');
    expect(corpo.funcionario).toEqual({
      id,
      nome: NOME,
      cargo: 'RECEPCIONISTA',
    });
    expect(JSON.stringify(corpo)).not.toContain('senhaHash');

    token = corpo.accessToken as string;
  });

  it('GET /auth/me com o token → 200 com o funcionário, sem senhaHash', async () => {
    const resposta = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(resposta.body).toEqual({
      id,
      nome: NOME,
      cargo: 'RECEPCIONISTA',
      login,
      ativo: true,
    });
  });

  it('GET /auth/me com o token de funcionário desativado → 401', async () => {
    await prisma.funcionario.update({
      where: { id },
      data: { ativo: false },
    });

    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(401)
      .expect({
        statusCode: 401,
        message: MENSAGEM_TOKEN,
        error: 'Unauthorized',
      });
  });
});
