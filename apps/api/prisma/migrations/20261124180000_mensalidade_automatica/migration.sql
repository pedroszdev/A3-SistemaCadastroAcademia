-- Mensalidade automática: cada membro tem o valor e o dia do vencimento. Nulos nos
-- membros já cadastrados, que seguem sem cobrança automática até alguém definir o valor.
ALTER TABLE "membros"
  ADD COLUMN "valor_mensalidade" DECIMAL(10,2),
  ADD COLUMN "dia_vencimento" SMALLINT;

ALTER TABLE "membros"
  ADD CONSTRAINT "membros_dia_vencimento_check" CHECK ("dia_vencimento" BETWEEN 1 AND 31),
  ADD CONSTRAINT "membros_valor_mensalidade_check" CHECK ("valor_mensalidade" > 0);
