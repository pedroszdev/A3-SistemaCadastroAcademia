import { api } from "@/lib/api";
import type { Cargo } from "@/lib/sessao";
import type { Pagina } from "@/lib/use-lista-paginada";

export const TAMANHO_PAGINA = 20;

export type Funcionario = {
  id: string;
  nome: string;
  login: string;
  cargo: Cargo;
  ativo: boolean;
};

export type PaginaFuncionarios = Pagina<Funcionario>;

export type FiltroFuncionarios = { cargo?: Cargo; ativo?: boolean; page: number };

export type DadosCriarFuncionario = {
  nome: string;
  login: string;
  cargo: Cargo;
  senha: string;
};

export type DadosAtualizarFuncionario = {
  nome: string;
  cargo: Cargo;
  senha?: string;
};

export function listarFuncionarios(filtro: FiltroFuncionarios, pageSize = TAMANHO_PAGINA) {
  const params = new URLSearchParams();
  if (filtro.cargo) params.set("cargo", filtro.cargo);
  if (filtro.ativo !== undefined) params.set("ativo", String(filtro.ativo));
  params.set("page", String(filtro.page));
  params.set("pageSize", String(pageSize));
  return api<PaginaFuncionarios>(`/funcionarios?${params}`);
}

export function criarFuncionario(dados: DadosCriarFuncionario) {
  return api<Funcionario>("/funcionarios", {
    method: "POST",
    body: JSON.stringify(dados),
  });
}

export function atualizarFuncionario(id: string, dados: DadosAtualizarFuncionario) {
  return api<Funcionario>(`/funcionarios/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(dados),
  });
}

export function desativarFuncionario(id: string) {
  return api<Funcionario>(`/funcionarios/${encodeURIComponent(id)}/desativar`, {
    method: "PATCH",
  });
}

export function reativarFuncionario(id: string) {
  return api<Funcionario>(`/funcionarios/${encodeURIComponent(id)}/reativar`, {
    method: "PATCH",
  });
}
