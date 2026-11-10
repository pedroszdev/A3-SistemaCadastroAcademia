import { api } from "@/lib/api";
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

// Rota da TRE-03 (Gabriel): enquanto ela não existir a chamada falha e o formulário segue sem treino.
export async function listarTreinosDoMembro(membroId: string): Promise<TreinoDoMembro[]> {
  const pagina = await api<{ data: TreinoDoMembro[] }>(
    `/membros/${encodeURIComponent(membroId)}/treinos?page=1&pageSize=100`,
  );
  return pagina.data;
}

export type SituacaoFinanceira = {
  situacao: "EM_DIA" | "INADIMPLENTE";
  pagamentosAtrasados: number;
  maiorAtrasoDias: number;
};

export function consultarSituacao(membroId: string) {
  return api<SituacaoFinanceira>(`/membros/${encodeURIComponent(membroId)}/situacao`);
}

// Não reaproveita listarFuncionarios (features/funcionarios/api.ts), que fixa pageSize=20.
export async function listarFuncionariosParaFiltro(): Promise<{ id: string; nome: string }[]> {
  const pagina = await api<{ data: { id: string; nome: string }[] }>(
    "/funcionarios?page=1&pageSize=100",
  );
  return pagina.data.map(({ id, nome }) => ({ id, nome }));
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
