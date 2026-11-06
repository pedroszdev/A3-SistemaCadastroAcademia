-- RN15: acesso do aluno. Nulo enquanto a recepção não liberar.
-- AlterTable
ALTER TABLE "membros" ADD COLUMN "senha_hash" TEXT;
