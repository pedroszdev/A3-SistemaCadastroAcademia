import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { hash } from 'bcryptjs';
import { Cargo } from '../src/generated/prisma/enums';
import { PrismaClient } from '../src/generated/prisma/client';

// Só para desenvolvimento: dados fictícios e senha conhecida.
const SENHA_DEV = 'senha1234';
const SALT_ROUNDS = 10;

const FUNCIONARIOS = [
  { nome: 'Administrador', login: 'admin', cargo: Cargo.ADMIN },
  { nome: 'Recepção', login: 'recepcao', cargo: Cargo.RECEPCIONISTA },
  { nome: 'Instrutor', login: 'instrutor', cargo: Cargo.INSTRUTOR },
];

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('O seed não pode rodar em produção');
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL não definida');
  }
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  try {
    const senhaHash = await hash(SENHA_DEV, SALT_ROUNDS);
    for (const funcionario of FUNCIONARIOS) {
      await prisma.funcionario.upsert({
        where: { login: funcionario.login },
        update: {},
        create: { ...funcionario, senhaHash },
      });
    }
  } finally {
    await prisma.$disconnect();
  }
}

void main();
