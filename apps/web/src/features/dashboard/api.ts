import { api } from "@/lib/api";

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
