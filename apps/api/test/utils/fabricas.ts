import { hashSync } from 'bcryptjs';
import { hoje } from '../../src/common/utils/date';
import { Cargo, StatusPagamento } from '../../src/generated/prisma/enums';
import { Prisma } from '../../src/generated/prisma/client';
import { PrismaService } from '../../src/prisma/prisma.service';

// Dados fictícios (LGPD). As fábricas gravam direto pelo Prisma; o que o teste
// quer validar pela API, ele faz por HTTP.

const MS_POR_DIA = 86_400_000;
// Custo baixo do bcrypt: os e2e fazem muitos logins e não precisam de hash caro.
const CUSTO_BCRYPT = 4;

export const SENHA_PADRAO = 'senha-e2e-1234';

let sequencia = 0;

function proximo(): number {
  return ++sequencia;
}

/** Pesos decrescentes até 2; resto 10 vira 0 (mesmo cálculo de src/common/validators/cpf.ts). */
function digitoVerificador(digitos: string): number {
  const soma = [...digitos].reduce(
    (total, digito, i) => total + Number(digito) * (digitos.length + 1 - i),
    0,
  );
  const resto = (soma * 10) % 11;
  return resto === 10 ? 0 : resto;
}

/** CPF válido de 11 dígitos, diferente a cada chamada. */
export function gerarCpf(): string {
  const base = String(
    (Date.now() % 1_000_000) * 1000 + (proximo() % 1000),
  ).padStart(9, '0');
  const primeiro = digitoVerificador(base);
  const segundo = digitoVerificador(`${base}${primeiro}`);
  return `${base}${primeiro}${segundo}`;
}

/** Dia de calendário (meia-noite UTC) de `dias` dias antes de `hoje()`. */
export function diasAtras(dias: number): Date {
  return new Date(hoje().getTime() - dias * MS_POR_DIA);
}

/** Dia de calendário no formato que a API recebe por HTTP (AAAA-MM-DD). */
export function diaIso(data: Date): string {
  return data.toISOString().slice(0, 10);
}

export async function criarFuncionario(
  prisma: PrismaService,
  dados: Partial<{
    nome: string;
    login: string;
    cargo: Cargo;
    senha: string;
    ativo: boolean;
  }> = {},
) {
  const numero = proximo();
  const senha = dados.senha ?? SENHA_PADRAO;
  const funcionario = await prisma.funcionario.create({
    data: {
      nome: dados.nome ?? `Funcionário E2E ${numero}`,
      login: dados.login ?? `e2e-func-${numero}-${Date.now()}`,
      cargo: dados.cargo ?? Cargo.ADMIN,
      senhaHash: hashSync(senha, CUSTO_BCRYPT),
      ativo: dados.ativo ?? true,
    },
    select: { id: true, nome: true, login: true, cargo: true, ativo: true },
  });
  return { ...funcionario, senha };
}

export function criarMembro(
  prisma: PrismaService,
  dados: Partial<Prisma.MembroUncheckedCreateInput> = {},
) {
  const numero = proximo();
  return prisma.membro.create({
    data: {
      nome: `Membro E2E ${numero}`,
      cpf: gerarCpf(),
      telefone: '48999990000',
      endereco: `Rua Fictícia, ${numero}`,
      ...dados,
    },
  });
}

export function criarTreino(
  prisma: PrismaService,
  membroId: string,
  dados: Partial<Omit<Prisma.TreinoUncheckedCreateInput, 'membroId'>> = {},
) {
  return prisma.treino.create({
    data: {
      tipo: 'Musculação',
      descricao: `Treino E2E ${proximo()}`,
      duracao: 60,
      dataInicio: hoje(),
      ...dados,
      membroId,
    },
  });
}

export function criarPagamento(
  prisma: PrismaService,
  membroId: string,
  dados: Partial<Omit<Prisma.PagamentoUncheckedCreateInput, 'membroId'>> = {},
) {
  return prisma.pagamento.create({
    data: {
      valor: '120.00',
      dataVencimento: hoje(),
      dataPagamento: null,
      status: StatusPagamento.PENDENTE,
      ...dados,
      membroId,
    },
  });
}

export function criarAtividade(
  prisma: PrismaService,
  dados: { membroId: string } & Partial<
    Omit<Prisma.HistoricoAtividadeUncheckedCreateInput, 'membroId'>
  >,
) {
  return prisma.historicoAtividade.create({
    data: {
      atividade: 'Esteira',
      data: hoje(),
      tempoExecucao: 30,
      ...dados,
    },
  });
}
