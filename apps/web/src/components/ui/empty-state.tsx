import type { ReactNode } from "react";

type EmptyStateProps = {
  titulo: string;
  descricao?: string;
  acao?: ReactNode;
};

export function EmptyState({ titulo, descricao, acao }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
      <p className="font-display text-base font-semibold text-tinta">{titulo}</p>
      {descricao && <p className="max-w-md text-sm text-suave">{descricao}</p>}
      {acao}
    </div>
  );
}
