import type { Pagamento, StatusPagamento } from "@/features/pagamentos/api";
import { api } from "@/lib/api";
import { type Pagina, TAMANHO_PAGINA } from "@/lib/use-lista-paginada";

// Espelha GET /me/pagamentos/resumo (PagamentosService.resumoDoAluno).
export type ResumoDosPagamentos = {
  situacao: "EM_DIA" | "INADIMPLENTE";
  pagamentosAtrasados: number;
  maiorAtrasoDias: number;
  proximoPagamento: Pagamento | null;
  valorMensalidade: number | null;
  diaVencimento: number | null;
};

export function buscarResumoDosPagamentos() {
  return api<ResumoDosPagamentos>("/me/pagamentos/resumo");
}

// RN16: o membroId nunca vai na query; a API o tira do token.
export function listarMeusPagamentos(status: StatusPagamento | undefined, page: number) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  params.set("page", String(page));
  params.set("pageSize", String(TAMANHO_PAGINA));
  return api<Pagina<Pagamento>>(`/me/pagamentos?${params}`);
}
