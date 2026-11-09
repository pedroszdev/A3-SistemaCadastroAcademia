import { apenasDigitos, formatarMoeda } from "@/lib/format";

// Até 99.999,99: deixa digitar acima do máximo de 10.000 para a validação mostrar a mensagem.
const MAX_DIGITOS = 7;

export function mascaraMoeda(texto: string): string {
  const digitos = apenasDigitos(texto).replace(/^0+/, "").slice(0, MAX_DIGITOS);
  return digitos ? formatarMoeda(Number(digitos) / 100) : "";
}

// Centavos inteiros divididos por 100: nunca passa de 2 casas decimais.
export function valorDaMascara(texto: string): number {
  return Number(apenasDigitos(texto) || "0") / 100;
}
