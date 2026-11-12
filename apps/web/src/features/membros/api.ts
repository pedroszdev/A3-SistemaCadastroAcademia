import { api } from "@/lib/api";
import type { UsuarioDoToken } from "@/lib/sessao";
import type { Pagina } from "@/lib/use-lista-paginada";

export const TAMANHO_PAGINA = 20;

// Espelha MEMBRO_SELECT (apps/api/src/membros/membros.service.ts). O `acessoLiberado` só vem
// no GET /membros/:id e no resumo (contrato MEM-06), não na lista.
export type Membro = {
  id: string;
  nome: string;
  cpf: string;
  telefone: string;
  endereco: string;
  ativo: boolean;
  dataCadastro: string;
  acessoLiberado?: boolean;
};

export type PaginaMembros = Pagina<Membro>;

export type FiltroMembros = { busca?: string; ativo?: boolean; page: number };

export type DadosCriarMembro = {
  nome: string;
  cpf: string;
  telefone: string;
  endereco: string;
};

// RN02: o CPF não muda depois do cadastro, e a API responde 400 se ele vier no body.
export type DadosAtualizarMembro = Omit<DadosCriarMembro, "cpf">;

export function listarMembros(filtro: FiltroMembros) {
  const params = new URLSearchParams();
  if (filtro.busca) params.set("busca", filtro.busca);
  if (filtro.ativo !== undefined) params.set("ativo", String(filtro.ativo));
  params.set("page", String(filtro.page));
  params.set("pageSize", String(TAMANHO_PAGINA));
  return api<PaginaMembros>(`/membros?${params}`);
}

export function criarMembro(dados: DadosCriarMembro) {
  return api<Membro>("/membros", {
    method: "POST",
    body: JSON.stringify(dados),
  });
}

export function atualizarMembro(id: string, dados: DadosAtualizarMembro) {
  return api<Membro>(`/membros/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(dados),
  });
}

export function desativarMembro(id: string) {
  return api<Membro>(`/membros/${encodeURIComponent(id)}/desativar`, {
    method: "PATCH",
  });
}

export function reativarMembro(id: string) {
  return api<Membro>(`/membros/${encodeURIComponent(id)}/reativar`, {
    method: "PATCH",
  });
}

export type SituacaoFinanceira = {
  situacao: "EM_DIA" | "INADIMPLENTE";
  pagamentosAtrasados: number;
  maiorAtrasoDias: number;
};

export type TreinoResumo = {
  id: string;
  tipo: string;
  descricao: string;
  duracao: number;
  dataInicio: string;
};

// GET /membros/:id/resumo (MEM-06). `situacaoFinanceira` é null para o INSTRUTOR (matriz 4.2).
export type ResumoMembro = {
  membro: Membro;
  situacaoFinanceira: SituacaoFinanceira | null;
  treinoMaisRecente: TreinoResumo | null;
  atividadesUltimos30Dias: number;
};

export function consultarResumo(id: string) {
  return api<ResumoMembro>(`/membros/${encodeURIComponent(id)}/resumo`);
}

// Espelha TREINO_SELECT (apps/api/src/treinos/treinos.service.ts).
export type TreinoDoMembro = TreinoResumo & { membroId: string };

export type FiltroTreinosDoMembro = { page: number };

export function listarTreinosDoMembro(membroId: string, filtro: FiltroTreinosDoMembro) {
  const params = new URLSearchParams({
    page: String(filtro.page),
    pageSize: String(TAMANHO_PAGINA),
  });
  return api<Pagina<TreinoDoMembro>>(`/membros/${encodeURIComponent(membroId)}/treinos?${params}`);
}

// Matriz 4.2: todos os funcionários consultam; só ADMIN e RECEPCIONISTA cadastram, editam,
// desativam e reativam. Quem barra de verdade é a API.
export function podeGerirMembros(usuario: UsuarioDoToken): boolean {
  return (
    usuario.tipo === "FUNCIONARIO" &&
    (usuario.cargo === "ADMIN" || usuario.cargo === "RECEPCIONISTA")
  );
}
