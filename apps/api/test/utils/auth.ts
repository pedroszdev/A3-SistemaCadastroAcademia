import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { Cargo } from '../../src/generated/prisma/enums';
import { PrismaService } from '../../src/prisma/prisma.service';
import { criarFuncionario } from './fabricas';

type FuncionarioCriado = Awaited<ReturnType<typeof criarFuncionario>>;

/** Cria um funcionário ativo do cargo, faz o login de verdade e devolve o token. */
export async function loginComo(
  app: INestApplication<App>,
  cargo: Cargo,
): Promise<{ token: string; funcionario: FuncionarioCriado }> {
  const funcionario = await criarFuncionario(app.get(PrismaService), { cargo });

  const resposta = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ login: funcionario.login, senha: funcionario.senha })
    .expect(200);

  const { accessToken } = resposta.body as { accessToken: string };
  return { token: accessToken, funcionario };
}

/** Valor do header Authorization: `.set('Authorization', bearer(token))`. */
export function bearer(token: string): string {
  return `Bearer ${token}`;
}
