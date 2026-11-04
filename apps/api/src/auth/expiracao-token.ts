// Variável de ambiente chega sempre como texto, e o jsonwebtoken lê texto sem
// unidade como milissegundos ("28800" viraria 28 s). Por isso o valor vira
// segundos aqui, e um valor inválido impede a API de subir.
const SEGUNDOS_POR_UNIDADE = {
  s: 1,
  m: 60,
  h: 60 * 60,
  d: 24 * 60 * 60,
} as const;
const FORMATO = /^([1-9]\d*)([smhd])?$/;

export const EXPIRACAO_PADRAO = '8h';

export function expiracaoEmSegundos(valor: string): number {
  const partes = FORMATO.exec(valor.trim());
  if (!partes) {
    throw new Error(
      `JWT_EXPIRES_IN inválido: "${valor}". Use segundos (28800) ou um número com unidade s, m, h ou d (8h)`,
    );
  }

  const [, quantidade, unidade] = partes;
  const unidadeValida = unidade as
    keyof typeof SEGUNDOS_POR_UNIDADE | undefined;
  return (
    Number(quantidade) *
    (unidadeValida ? SEGUNDOS_POR_UNIDADE[unidadeValida] : 1)
  );
}
