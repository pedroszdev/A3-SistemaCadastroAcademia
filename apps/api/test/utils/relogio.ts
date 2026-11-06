import { hoje } from '../../src/common/utils/date';

/**
 * Roda `cenario` e, se ele falhar porque o dia de `hoje()` virou no meio
 * (meia-noite no fuso da academia), roda de novo, uma vez só.
 *
 * O teste calcula os vencimentos no começo e a API conta os dias de atraso na
 * hora da requisição. Nos casos de borda (exatamente DIAS_TOLERANCIA dias) a
 * virada do dia muda a resposta. O cenário precisa criar os próprios dados para
 * poder rodar de novo.
 */
export async function noMesmoDia<T>(
  cenario: () => Promise<T>,
  relogio: () => Date = hoje,
): Promise<T> {
  const inicio = relogio().getTime();
  try {
    return await cenario();
  } catch (erro) {
    if (relogio().getTime() === inicio) {
      throw erro;
    }
    return cenario();
  }
}
