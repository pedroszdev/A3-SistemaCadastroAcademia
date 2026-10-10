// Convenção: um dia de calendário é representado pela meia-noite UTC daquele dia.
// É assim que o Prisma devolve colunas `@db.Date` e que `new Date('AAAA-MM-DD')` é
// interpretado. O "hoje" é o dia corrente no fuso da academia.

export const FUSO_ACADEMIA = 'America/Sao_Paulo';

const MS_POR_DIA = 86_400_000;

const formatoDia = new Intl.DateTimeFormat('en-CA', {
  timeZone: FUSO_ACADEMIA,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function hoje(agora: Date = new Date()): Date {
  return new Date(`${formatoDia.format(agora)}T00:00:00.000Z`);
}

export function inicioDoDia(data: Date): Date {
  return new Date(
    Date.UTC(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate()),
  );
}

/** Dias de `a` até `b`; positivo quando `b` é depois de `a`. */
export function diasEntre(a: Date, b: Date): number {
  return (inicioDoDia(b).getTime() - inicioDoDia(a).getTime()) / MS_POR_DIA;
}
