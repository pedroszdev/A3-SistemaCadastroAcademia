import { apenasDigitos, formatarMoeda } from "@/lib/format";

// Até 99.999,99: deixa digitar acima do máximo de 10.000 para a validação mostrar a mensagem.
const MAX_DIGITOS = 7;

export function mascaraMoeda(texto: string): string {
  const digitos = apenasDigitos(texto).replace(/^0+/, "").slice(0, MAX_DIGITOS);
  return digitos ? formatarMoeda(Number(digitos) / 100) : "";
}

// Texto colado vem com as casas decimais escritas ("150", "1.234,5", "R$ 89,90", "150.5"),
// então não pode ser lido como centavos, como na digitação.
export function mascaraMoedaColada(texto: string): string {
  const limpo = texto.replaceAll(/[^\d.,]/g, "");
  let inteiro = limpo;
  let decimais = "";
  const virgula = limpo.lastIndexOf(",");
  const ponto = limpo.lastIndexOf(".");
  if (virgula >= 0) {
    inteiro = limpo.slice(0, virgula);
    decimais = limpo.slice(virgula + 1);
  } else if (ponto >= 0 && limpo.length - ponto - 1 <= 2) {
    // "150.5" ou "150.50": ponto decimal. "1.234" é separador de milhar.
    inteiro = limpo.slice(0, ponto);
    decimais = limpo.slice(ponto + 1);
  }
  const centavos =
    Number(apenasDigitos(inteiro) || "0") * 100 +
    Number(apenasDigitos(decimais).padEnd(2, "0").slice(0, 2));
  return centavos > 0 ? formatarMoeda(centavos / 100) : "";
}

// Centavos inteiros divididos por 100: nunca passa de 2 casas decimais.
export function valorDaMascara(texto: string): number {
  return Number(apenasDigitos(texto) || "0") / 100;
}
