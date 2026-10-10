-- CreateEnum
CREATE TYPE "StatusPagamento" AS ENUM ('PENDENTE', 'PAGO', 'ATRASADO', 'CANCELADO');

-- CreateTable
CREATE TABLE "membros" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf" CHAR(11) NOT NULL,
    "telefone" TEXT NOT NULL,
    "endereco" TEXT NOT NULL,
    "data_cadastro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "membros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "treinos" (
    "id" SERIAL NOT NULL,
    "membro_id" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "duracao" INTEGER NOT NULL,
    "data_inicio" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "treinos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagamentos" (
    "id" SERIAL NOT NULL,
    "membro_id" INTEGER NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "data_pagamento" TIMESTAMP(3) NOT NULL,
    "status" "StatusPagamento" NOT NULL DEFAULT 'PENDENTE',

    CONSTRAINT "pagamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historico_atividades" (
    "id" SERIAL NOT NULL,
    "membro_id" INTEGER NOT NULL,
    "funcionario_id" INTEGER,
    "atividade" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "tempo_execucao" INTEGER NOT NULL,

    CONSTRAINT "historico_atividades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "funcionarios" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "cargo" TEXT NOT NULL,
    "login" TEXT NOT NULL,
    "senha_hash" TEXT NOT NULL,

    CONSTRAINT "funcionarios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "membros_cpf_key" ON "membros"("cpf");

-- CreateIndex
CREATE INDEX "treinos_membro_id_idx" ON "treinos"("membro_id");

-- CreateIndex
CREATE INDEX "pagamentos_membro_id_idx" ON "pagamentos"("membro_id");

-- CreateIndex
CREATE INDEX "historico_atividades_membro_id_idx" ON "historico_atividades"("membro_id");

-- CreateIndex
CREATE INDEX "historico_atividades_funcionario_id_idx" ON "historico_atividades"("funcionario_id");

-- CreateIndex
CREATE UNIQUE INDEX "funcionarios_login_key" ON "funcionarios"("login");

-- AddForeignKey
ALTER TABLE "treinos" ADD CONSTRAINT "treinos_membro_id_fkey" FOREIGN KEY ("membro_id") REFERENCES "membros"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamentos" ADD CONSTRAINT "pagamentos_membro_id_fkey" FOREIGN KEY ("membro_id") REFERENCES "membros"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_atividades" ADD CONSTRAINT "historico_atividades_membro_id_fkey" FOREIGN KEY ("membro_id") REFERENCES "membros"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_atividades" ADD CONSTRAINT "historico_atividades_funcionario_id_fkey" FOREIGN KEY ("funcionario_id") REFERENCES "funcionarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
