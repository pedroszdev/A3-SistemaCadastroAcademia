import { api } from "@/lib/api";
import { CARGOS_FINANCEIRO } from "@/lib/menu";
import type { UsuarioDoToken } from "@/lib/sessao";

export type ResumoDashboard = {
  membrosAtivos: number;
  membrosInadimplentes: number;
  pagamentosAtrasados: number;
  receitaMes: number;
  atividadesHoje: number;
};

export type MembroInadimplente = {
  id: string;
  nome: string;
  maiorAtrasoDias: number;
};

export function buscarResumo(): Promise<ResumoDashboard> {
  return api<ResumoDashboard>("/dashboard");
}

export function buscarInadimplentes(): Promise<MembroInadimplente[]> {
  return api<MembroInadimplente[]>("/dashboard/inadimplentes");
}

// Espelha a matriz 4.2 (situação financeira); quem barra de verdade é a API.
export function podeVerInadimplentes(usuario: UsuarioDoToken): boolean {
  return usuario.tipo === "FUNCIONARIO" && CARGOS_FINANCEIRO.includes(usuario.cargo);
}
