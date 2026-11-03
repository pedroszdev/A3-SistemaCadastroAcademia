-- RN07: ATRASADO é calculado na resposta e não pode ser gravado.
-- Linhas gravadas como ATRASADO voltam a PENDENTE: o status calculado continua o mesmo.
UPDATE "pagamentos" SET "status" = 'PENDENTE' WHERE "status" = 'ATRASADO';

-- AlterEnum
BEGIN;
CREATE TYPE "StatusPagamento_new" AS ENUM ('PENDENTE', 'PAGO', 'CANCELADO');
ALTER TABLE "public"."pagamentos" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "pagamentos" ALTER COLUMN "status" TYPE "StatusPagamento_new" USING ("status"::text::"StatusPagamento_new");
ALTER TYPE "StatusPagamento" RENAME TO "StatusPagamento_old";
ALTER TYPE "StatusPagamento_new" RENAME TO "StatusPagamento";
DROP TYPE "public"."StatusPagamento_old";
ALTER TABLE "pagamentos" ALTER COLUMN "status" SET DEFAULT 'PENDENTE';
COMMIT;
