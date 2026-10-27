// RN01: o CPF é guardado só com os números e precisa ter os dois dígitos
// verificadores corretos. Sequências repetidas (`111.111.111-11`) passam no
// cálculo, mas não são CPFs válidos.

const ONZE_DIGITOS = /^\d{11}$/;
const TODOS_IGUAIS = /^(\d)\1{10}$/;

export function normalizarCpf(valor: string): string {
  return valor.trim().replace(/[.-]/g, '');
}

/** Pesos decrescentes até 2; resto 10 vira 0. */
function digitoVerificador(digitos: string): number {
  const soma = [...digitos].reduce(
    (total, digito, i) => total + Number(digito) * (digitos.length + 1 - i),
    0,
  );
  const resto = (soma * 10) % 11;
  return resto === 10 ? 0 : resto;
}

export function isCpfValido(valor: unknown): boolean {
  if (typeof valor !== 'string') {
    return false;
  }
  const cpf = normalizarCpf(valor);
  if (!ONZE_DIGITOS.test(cpf) || TODOS_IGUAIS.test(cpf)) {
    return false;
  }
  const primeiro = digitoVerificador(cpf.slice(0, 9));
  const segundo = digitoVerificador(cpf.slice(0, 10));
  return cpf.endsWith(`${primeiro}${segundo}`);
}
