// RN07: no banco ficam só PENDENTE, PAGO e CANCELADO; o ATRASADO é calculado na
// resposta a partir do vencimento e da data de referência (por padrão, hoje).
import { diasEntre, hoje } from '../common/utils/date';
import type { StatusPagamento } from '../generated/prisma/enums';

export type StatusCalculado = 'PENDENTE' | 'PAGO' | 'ATRASADO' | 'CANCELADO';

export interface PagamentoParaStatus {
  status: StatusPagamento;
  dataVencimento: Date;
  dataPagamento: Date | null;
}

export function calcularStatus(
  pagamento: PagamentoParaStatus,
  referencia: Date = hoje(),
): StatusCalculado {
  if (pagamento.status === 'CANCELADO') {
    return 'CANCELADO';
  }
  if (pagamento.dataPagamento !== null) {
    return 'PAGO';
  }
  if (diasEntre(pagamento.dataVencimento, referencia) > 0) {
    return 'ATRASADO';
  }
  return 'PENDENTE';
}

export function diasEmAtraso(
  pagamento: PagamentoParaStatus,
  referencia: Date = hoje(),
): number {
  if (calcularStatus(pagamento, referencia) !== 'ATRASADO') {
    return 0;
  }
  return diasEntre(pagamento.dataVencimento, referencia);
}
