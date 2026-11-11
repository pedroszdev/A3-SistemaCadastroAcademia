export type ErrosPagamento = Partial<Record<"membro" | "valor" | "dataVencimento", string>>;

export const VALOR_MINIMO = 0.01;
export const VALOR_MAXIMO = 10000;
// Igual a DIAS_RETROATIVOS_MAX da API (apps/api/src/pagamentos/pagamento-status.ts).
export const DIAS_RETROATIVOS_MAX = 90;

const MS_POR_DIA = 86_400_000;

// O "hoje" da API é o dia corrente no fuso da academia (apps/api/src/common/utils/date.ts).
const FORMATO_DIA = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Sao_Paulo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

// Vencimento mais antigo que a API aceita, em AAAA-MM-DD.
export function vencimentoMinimo(agora: Date = new Date()): string {
  const hoje = new Date(`${FORMATO_DIA.format(agora)}T00:00:00.000Z`);
  return new Date(hoje.getTime() - DIAS_RETROATIVOS_MAX * MS_POR_DIA).toISOString().slice(0, 10);
}

type Valores = { membroId: string | null; valor: number; dataVencimento: string };

// Mensagens iguais às da API (create-pagamento.dto.ts) onde ela tem uma.
export function validarPagamento(valores: Valores, agora: Date = new Date()): ErrosPagamento {
  const erros: ErrosPagamento = {};
  if (!valores.membroId) erros.membro = "Selecione o membro";
  if (valores.valor < VALOR_MINIMO) erros.valor = "valor deve ser no mínimo 0,01";
  else if (valores.valor > VALOR_MAXIMO) erros.valor = "valor deve ser no máximo 10.000";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valores.dataVencimento)) {
    erros.dataVencimento = "Informe o vencimento";
  } else if (valores.dataVencimento < vencimentoMinimo(agora)) {
    erros.dataVencimento = `O vencimento não pode ter mais de ${DIAS_RETROATIVOS_MAX} dias no passado`;
  }
  return erros;
}
