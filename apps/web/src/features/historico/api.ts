import { listarFuncionarios } from "@/features/funcionarios/api";
import { api, ApiError } from "@/lib/api";
import { CARGOS_FINANCEIRO } from "@/lib/menu";
import type { UsuarioDoToken } from "@/lib/sessao";
import type { Pagina } from "@/lib/use-lista-paginada";

export const TAMANHO_PAGINA = 20;

// Mesma string do assertMembroAdimplente (apps/api/src/pagamentos/pagamentos.service.ts).
export const MENSAGEM_INADIMPLENTE = "Membro com pagamento em atraso";

// Espelha ATIVIDADE_SELECT (apps/api/src/historico/historico.service.ts).
export type Atividade = {
  id: string;
  membroId: string;
  funcionarioId: string;
  treinoId: string | null;
  atividade: string;
  data: string;
  tempoExecucao: number;
  membro: { id: string; nome: string };
  funcionario: { id: string; nome: string };
  treino: { id: string; tipo: string } | null;
};

export type PaginaAtividades = Pagina<Atividade>;

export type FiltroAtividades = {
  membroId?: string;
  funcionarioId?: string;
  dataDe?: string;
  dataAte?: string;
  page: number;
};

export function listarAtividades(filtro: FiltroAtividades) {
  const params = new URLSearchParams();
  if (filtro.membroId) params.set("membroId", filtro.membroId);
  if (filtro.funcionarioId) params.set("funcionarioId", filtro.funcionarioId);
  if (filtro.dataDe) params.set("dataDe", filtro.dataDe);
  if (filtro.dataAte) params.set("dataAte", filtro.dataAte);
  params.set("page", String(filtro.page));
  params.set("pageSize", String(TAMANHO_PAGINA));
  return api<PaginaAtividades>(`/atividades?${params}`);
}

export type DadosRegistrarAtividade = {
  membroId: string;
  treinoId?: string;
  atividade: string;
  data: string;
  tempoExecucao: number;
};

export function registrarAtividade({ treinoId, ...dados }: DadosRegistrarAtividade) {
  return api<Atividade>("/atividades", {
    method: "POST",
    body: JSON.stringify(treinoId ? { ...dados, treinoId } : dados),
  });
}

export type TreinoDoMembro = { id: string; tipo: string; dataInicio: string };

// Rota da TRE-03 (Gabriel). Enquanto ela não existir, responde 404, que vale como "sem
// treinos": o formulário segue sem treino. Qualquer outro erro sobe para quem chamou.
export async function listarTreinosDoMembro(membroId: string): Promise<TreinoDoMembro[]> {
  let pagina: { data?: unknown };
  try {
    pagina = await api<{ data?: unknown }>(
      `/membros/${encodeURIComponent(membroId)}/treinos?page=1&pageSize=100`,
    );
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return [];
    throw e;
  }
  if (!Array.isArray(pagina?.data)) throw new Error("Resposta inesperada da lista de treinos");
  return pagina.data as TreinoDoMembro[];
}

export type SituacaoFinanceira = {
  situacao: "EM_DIA" | "INADIMPLENTE";
  pagamentosAtrasados: number;
  maiorAtrasoDias: number;
};

export function consultarSituacao(membroId: string) {
  return api<SituacaoFinanceira>(`/membros/${encodeURIComponent(membroId)}/situacao`);
}

// Maior pageSize que a API aceita (PaginationQueryDto).
const MAXIMO_POR_PAGINA = 100;

// Junta todas as páginas: o filtro não pode esconder quem passa dos 100 primeiros.
export async function listarFuncionariosParaFiltro(): Promise<{ id: string; nome: string }[]> {
  const primeira = await listarFuncionarios({ page: 1 }, MAXIMO_POR_PAGINA);
  const totalDePaginas = Math.ceil(primeira.total / MAXIMO_POR_PAGINA);
  const outras = await Promise.all(
    Array.from({ length: Math.max(0, totalDePaginas - 1) }, (_, i) =>
      listarFuncionarios({ page: i + 2 }, MAXIMO_POR_PAGINA),
    ),
  );
  return [primeira, ...outras].flatMap((pagina) =>
    pagina.data.map(({ id, nome }) => ({ id, nome })),
  );
}

// Espelha a matriz 4.2; quem barra de verdade é a API.
export function podeRegistrarAtividade(usuario: UsuarioDoToken): boolean {
  return (
    usuario.tipo === "FUNCIONARIO" && (usuario.cargo === "ADMIN" || usuario.cargo === "INSTRUTOR")
  );
}

export function podeFiltrarPorFuncionario(usuario: UsuarioDoToken): boolean {
  return usuario.tipo === "FUNCIONARIO" && usuario.cargo === "ADMIN";
}

export function podeConsultarSituacao(usuario: UsuarioDoToken): boolean {
  return usuario.tipo === "FUNCIONARIO" && CARGOS_FINANCEIRO.includes(usuario.cargo);
}
