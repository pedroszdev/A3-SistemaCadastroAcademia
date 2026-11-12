import { INestApplication } from '@nestjs/common';
import { hashSync } from 'bcryptjs';
import request from 'supertest';
import { App } from 'supertest/types';
import { Cargo } from '../src/generated/prisma/enums';
import {
  SENHA_PADRAO,
  bearer,
  criarApp,
  criarMembro,
  limparBanco,
  loginComo,
  prismaDe,
} from './utils';

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
    ['patch', `/membros/${MEMBRO_ID}/acesso`],
    ['delete', `/membros/${MEMBRO_ID}/acesso`],
  ] as const)('%s %s sem token → 401', async (metodo, rota) => {
    await request(app.getHttpServer())[metodo](rota).expect(401);
  });

  it.each([
    `/membros/${MEMBRO_ID}/situacao`,
    `/membros/${MEMBRO_ID}/atividades`,
  ])('GET %s sem token → 401 (a rota existe)', async (rota) => {
    await request(app.getHttpServer()).get(rota).expect(401);
  });

  describe('acesso do aluno (MEM-07)', () => {
    let token: string;

    beforeEach(async () => {
      await limparBanco(prismaDe(app));
      ({ token } = await loginComo(app, Cargo.RECEPCIONISTA));
    });

    const liberar = (id: string, senha: string) =>
      request(app.getHttpServer())
        .patch(`/membros/${id}/acesso`)
        .set('Authorization', bearer(token))
        .send({ senha });

    const loginAluno = (cpf: string, senha: string) =>
      request(app.getHttpServer())
        .post('/auth/login-aluno')
        .send({ cpf, senha });

    it('a RECEPCIONISTA libera e o aluno loga com a senha (RN15)', async () => {
      const membro = await criarMembro(prismaDe(app));

      const resposta = await liberar(membro.id, 'senha-do-aluno-123').expect(
        200,
      );

      expect(resposta.body).toMatchObject({
        id: membro.id,
        acessoLiberado: true,
      });
      expect(JSON.stringify(resposta.body)).not.toContain('senhaHash');
      const detalhe = await request(app.getHttpServer())
        .get(`/membros/${membro.id}`)
        .set('Authorization', bearer(token))
        .expect(200);
      expect(detalhe.body).toMatchObject({ acessoLiberado: true });
      await loginAluno(membro.cpf, 'senha-do-aluno-123').expect(200);
    });

    it('redefinir: a senha antiga para de logar', async () => {
      const membro = await criarMembro(prismaDe(app));

      await liberar(membro.id, 'senha-antiga-1').expect(200);
      await liberar(membro.id, 'senha-nova-123').expect(200);

      await loginAluno(membro.cpf, 'senha-antiga-1').expect(401);
      await loginAluno(membro.cpf, 'senha-nova-123').expect(200);
    });

    it('revogar: o login e o token do aluno param de valer', async () => {
      const membro = await criarMembro(prismaDe(app));
      await liberar(membro.id, 'senha-do-aluno-123').expect(200);
      const login = await loginAluno(membro.cpf, 'senha-do-aluno-123').expect(
        200,
      );
      const { accessToken } = login.body as { accessToken: string };

      const resposta = await request(app.getHttpServer())
        .delete(`/membros/${membro.id}/acesso`)
        .set('Authorization', bearer(token))
        .expect(200);

      expect(resposta.body).toMatchObject({ acessoLiberado: false });
      await loginAluno(membro.cpf, 'senha-do-aluno-123').expect(401);
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', bearer(accessToken))
        .expect(401);
    });

    it('membro inativo: liberar → 422 e nada gravado; revogar funciona', async () => {
      const prisma = prismaDe(app);
      const inativo = await criarMembro(prisma, { ativo: false });

      await liberar(inativo.id, 'senha-do-aluno-123').expect(422);

      const gravado = await prisma.membro.findUnique({
        where: { id: inativo.id },
        select: { senhaHash: true },
      });
      expect(gravado?.senhaHash).toBeNull();

      const comAcesso = await criarMembro(prisma, {
        ativo: false,
        senhaHash: hashSync(SENHA_PADRAO, 4),
      });
      const resposta = await request(app.getHttpServer())
        .delete(`/membros/${comAcesso.id}/acesso`)
        .set('Authorization', bearer(token))
        .expect(200);
      expect(resposta.body).toMatchObject({ acessoLiberado: false });
    });
  });
});
