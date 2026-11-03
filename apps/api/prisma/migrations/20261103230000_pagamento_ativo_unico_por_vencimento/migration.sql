-- Uma cobrança não cancelada por membro em cada vencimento. Parcial para que uma
-- cobrança cancelada possa ser recriada na mesma data. Escrito à mão porque o
-- schema.prisma não representa índice parcial.
CREATE UNIQUE INDEX "pagamentos_membro_vencimento_ativo_key"
  ON "pagamentos" ("membro_id", "data_vencimento")
  WHERE "status" <> 'CANCELADO';
