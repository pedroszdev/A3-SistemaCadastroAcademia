const MOEDA = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

// A API grava datas de calendário como meia-noite UTC (apps/api/src/common/utils/date.ts).
const DATA = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "UTC",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function apenasDigitos(valor: string): string {
  return valor.replaceAll(/\D/g, "");
}

export function formatarMoeda(valor: number): string {
  return MOEDA.format(valor);
}

const DIA_EM_SAO_PAULO = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Sao_Paulo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

// Mesmo "hoje" da API (fuso da academia), em AAAA-MM-DD. Quem chama lê o relógio fora do
// render (regra react-hooks/purity), por isso o parâmetro.
export function hojeEmSaoPaulo(agora: Date = new Date()): string {
  return DIA_EM_SAO_PAULO.format(agora);
}

export function formatarData(valor: string | Date): string {
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? "" : DATA.format(data);
}

export function mascaraCpf(valor: string): string {
  const d = apenasDigitos(valor).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export function mascaraTelefone(valor: string): string {
  const d = apenasDigitos(valor).slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  const ddd = d.slice(0, 2);
  const resto = d.slice(2);
  if (resto.length <= 4) return `(${ddd}) ${resto}`;
  if (d.length <= 10) return `(${ddd}) ${resto.slice(0, 4)}-${resto.slice(4)}`;
  return `(${ddd}) ${resto.slice(0, 5)}-${resto.slice(5)}`;
}
