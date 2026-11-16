// Formato AAAA-MM-DD do <input type="date"> e dos DTOs da API.
export const FORMATO_DATA = /^\d{4}-\d{2}-\d{2}$/;

// Minutos inteiros entre `minimo` e `maximo`, com as mensagens do @IsInt/@Min/@Max da API.
export function validarMinutos(
  campo: string,
  texto: string,
  minimo: number,
  maximo: number,
): string | undefined {
  const minutos = Number(texto);
  if (texto.trim() === "" || !Number.isInteger(minutos)) {
    return `${campo} deve ser um número inteiro de minutos`;
  }
  if (minutos < minimo) {
    return `${campo} deve ser no mínimo ${minimo} ${minimo === 1 ? "minuto" : "minutos"}`;
  }
  if (minutos > maximo) return `${campo} deve ser no máximo ${maximo} minutos`;
  return undefined;
}
