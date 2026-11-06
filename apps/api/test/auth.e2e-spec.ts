import { INestApplication } from '@nestjs/common';
import { hashSync } from 'bcryptjs';
import request from 'supertest';
import { App } from 'supertest/types';
import { Cargo } from '../src/generated/prisma/enums';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  criarApp,
  criarFuncionario,
  criarMembro,
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

  describe('aluno', () => {
    let membroId: string;
    let cpf: string;
    let tokenAluno: string;

    beforeAll(async () => {
      const membro = await criarMembro(prisma, {
        senhaHash: hashSync(SENHA_PADRAO, 4),
      });
      membroId = membro.id;
      cpf = membro.cpf;
    });

    it('POST /auth/login-aluno com CPF mascarado → 200 com token e aluno', async () => {
      const mascarado = `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;

      const resposta = await request(app.getHttpServer())
        .post('/auth/login-aluno')
        .send({ cpf: mascarado, senha: SENHA_PADRAO })
        .expect(200);

      const corpo = resposta.body as { accessToken: string; aluno: unknown };
      expect(corpo.aluno).toMatchObject({ id: membroId });
      expect(JSON.stringify(corpo)).not.toContain('senhaHash');
      tokenAluno = corpo.accessToken;
    });

    it('GET /auth/me com token de aluno → 200 com o membro, sem senhaHash', async () => {
      const resposta = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${tokenAluno}`)
        .expect(200);

      expect(resposta.body).toMatchObject({ id: membroId, cpf });
      expect(JSON.stringify(resposta.body)).not.toContain('senhaHash');
    });

    it('GET /membros com token de aluno → 403', async () => {
      await request(app.getHttpServer())
        .get('/membros')
        .set('Authorization', `Bearer ${tokenAluno}`)
        .expect(403);
    });

    it('membro sem senhaHash → 401 genérico', async () => {
      const semAcesso = await criarMembro(prisma);

      await request(app.getHttpServer())
        .post('/auth/login-aluno')
        .send({ cpf: semAcesso.cpf, senha: SENHA_PADRAO })
        .expect(401)
        .expect({
          statusCode: 401,
          message: 'Login ou senha inválidos',
          error: 'Unauthorized',
        });
    });

    // Cada caso loga o próprio aluno e confere que o token vale antes da
    // mudança: assim o 401 vem da mudança, e não de um token ausente.
    it.each([
      ['desativado', { ativo: false }],
      ['com acesso revogado', { senhaHash: null }],
    ])('token de aluno %s → 401', async (_caso, mudanca) => {
      const membro = await criarMembro(prisma, {
        senhaHash: hashSync(SENHA_PADRAO, 4),
      });
      const login = await request(app.getHttpServer())
        .post('/auth/login-aluno')
        .send({ cpf: membro.cpf, senha: SENHA_PADRAO })
        .expect(200);
      const { accessToken } = login.body as { accessToken: string };
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      await prisma.membro.update({ where: { id: membro.id }, data: mudanca });

      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(401)
        .expect({
          statusCode: 401,
          message: MENSAGEM_TOKEN,
          error: 'Unauthorized',
        });
    });
  });
});
