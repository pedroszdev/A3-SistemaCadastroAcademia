import type { ReactNode } from "react";

export const TONS_BADGE = {
  sucesso: "bg-sucesso-fundo text-sucesso",
  alerta: "bg-alerta-fundo text-alerta",
  info: "bg-info-fundo text-info",
  neutro: "bg-neutro-fundo text-neutro",
  lima: "bg-lima-fundo text-lima-texto",
  roxo: "bg-roxo-fundo text-roxo",
  escuro: "bg-tinta text-white",
};

export type TomBadge = keyof typeof TONS_BADGE;

export function Badge({ tom, children }: { tom: TomBadge; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-[3px] text-xs font-semibold ${TONS_BADGE[tom]}`}
    >
      {children}
    </span>
  );
}

const STATUS = {
  PENDENTE: { texto: "Pendente", tom: "info" },
  PAGO: { texto: "Pago", tom: "sucesso" },
  ATRASADO: { texto: "Atrasado", tom: "alerta" },
  CANCELADO: { texto: "Cancelado", tom: "neutro" },
  ATIVO: { texto: "Ativo", tom: "sucesso" },
  INATIVO: { texto: "Inativo", tom: "neutro" },
} satisfies Record<string, { texto: string; tom: TomBadge }>;

type StatusBadgeProps = {
  status: keyof typeof STATUS;
  rotulo?: string;
};

export function StatusBadge({ status, rotulo }: StatusBadgeProps) {
  const { texto, tom } = STATUS[status];

  return <Badge tom={tom}>{rotulo ?? texto}</Badge>;
}
