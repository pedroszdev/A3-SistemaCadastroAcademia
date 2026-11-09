export type ErrosPagamento = Partial<Record<"membro" | "valor" | "dataVencimento", string>>;

export const VALOR_MINIMO = 0.01;
export const VALOR_MAXIMO = 10000;

type Valores = { membroId: string | null; valor: number; dataVencimento: string };

// Mensagens iguais às da API (create-pagamento.dto.ts) onde ela tem uma.
export function validarPagamento(valores: Valores): ErrosPagamento {
  const erros: ErrosPagamento = {};
  if (!valores.membroId) erros.membro = "Selecione o membro";
  if (valores.valor < VALOR_MINIMO) erros.valor = "valor deve ser no mínimo 0,01";
  else if (valores.valor > VALOR_MAXIMO) erros.valor = "valor deve ser no máximo 10.000";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valores.dataVencimento)) {
    erros.dataVencimento = "Informe o vencimento";
  }
  return erros;
}
