import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { configurarApp } from '../../src/configurar-app';

/** Sobe o AppModule com os mesmos pipes do main.ts. Feche com `await app.close()`. */
export async function criarApp(): Promise<INestApplication<App>> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication<INestApplication<App>>();
  configurarApp(app);
  await app.init();
  return app;
}

export function prismaDe(app: INestApplication<App>): PrismaService {
  return app.get(PrismaService);
}
