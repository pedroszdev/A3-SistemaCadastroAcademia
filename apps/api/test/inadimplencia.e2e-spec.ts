import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { hoje } from '../src/common/utils/date';
import { Cargo } from '../src/generated/prisma/enums';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  bearer,
  criarApp,
  criarMembro,
  diasAtras,
  limparBanco,
  loginComo,
  prismaDe,
} from './utils';

// RN09 ponta a ponta: inadimplente (atraso > DIAS_TOLERANCIA) não registra atividade.

/** A API recebe dia de calendário como AAAA-MM-DD. */
function dia(data: Date): string {
  return data.toISOString().slice(0, 10);
}

describe('Regra de inadimplência (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let tokenRecepcao: string;
  let tokenInstrutor: string;

  beforeAll(async () => {
    app = await criarApp();
    prisma = prismaDe(app);
  });

  beforeEach(async () => {
    await limparBanco(prisma);
    tokenRecepcao = (await loginComo(app, Cargo.RECEPCIONISTA)).token;
    tokenInstrutor = (await loginComo(app, Cargo.INSTRUTOR)).token;
  });

  afterAll(async () => {
    await app.close();
  });

  async function lancarPagamento(
    membroId: string,
    diasDeAtraso: number,
  ): Promise<{ id: string }> {
    const resposta = await request(app.getHttpServer())
      .post('/pagamentos')
      .set('Authorization', bearer(tokenRecepcao))
      .send({
        membroId,
        valor: 120,
        dataVencimento: dia(diasAtras(diasDeAtraso)),
      })
      .expect(201);

    return resposta.body as { id: string };
  }

  function registrarAtividade(membroId: string) {
    return request(app.getHttpServer())
      .post('/atividades')
      .set('Authorization', bearer(tokenInstrutor))
      .send({
        membroId,
        atividade: 'Esteira',
        data: dia(hoje()),
        tempoExecucao: 30,
      });
  }

  it('vencido há 5 dias → 201 (dentro da tolerância)', async () => {
    const membro = await criarMembro(prisma);
    await lancarPagamento(membro.id, 5);

    const resposta = await registrarAtividade(membro.id).expect(201);

    expect(resposta.body).toMatchObject({ membroId: membro.id });
  });
});
