import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { Cargo } from '../src/generated/prisma/enums';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  bearer,
  criarApp,
  criarFuncionario,
  limparBanco,
  loginComo,
  prismaDe,
} from './utils';

const ID = '0199f0a2-7b3c-7d4e-8f00-123456789abc';
const MENSAGEM_PROIBIDO = 'Você não tem permissão para acessar este recurso';

describe('Funcionários (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await criarApp();
    prisma = prismaDe(app);
  });

  beforeEach(async () => {
    await limparBanco(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  describe.each([Cargo.RECEPCIONISTA, Cargo.INSTRUTOR])('como %s', (cargo) => {
    it.each([
      ['get', '/funcionarios'],
      ['post', '/funcionarios'],
      ['get', `/funcionarios/${ID}`],
      ['patch', `/funcionarios/${ID}`],
      ['patch', `/funcionarios/${ID}/desativar`],
      ['patch', `/funcionarios/${ID}/reativar`],
    ] as const)('%s %s → 403', async (metodo, rota) => {
      const { token } = await loginComo(app, cargo);

      await request(app.getHttpServer())
        [metodo](rota)
        .set('Authorization', bearer(token))
        .expect(403)
        .expect({
          statusCode: 403,
          message: MENSAGEM_PROIBIDO,
          error: 'Forbidden',
        });
    });
  });

  it('POST /funcionarios com body inválido como RECEPCIONISTA → 403, não 400', async () => {
    const { token } = await loginComo(app, Cargo.RECEPCIONISTA);

    await request(app.getHttpServer())
      .post('/funcionarios')
      .set('Authorization', bearer(token))
      .send({})
      .expect(403);
  });

  it('ADMIN lista funcionários → 200', async () => {
    const { token } = await loginComo(app, Cargo.ADMIN);

    await request(app.getHttpServer())
      .get('/funcionarios')
      .set('Authorization', bearer(token))
      .expect(200);
  });

  it('ADMIN cria funcionário → 201', async () => {
    const { token } = await loginComo(app, Cargo.ADMIN);

    await request(app.getHttpServer())
      .post('/funcionarios')
      .set('Authorization', bearer(token))
      .send({
        nome: 'Maria Souza',
        cargo: Cargo.INSTRUTOR,
        login: 'maria01',
        senha: 'senha-segura-1234',
      })
      .expect(201);
  });

  it('ADMIN desativando a si mesmo → 422 e continua ativo', async () => {
    const { token, funcionario } = await loginComo(app, Cargo.ADMIN);

    const resposta = await request(app.getHttpServer())
      .patch(`/funcionarios/${funcionario.id}/desativar`)
      .set('Authorization', bearer(token))
      .expect(422);

    expect((resposta.body as { message: string }).message).toBe(
      'Você não pode desativar o próprio usuário',
    );
    const noBanco = await prisma.funcionario.findUniqueOrThrow({
      where: { id: funcionario.id },
    });
    expect(noBanco.ativo).toBe(true);
  });

  it('ADMIN desativando a si mesmo com o id em maiúsculas → 422 e continua ativo', async () => {
    const { token, funcionario } = await loginComo(app, Cargo.ADMIN);
    // Com outro ADMIN ativo, só a regra de não desativar a si mesmo pode barrar.
    await criarFuncionario(prisma, { cargo: Cargo.ADMIN });

    await request(app.getHttpServer())
      .patch(`/funcionarios/${funcionario.id.toUpperCase()}/desativar`)
      .set('Authorization', bearer(token))
      .expect(422);

    const noBanco = await prisma.funcionario.findUniqueOrThrow({
      where: { id: funcionario.id },
    });
    expect(noBanco.ativo).toBe(true);
  });

  it('ADMIN desativa outro funcionário → 200 e fica inativo', async () => {
    const { token } = await loginComo(app, Cargo.ADMIN);
    const outro = await criarFuncionario(prisma, { cargo: Cargo.INSTRUTOR });

    await request(app.getHttpServer())
      .patch(`/funcionarios/${outro.id}/desativar`)
      .set('Authorization', bearer(token))
      .expect(200);

    const noBanco = await prisma.funcionario.findUniqueOrThrow({
      where: { id: outro.id },
    });
    expect(noBanco.ativo).toBe(false);
  });
});
