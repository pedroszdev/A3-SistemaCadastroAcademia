import { PrismaPg } from '@prisma/adapter-pg';
import { hash } from 'bcryptjs';
import { config } from 'dotenv';
import { hoje } from '../src/common/utils/date';
import { isCpfValido } from '../src/common/validators/cpf';
import { Cargo, StatusPagamento } from '../src/generated/prisma/enums';
import { PrismaClient } from '../src/generated/prisma/client';

// Só para desenvolvimento: dados fictícios e senha conhecida.
// Rodar de novo restaura os 10 membros do seed ao estado de demonstração (e apaga
// e recria os treinos, pagamentos e atividades deles). O seed reconhece os membros
// dele pelo CPF: membros com outros CPFs nunca são tocados, e funcionários que já
// existem ficam como estão. Os CPFs não são os de exemplo usados nos testes, para
// não sobrescrever um membro cadastrado à mão com eles.
const SENHA_DEV = 'senha1234';
const SALT_ROUNDS = 10;
const MS_POR_DIA = 86_400_000;
// Antes do registro mais antigo do seed (−80 dias).
const DIAS_DE_CADASTRO = -90;
// Cerca de 30 consultas em sequência; o padrão de 5 s do Prisma é curto num CI lento.
const TIMEOUT_TRANSACAO_MS = 30_000;

const FUNCIONARIOS = [
  { nome: 'Administrador', login: 'admin', cargo: Cargo.ADMIN },
  { nome: 'Recepção', login: 'recepcao', cargo: Cargo.RECEPCIONISTA },
  { nome: 'Instrutor', login: 'instrutor', cargo: Cargo.INSTRUTOR },
];

const MEMBROS = [
  {
    chave: 'ana',
    nome: 'Ana Souza',
    cpf: '41872395619',
    ativo: true,
    aluno: true,
  },
  {
    chave: 'bruno',
    nome: 'Bruno Lima',
    cpf: '15350946056',
    ativo: true,
    aluno: true,
  },
  {
    chave: 'carla',
    nome: 'Carla Mendes',
    cpf: '71460238184',
    ativo: true,
    aluno: false,
  },
  {
    chave: 'diego',
    nome: 'Diego Rocha',
    cpf: '86243710904',
    ativo: true,
    aluno: false,
  },
  {
    chave: 'eduarda',
    nome: 'Eduarda Alves',
    cpf: '39011854454',
    ativo: true,
    aluno: false,
  },
  {
    chave: 'felipe',
    nome: 'Felipe Costa',
    cpf: '47125609325',
    ativo: true,
    aluno: false,
  },
  {
    chave: 'gabriela',
    nome: 'Gabriela Nunes',
    cpf: '60839471203',
    ativo: true,
    aluno: false,
  },
  {
    chave: 'henrique',
    nome: 'Henrique Dias',
    cpf: '24578103617',
    ativo: true,
    aluno: false,
  },
  {
    chave: 'isabela',
    nome: 'Isabela Moura',
    cpf: '93701562830',
    ativo: false,
    aluno: false,
  },
  {
    chave: 'joao',
    nome: 'João Pereira',
    cpf: '31684927528',
    ativo: false,
    aluno: false,
  },
];

const TREINOS = [
  {
    chave: 'ana-a',
    membro: 'ana',
    tipo: 'Musculação',
    descricao: 'Treino A: peito, ombro e tríceps',
    duracao: 60,
    dia: -30,
  },
  {
    chave: 'ana-cardio',
    membro: 'ana',
    tipo: 'Cardio',
    descricao: 'Esteira e bicicleta em ritmo moderado',
    duracao: 40,
    dia: -30,
  },
  {
    chave: 'bruno',
    membro: 'bruno',
    tipo: 'Funcional',
    descricao: 'Circuito com peso corporal',
    duracao: 50,
    dia: -60,
  },
  {
    chave: 'diego',
    membro: 'diego',
    tipo: 'Crossfit',
    descricao: 'WOD com levantamento e corrida',
    duracao: 45,
    dia: -20,
  },
  {
    chave: 'eduarda',
    membro: 'eduarda',
    tipo: 'Alongamento',
    descricao: 'Mobilidade de quadril e coluna',
    duracao: 30,
    dia: -15,
  },
  {
    chave: 'felipe',
    membro: 'felipe',
    tipo: 'Musculação',
    descricao: 'Treino B: costas e bíceps',
    duracao: 70,
    dia: -25,
  },
  {
    chave: 'gabriela',
    membro: 'gabriela',
    tipo: 'Cardio',
    descricao: 'Intervalado na bicicleta',
    duracao: 35,
    dia: -10,
  },
  {
    chave: 'henrique',
    membro: 'henrique',
    tipo: 'Outro',
    descricao: 'Natação',
    duracao: 60,
    dia: -5,
  },
  {
    chave: 'isabela',
    membro: 'isabela',
    tipo: 'Musculação',
    descricao: 'Treino full body',
    duracao: 60,
    dia: -80,
  },
];

const PAGAMENTOS = [
  {
    membro: 'ana',
    valor: '120.00',
    vencimento: -35,
    pagamento: -35,
    status: StatusPagamento.PAGO,
  },
  {
    membro: 'ana',
    valor: '120.00',
    vencimento: 5,
    pagamento: null,
    status: StatusPagamento.PENDENTE,
  },
  {
    membro: 'bruno',
    valor: '120.00',
    vencimento: -45,
    pagamento: -44,
    status: StatusPagamento.PAGO,
  },
  {
    membro: 'bruno',
    valor: '120.00',
    vencimento: -15,
    pagamento: null,
    status: StatusPagamento.PENDENTE,
  },
  {
    membro: 'carla',
    valor: '120.00',
    vencimento: -5,
    pagamento: null,
    status: StatusPagamento.PENDENTE,
  },
  {
    membro: 'diego',
    valor: '120.00',
    vencimento: 0,
    pagamento: 0,
    status: StatusPagamento.PAGO,
  },
  {
    membro: 'eduarda',
    valor: '150.00',
    vencimento: -20,
    pagamento: null,
    status: StatusPagamento.CANCELADO,
  },
  {
    membro: 'eduarda',
    valor: '150.00',
    vencimento: -2,
    pagamento: 0,
    status: StatusPagamento.PAGO,
  },
  {
    membro: 'felipe',
    valor: '120.00',
    vencimento: -40,
    pagamento: -40,
    status: StatusPagamento.PAGO,
  },
  {
    membro: 'felipe',
    valor: '120.00',
    vencimento: 10,
    pagamento: null,
    status: StatusPagamento.PENDENTE,
  },
  {
    membro: 'gabriela',
    valor: '99.90',
    vencimento: 0,
    pagamento: 0,
    status: StatusPagamento.PAGO,
  },
  {
    membro: 'henrique',
    valor: '120.00',
    vencimento: 3,
    pagamento: null,
    status: StatusPagamento.PENDENTE,
  },
  {
    membro: 'isabela',
    valor: '120.00',
    vencimento: -60,
    pagamento: -60,
    status: StatusPagamento.PAGO,
  },
  {
    membro: 'joao',
    valor: '120.00',
    vencimento: -80,
    pagamento: -80,
    status: StatusPagamento.PAGO,
  },
  {
    membro: 'joao',
    valor: '120.00',
    vencimento: -50,
    pagamento: null,
    status: StatusPagamento.CANCELADO,
  },
];

type Executor = 'instrutor' | 'admin';

// [membro, atividade, dia, tempo (min), chave do treino do mesmo membro, quem registrou]
const ATIVIDADES: [string, string, number, number, string | null, Executor][] =
  [
    ['ana', 'Supino', 0, 45, 'ana-a', 'instrutor'],
    ['diego', 'Corrida', 0, 45, 'diego', 'instrutor'],
    ['gabriela', 'Bicicleta', 0, 35, 'gabriela', 'instrutor'],
    ['ana', 'Esteira', -1, 30, 'ana-cardio', 'instrutor'],
    ['ana', 'Supino', -3, 50, 'ana-a', 'instrutor'],
    ['ana', 'Agachamento', -5, 60, 'ana-a', 'admin'],
    ['ana', 'Bicicleta', -8, 40, 'ana-cardio', 'instrutor'],
    ['ana', 'Remada', -12, 45, 'ana-a', 'instrutor'],
    ['bruno', 'Prancha', -8, 20, 'bruno', 'instrutor'],
    ['bruno', 'Agachamento', -12, 40, 'bruno', 'instrutor'],
    ['bruno', 'Esteira', -20, 30, null, 'admin'],
    ['carla', 'Esteira', -2, 30, null, 'instrutor'],
    ['carla', 'Alongamento', -6, 20, null, 'instrutor'],
    ['carla', 'Bicicleta', -10, 35, null, 'instrutor'],
    ['diego', 'Agachamento', -2, 50, 'diego', 'instrutor'],
    ['diego', 'Corrida', -7, 30, 'diego', 'admin'],
    ['eduarda', 'Alongamento', -1, 25, 'eduarda', 'instrutor'],
    ['eduarda', 'Prancha', -4, 15, 'eduarda', 'instrutor'],
    ['eduarda', 'Natação', -9, 40, null, 'instrutor'],
    ['felipe', 'Remada', -2, 55, 'felipe', 'instrutor'],
    ['felipe', 'Supino', -6, 50, 'felipe', 'admin'],
    ['felipe', 'Esteira', -11, 30, null, 'instrutor'],
    ['gabriela', 'Bicicleta', -3, 35, 'gabriela', 'instrutor'],
    ['gabriela', 'Esteira', -7, 30, null, 'instrutor'],
    ['henrique', 'Natação', -1, 60, 'henrique', 'instrutor'],
    ['henrique', 'Natação', -3, 50, 'henrique', 'instrutor'],
    ['henrique', 'Alongamento', -4, 15, null, 'instrutor'],
    ['isabela', 'Supino', -60, 50, 'isabela', 'instrutor'],
    ['isabela', 'Esteira', -65, 30, null, 'instrutor'],
    ['joao', 'Bicicleta', -70, 40, null, 'admin'],
  ];

function idDe(ids: Map<string, string>, chave: string): string {
  const id = ids.get(chave);
  if (!id) {
    throw new Error(`Chave do seed sem registro: ${chave}`);
  }
  return id;
}

export async function seed(prisma: PrismaClient): Promise<void> {
  // A trava fica aqui, e não só no main(): quem importar o seed() também passa por ela.
  if (process.env.NODE_ENV === 'production') {
    throw new Error('O seed não pode rodar em produção');
  }

  const invalido = MEMBROS.find(({ cpf }) => !isCpfValido(cpf));
  if (invalido) {
    throw new Error(`CPF inválido no seed: ${invalido.nome}`);
  }

  const senhaHash = await hash(SENHA_DEV, SALT_ROUNDS);
  // Um único "hoje" para o seed inteiro, mesmo se a meia-noite virar no meio.
  const base = hoje();
  /** Dia de calendário (meia-noite UTC) a `offset` dias de `base`; negativo é passado. */
  const dia = (offset: number) =>
    new Date(base.getTime() + offset * MS_POR_DIA);

  await prisma.$transaction(
    async (tx) => {
      const funcionarios = new Map<string, string>();
      for (const funcionario of FUNCIONARIOS) {
        const { id } = await tx.funcionario.upsert({
          where: { login: funcionario.login },
          update: {},
          create: { ...funcionario, senhaHash },
        });
        funcionarios.set(funcionario.login, id);
      }

      const membros = new Map<string, string>();
      for (const [indice, membro] of MEMBROS.entries()) {
        const numero = String(indice + 1).padStart(2, '0');
        const dados = {
          nome: membro.nome,
          telefone: `489999900${numero}`,
          endereco: `Rua Fictícia, ${numero}`,
          ativo: membro.ativo,
          senhaHash: membro.aluno ? senhaHash : null,
          dataCadastro: dia(DIAS_DE_CADASTRO),
        };
        const { id } = await tx.membro.upsert({
          where: { cpf: membro.cpf },
          update: dados,
          create: { cpf: membro.cpf, ...dados },
        });
        membros.set(membro.chave, id);
      }

      const where = { membroId: { in: [...membros.values()] } };
      await tx.historicoAtividade.deleteMany({ where });
      await tx.pagamento.deleteMany({ where });
      await tx.treino.deleteMany({ where });

      const treinos = new Map<string, string>();
      for (const treino of TREINOS) {
        const { id } = await tx.treino.create({
          data: {
            membroId: idDe(membros, treino.membro),
            tipo: treino.tipo,
            descricao: treino.descricao,
            duracao: treino.duracao,
            dataInicio: dia(treino.dia),
          },
        });
        treinos.set(treino.chave, id);
      }

      await tx.pagamento.createMany({
        data: PAGAMENTOS.map((pagamento) => ({
          membroId: idDe(membros, pagamento.membro),
          valor: pagamento.valor,
          dataVencimento: dia(pagamento.vencimento),
          dataPagamento:
            pagamento.pagamento === null ? null : dia(pagamento.pagamento),
          status: pagamento.status,
        })),
      });

      await tx.historicoAtividade.createMany({
        data: ATIVIDADES.map(
          ([membro, atividade, offset, tempo, treino, executor]) => ({
            membroId: idDe(membros, membro),
            funcionarioId: idDe(funcionarios, executor),
            treinoId: treino === null ? null : idDe(treinos, treino),
            atividade,
            data: dia(offset),
            tempoExecucao: tempo,
          }),
        ),
      });
    },
    { timeout: TIMEOUT_TRANSACAO_MS },
  );
}

async function main() {
  config();
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL não definida');
  }
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  try {
    await seed(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  void main();
}
