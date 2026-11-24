// Datas da mensalidade automática. Seguem a convenção de common/utils/date.ts: um
// dia de calendário é a meia-noite UTC daquele dia.

/** Dia `dia` do mês (0 = janeiro); nos meses curtos, o último dia do mês. */
export function vencimentoNoMes(ano: number, mes: number, dia: number): Date {
  const ultimoDia = new Date(Date.UTC(ano, mes + 1, 0)).getUTCDate();
  return new Date(Date.UTC(ano, mes, Math.min(dia, ultimoDia)));
}

/**
 * O primeiro vencimento a partir de `referencia` (inclusive): o deste mês se ainda
 * não passou, senão o do mês seguinte. Nunca devolve uma data já vencida.
 */
export function proximoVencimento(referencia: Date, dia: number): Date {
  const ano = referencia.getUTCFullYear();
  const mes = referencia.getUTCMonth();
  const desteMes = vencimentoNoMes(ano, mes, dia);
  return desteMes >= referencia ? desteMes : vencimentoNoMes(ano, mes + 1, dia);
}

/** [primeiro dia do mês da data, primeiro dia do mês seguinte). */
export function mesDe(data: Date): { inicio: Date; fim: Date } {
  const ano = data.getUTCFullYear();
  const mes = data.getUTCMonth();
  return {
    inicio: new Date(Date.UTC(ano, mes, 1)),
    fim: new Date(Date.UTC(ano, mes + 1, 1)),
  };
}
