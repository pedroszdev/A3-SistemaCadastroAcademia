import { api } from "@/lib/api";
import { type Pagina, TAMANHO_PAGINA } from "@/lib/use-lista-paginada";
import type { Treino } from "@/features/treinos/api";

// Espelha TREINO_DO_ALUNO_SELECT (apps/api/src/treinos/treinos.service.ts).
export type TreinoDoAluno = Omit<Treino, "membroId" | "membro">;

export type PaginaTreinosDoAluno = Pagina<TreinoDoAluno>;

export function listarMeusTreinos(tipo: TreinoDoAluno["tipo"] | undefined, page: number) {
  const params = new URLSearchParams();
  if (tipo) params.set("tipo", tipo);
  params.set("page", String(page));
  params.set("pageSize", String(TAMANHO_PAGINA));
  // RN16: o membroId nunca vai na query; a API o tira do token e responde 400 se vier.
  return api<PaginaTreinosDoAluno>(`/me/treinos?${params}`);
}
