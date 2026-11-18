import type { Treino } from "@/features/treinos/api";
import type { SituacaoFinanceira } from "@/features/historico/api";
import { api } from "@/lib/api";
import { type Pagina, TAMANHO_PAGINA } from "@/lib/use-lista-paginada";

export type Membro = {
  id: string;
  nome: string;
  cpf: string;
  telefone: string;
  endereco: string;
  ativo: boolean;
  dataCadastro: string;
  acessoLiberado: boolean;
};

export type PaginaMembros = Pagina<Membro>;

export type FiltroMembros = { busca?: string; ativo?: boolean; page: number };

export function listarMembros(filtro: FiltroMembros) {
  const params = new URLSearchParams();
  if (filtro.busca) params.set("busca", filtro.busca);
  if (filtro.ativo !== undefined) params.set("ativo", String(filtro.ativo));
  params.set("page", String(filtro.page));
  params.set("pageSize", String(TAMANHO_PAGINA));
  return api<PaginaMembros>(`/membros?${params}`);
}

export type DadosCriarMembro = {
  nome: string;
  cpf: string;
  telefone: string;
  endereco: string;
};

export type DadosAtualizarMembro = Omit<DadosCriarMembro, "cpf">;

export function buscarMembro(id: string) {
  return api<Membro>(`/membros/${encodeURIComponent(id)}`);
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

// A situação financeira (RN09) tem a mesma forma do GET /membros/:id/situacao do histórico.
export type { SituacaoFinanceira };

// Espelha MembrosResumoService.resumo. Só ADMIN e RECEPCIONISTA consultam (403 para o INSTRUTOR).
export type ResumoMembro = {
  membro: Membro;
  situacaoFinanceira: SituacaoFinanceira;
  treinoMaisRecente: Treino | null;
  atividadesUltimos30Dias: number;
};

export function consultarResumo(id: string) {
  return api<ResumoMembro>(`/membros/${encodeURIComponent(id)}/resumo`);
}

// A API não lê corpo nas duas rotas (RN03: membro não é excluído).
export function desativarMembro(id: string) {
  return api<Membro>(`/membros/${encodeURIComponent(id)}/desativar`, { method: "PATCH" });
}

export function reativarMembro(id: string) {
  return api<Membro>(`/membros/${encodeURIComponent(id)}/reativar`, { method: "PATCH" });
}
