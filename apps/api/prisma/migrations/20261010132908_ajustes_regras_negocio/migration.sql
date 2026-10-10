/*
  Warnings:

  - The primary key for the `funcionarios` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `historico_atividades` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `funcionario_id` column on the `historico_atividades` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `membros` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `pagamentos` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `treinos` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Changed the type of `id` on the `funcionarios` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `cargo` on the `funcionarios` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `historico_atividades` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `membro_id` on the `historico_atividades` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `membros` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `data_vencimento` to the `pagamentos` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `id` on the `pagamentos` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `membro_id` on the `pagamentos` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `treinos` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `membro_id` on the `treinos` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "Cargo" AS ENUM ('ADMIN', 'RECEPCIONISTA', 'INSTRUTOR');

-- DropForeignKey
ALTER TABLE "historico_atividades" DROP CONSTRAINT "historico_atividades_funcionario_id_fkey";

-- DropForeignKey
ALTER TABLE "historico_atividades" DROP CONSTRAINT "historico_atividades_membro_id_fkey";

-- DropForeignKey
ALTER TABLE "pagamentos" DROP CONSTRAINT "pagamentos_membro_id_fkey";

-- DropForeignKey
ALTER TABLE "treinos" DROP CONSTRAINT "treinos_membro_id_fkey";

-- AlterTable
ALTER TABLE "funcionarios" DROP CONSTRAINT "funcionarios_pkey",
ADD COLUMN     "ativo" BOOLEAN NOT NULL DEFAULT true,
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "cargo",
ADD COLUMN     "cargo" "Cargo" NOT NULL,
ADD CONSTRAINT "funcionarios_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "historico_atividades" DROP CONSTRAINT "historico_atividades_pkey",
ADD COLUMN     "treino_id" UUID,
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "membro_id",
ADD COLUMN     "membro_id" UUID NOT NULL,
DROP COLUMN "funcionario_id",
ADD COLUMN     "funcionario_id" UUID,
ADD CONSTRAINT "historico_atividades_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "membros" DROP CONSTRAINT "membros_pkey",
ADD COLUMN     "ativo" BOOLEAN NOT NULL DEFAULT true,
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "membros_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "pagamentos" DROP CONSTRAINT "pagamentos_pkey",
ADD COLUMN     "data_vencimento" DATE NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "membro_id",
ADD COLUMN     "membro_id" UUID NOT NULL,
ALTER COLUMN "data_pagamento" DROP NOT NULL,
ADD CONSTRAINT "pagamentos_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "treinos" DROP CONSTRAINT "treinos_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "membro_id",
ADD COLUMN     "membro_id" UUID NOT NULL,
ADD CONSTRAINT "treinos_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE INDEX "historico_atividades_membro_id_idx" ON "historico_atividades"("membro_id");

-- CreateIndex
CREATE INDEX "historico_atividades_funcionario_id_idx" ON "historico_atividades"("funcionario_id");

-- CreateIndex
CREATE INDEX "historico_atividades_treino_id_idx" ON "historico_atividades"("treino_id");

-- CreateIndex
CREATE INDEX "pagamentos_membro_id_idx" ON "pagamentos"("membro_id");

-- CreateIndex
CREATE INDEX "pagamentos_status_data_vencimento_idx" ON "pagamentos"("status", "data_vencimento");

-- CreateIndex
CREATE INDEX "treinos_membro_id_idx" ON "treinos"("membro_id");

-- AddForeignKey
ALTER TABLE "treinos" ADD CONSTRAINT "treinos_membro_id_fkey" FOREIGN KEY ("membro_id") REFERENCES "membros"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamentos" ADD CONSTRAINT "pagamentos_membro_id_fkey" FOREIGN KEY ("membro_id") REFERENCES "membros"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_atividades" ADD CONSTRAINT "historico_atividades_membro_id_fkey" FOREIGN KEY ("membro_id") REFERENCES "membros"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_atividades" ADD CONSTRAINT "historico_atividades_funcionario_id_fkey" FOREIGN KEY ("funcionario_id") REFERENCES "funcionarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_atividades" ADD CONSTRAINT "historico_atividades_treino_id_fkey" FOREIGN KEY ("treino_id") REFERENCES "treinos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
