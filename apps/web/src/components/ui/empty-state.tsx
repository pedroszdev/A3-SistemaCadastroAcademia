import type { ReactNode } from "react";

type EmptyStateProps = {
  titulo: string;
  descricao?: string;
  acao?: ReactNode;
};

export function EmptyState({ titulo, descricao, acao }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center">
      <p className="text-base font-medium text-zinc-900">{titulo}</p>
      {descricao && <p className="text-sm text-zinc-600">{descricao}</p>}
      {acao}
    </div>
  );
}
