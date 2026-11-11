import { api } from "@/lib/api";
import { CARGOS_FINANCEIRO } from "@/lib/menu";
import type { UsuarioDoToken } from "@/lib/sessao";
import type { Pagina } from "@/lib/use-lista-paginada";

export const TAMANHO_PAGINA = 20;
export const TAMANHO_BUSCA_MEMBROS = 10;

export type StatusPagamento = "PENDENTE" | "PAGO" | "ATRASADO" | "CANCELADO";

export type Pagamento = {
  id: string;
  membroId: string;
  valor: number;
  dataVencimento: string;
  dataPagamento: string | null;
  status: StatusPagamento;
  diasEmAtraso: number;
  membro: { id: string; nome: string };
};

export type PaginaPagamentos = Pagina<Pagamento>;

export type FiltroPagamentos = {
  status?: StatusPagamento;
  vencimentoDe?: string;
  vencimentoAte?: string;
  membroId?: string;
  page: number;
};

export function listarPagamentos(filtro: FiltroPagamentos) {
  const params = new URLSearchParams();
  if (filtro.membroId) params.set("membroId", filtro.membroId);
  if (filtro.status) params.set("status", filtro.status);
  if (filtro.vencimentoDe) params.set("vencimentoDe", filtro.vencimentoDe);
  if (filtro.vencimentoAte) params.set("vencimentoAte", filtro.vencimentoAte);
  params.set("page", String(filtro.page));
  params.set("pageSize", String(TAMANHO_PAGINA));
  return api<PaginaPagamentos>(`/pagamentos?${params}`);
}

export type DadosCriarPagamento = {
  membroId: string;
  valor: number;
  dataVencimento: string;
};

export function criarPagamento(dados: DadosCriarPagamento) {
  return api<Pagamento>("/pagamentos", {
    method: "POST",
    body: JSON.stringify(dados),
  });
}

export type MembroBusca = { id: string; nome: string; cpf: string };

// `total` conta todos os que batem com a busca, não só os `membros` devolvidos.
export type ResultadoBuscaMembros = { membros: MembroBusca[]; total: number };

// Sem opções, lista só os ativos (RN04). O termo já chega sem espaços nas pontas (BuscaMembro).
export async function buscarMembros(
  busca: string,
  opcoes: { incluirInativos?: boolean } = {},
): Promise<ResultadoBuscaMembros> {
  const params = new URLSearchParams({ busca });
  if (!opcoes.incluirInativos) params.set("ativo", "true");
  params.set("page", "1");
  params.set("pageSize", String(TAMANHO_BUSCA_MEMBROS));
  const pagina = await api<{ data: MembroBusca[]; total: number }>(`/membros?${params}`);
  return {
    membros: pagina.data.map(({ id, nome, cpf }) => ({ id, nome, cpf })),
    total: pagina.total,
  };
}

export function registrarPagamento(id: string, dataPagamento?: string) {
  return api<Pagamento>(`/pagamentos/${encodeURIComponent(id)}/pagar`, {
    method: "PATCH",
    body: JSON.stringify(dataPagamento ? { dataPagamento } : {}),
  });
}

export function cancelarPagamento(id: string) {
  return api<Pagamento>(`/pagamentos/${encodeURIComponent(id)}/cancelar`, {
    method: "PATCH",
  });
}

// Espelha a matriz 4.2; quem barra de verdade é a API.
export function podeGerirPagamentos(usuario: UsuarioDoToken): boolean {
  return usuario.tipo === "FUNCIONARIO" && CARGOS_FINANCEIRO.includes(usuario.cargo);
}

// RN07/RN08: só o pagamento PENDENTE no banco (PENDENTE ou ATRASADO na tela) pode ser pago ou cancelado.
export function estaEmAberto(pagamento: Pagamento): boolean {
  return pagamento.status === "PENDENTE" || pagamento.status === "ATRASADO";
}
