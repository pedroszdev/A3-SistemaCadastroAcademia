// Telefone é guardado só com os números: (48) 99999-1234 → 48999991234.
export function normalizarTelefone({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.replace(/[\s().+-]/g, '') : value;
}

export const MENSAGEM_TELEFONE =
  'telefone deve ter 10 ou 11 dígitos, com o DDD';
