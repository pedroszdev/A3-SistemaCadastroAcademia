import { api } from "@/lib/api";
import type { Pagina } from "@/lib/use-lista-paginada";

export const TAMANHO_PAGINA = 20;

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
