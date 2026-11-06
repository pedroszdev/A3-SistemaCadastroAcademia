const STATUS = {
  PENDENTE: { texto: "Pendente", cor: "bg-yellow-100 text-yellow-800" },
  PAGO: { texto: "Pago", cor: "bg-green-100 text-green-800" },
  ATRASADO: { texto: "Atrasado", cor: "bg-red-100 text-red-800" },
  CANCELADO: { texto: "Cancelado", cor: "bg-zinc-100 text-zinc-700" },
  ATIVO: { texto: "Ativo", cor: "bg-green-100 text-green-800" },
  INATIVO: { texto: "Inativo", cor: "bg-zinc-100 text-zinc-700" },
};

type StatusBadgeProps = {
  status: keyof typeof STATUS;
  rotulo?: string;
};

export function StatusBadge({ status, rotulo }: StatusBadgeProps) {
  const { texto, cor } = STATUS[status];

  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${cor}`}
    >
      {rotulo ?? texto}
    </span>
  );
}
