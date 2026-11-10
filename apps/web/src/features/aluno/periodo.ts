export type Periodo = "7dias" | "30dias" | "mes";

export const PERIODOS: readonly { valor: Periodo; rotulo: string }[] = [
  { valor: "7dias", rotulo: "7 dias" },
  { valor: "30dias", rotulo: "30 dias" },
  { valor: "mes", rotulo: "Mês atual" },
];

export const PERIODO_PADRAO: Periodo = "30dias";

// Datas de calendário no formato AAAA-MM-DD, como a API espera em dataDe/dataAte.
export type Intervalo = { dataDe: string; dataAte: string };

const FUSO_ACADEMIA = "America/Sao_Paulo";

// Espelha o "hoje" da API (apps/api/src/common/utils/date.ts); o en-CA formata como AAAA-MM-DD.
const formatoDia = new Intl.DateTimeFormat("en-CA", {
  timeZone: FUSO_ACADEMIA,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function intervaloDoPeriodo(
  periodo: Periodo,
  agora: Date = new Date(),
): Intervalo {
  const hoje = formatoDia.format(agora);
  if (periodo === "mes") return { dataDe: `${hoje.slice(0, 8)}01`, dataAte: hoje };

  const inicio = new Date(`${hoje}T00:00:00.000Z`);
  inicio.setUTCDate(inicio.getUTCDate() - (periodo === "7dias" ? 6 : 29));
  return { dataDe: inicio.toISOString().slice(0, 10), dataAte: hoje };
}
