import { api } from "@/lib/api";
import { CARGOS_INSTRUCAO, temCargo } from "@/lib/menu";
import type { UsuarioDoToken } from "@/lib/sessao";
import { type Pagina, TAMANHO_PAGINA } from "@/lib/use-lista-paginada";
import type { TipoTreino } from "./tipos";

// Espelha TREINO_SELECT (apps/api/src/treinos/treinos.service.ts).
export type Treino = {
  id: string;
  membroId: string;
  tipo: TipoTreino;
  descricao: string;
  duracao: number;
  dataInicio: string;
  membro: { id: string; nome: string };
};

export type PaginaTreinos = Pagina<Treino>;

export type FiltroTreinos = {
  tipo?: TipoTreino;
  membroId?: string;
  page: number;
};

export function listarTreinos(filtro: FiltroTreinos) {
  const params = new URLSearchParams();
  if (filtro.membroId) params.set("membroId", filtro.membroId);
  if (filtro.tipo) params.set("tipo", filtro.tipo);
  params.set("page", String(filtro.page));
  params.set("pageSize", String(TAMANHO_PAGINA));
  return api<PaginaTreinos>(`/treinos?${params}`);
}

export type DadosCriarTreino = {
  membroId: string;
  tipo: TipoTreino;
  descricao: string;
  duracao: number;
  dataInicio: string;
};

export function criarTreino(dados: DadosCriarTreino) {
  return api<Treino>("/treinos", {
    method: "POST",
    body: JSON.stringify(dados),
  });
}

// O treino não troca de membro: a API recusa membroId no PATCH (400).
export type DadosAtualizarTreino = Omit<DadosCriarTreino, "membroId">;

export function atualizarTreino(id: string, dados: DadosAtualizarTreino) {
  return api<Treino>(`/treinos/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(dados),
  });
}

// A API responde 204, sem corpo.
export function excluirTreino(id: string) {
  return api<void>(`/treinos/${encodeURIComponent(id)}`, { method: "DELETE" });
}

// Espelha a matriz 4.2: todos os funcionários consultam, só ADMIN e INSTRUTOR criam, editam
// e excluem. Quem barra de verdade é a API.
export function podeEditarTreino(usuario: UsuarioDoToken): boolean {
  return temCargo(usuario, CARGOS_INSTRUCAO);
}
