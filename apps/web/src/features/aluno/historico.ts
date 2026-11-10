import { api } from "@/lib/api";
import type { Intervalo } from "./periodo";

export const TAMANHO_PAGINA = 20;

// Espelha ATIVIDADE_DO_ALUNO_SELECT (apps/api/src/historico/historico.service.ts).
export type AtividadeDoAluno = {
  id: string;
  treinoId: string | null;
  atividade: string;
  data: string;
  tempoExecucao: number;
  funcionario: { nome: string } | null;
  treino: { id: string; tipo: string } | null;
};

export type PaginaAtividades = {
  data: AtividadeDoAluno[];
  total: number;
  page: number;
  pageSize: number;
};

export type ResumoDoPeriodo = { totalAtividades: number; totalMinutos: number };

export function buscarResumoDoPeriodo(intervalo: Intervalo) {
  return api<ResumoDoPeriodo>(`/me/atividades/resumo?${new URLSearchParams(intervalo)}`);
}

export function listarMinhasAtividades(intervalo: Intervalo, page: number) {
  const params = new URLSearchParams(intervalo);
  params.set("page", String(page));
  params.set("pageSize", String(TAMANHO_PAGINA));
  return api<PaginaAtividades>(`/me/atividades?${params}`);
}
