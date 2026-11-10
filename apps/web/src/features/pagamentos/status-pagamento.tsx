import { StatusBadge } from "@/components/ui/status-badge";
import type { Pagamento } from "./api";

export const OPCOES_STATUS_PAGAMENTO = [
  { valor: "PENDENTE", rotulo: "Pendente" },
  { valor: "PAGO", rotulo: "Pago" },
  { valor: "ATRASADO", rotulo: "Atrasado" },
  { valor: "CANCELADO", rotulo: "Cancelado" },
];

export function rotuloAtraso(dias: number): string {
  return `Atrasado · ${dias} ${dias === 1 ? "dia" : "dias"}`;
}

export function BadgeStatusPagamento({
  pagamento,
}: {
  pagamento: Pick<Pagamento, "status" | "diasEmAtraso">;
}) {
  return (
    <StatusBadge
      status={pagamento.status}
      rotulo={pagamento.status === "ATRASADO" ? rotuloAtraso(pagamento.diasEmAtraso) : undefined}
    />
  );
}
