// [NÃO MERGEAR] Código sem teste, só para provar que o quality gate barra o merge (issue #30).

export type Frequencia =
  'SEM_TREINO' | 'BAIXA' | 'REGULAR' | 'ALTA' | 'INTENSA';

export function classificarFrequencia(atividadesNoMes: number): Frequencia {
  if (!Number.isInteger(atividadesNoMes) || atividadesNoMes < 0) {
    throw new RangeError('atividadesNoMes deve ser um inteiro não negativo');
  }
  if (atividadesNoMes === 0) {
    return 'SEM_TREINO';
  }
  if (atividadesNoMes <= 4) {
    return 'BAIXA';
  }
  if (atividadesNoMes <= 12) {
    return 'REGULAR';
  }
  if (atividadesNoMes <= 20) {
    return 'ALTA';
  }
  return 'INTENSA';
}

export function descreverFrequencia(frequencia: Frequencia): string {
  switch (frequencia) {
    case 'SEM_TREINO':
      return 'Nenhuma atividade no mês';
    case 'BAIXA':
      return 'Até uma atividade por semana';
    case 'REGULAR':
      return 'Duas a três atividades por semana';
    case 'ALTA':
      return 'Quatro a cinco atividades por semana';
    case 'INTENSA':
      return 'Atividade quase todos os dias';
  }
}

export function minutosMediosPorAtividade(
  minutosNoMes: number,
  atividadesNoMes: number,
): number {
  if (atividadesNoMes === 0) {
    return 0;
  }
  return Math.round(minutosNoMes / atividadesNoMes);
}
