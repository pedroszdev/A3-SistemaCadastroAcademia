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

// Mesma contagem do isLength do validator, que o Length e o MinLength da API usam:
// um emoji (par surrogate) vale 1, não 2, e o seletor de variação (o ️ de "❤️")
// não conta.
export function tamanho(texto: string): number {
  const pares = texto.match(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g)?.length ?? 0;
  const variacoes = texto.match(/[^️︎][️︎]/g)?.length ?? 0;
  return texto.length - pares - variacoes;
}

export function formatarMoeda(valor: number): string {
  return MOEDA.format(valor);
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

// Não corta em 11 dígitos: um número colado com o +55 ficaria com outros dígitos
// e passaria na validação. Assim, os dígitos a mais aparecem e a validação recusa.
export function mascaraTelefone(valor: string): string {
  const d = apenasDigitos(valor);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  const ddd = d.slice(0, 2);
  const resto = d.slice(2);
  if (resto.length <= 4) return `(${ddd}) ${resto}`;
  if (d.length <= 10) return `(${ddd}) ${resto.slice(0, 4)}-${resto.slice(4)}`;
  return `(${ddd}) ${resto.slice(0, 5)}-${resto.slice(5)}`;
}
