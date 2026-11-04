import { PrismaService } from '../../src/prisma/prisma.service';

const SUFIXO_BANCO_TESTE = '_test';

/**
 * Esvazia todas as tabelas do schema public (menos `_prisma_migrations`).
 * Recusa rodar fora de um banco cujo nome termina em `_test`, para nunca
 * apagar o banco de desenvolvimento.
 */
export async function limparBanco(prisma: PrismaService): Promise<void> {
  const [{ nome }] = await prisma.$queryRaw<
    { nome: string }[]
  >`SELECT current_database() AS nome`;
  if (!nome.endsWith(SUFIXO_BANCO_TESTE)) {
    throw new Error(
      `limparBanco só roda num banco cujo nome termina em ${SUFIXO_BANCO_TESTE} (atual: ${nome}). Veja "Banco de teste" no CONTRIBUTING.md.`,
    );
  }

  const tabelas = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  if (tabelas.length === 0) {
    return;
  }

  // Os nomes vêm do catálogo do Postgres, nunca de entrada externa.
  const lista = tabelas.map(({ tablename }) => `"${tablename}"`).join(', ');
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${lista} RESTART IDENTITY CASCADE`,
  );
}
