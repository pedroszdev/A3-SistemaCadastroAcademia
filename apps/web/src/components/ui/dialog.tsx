"use client";

import { type ReactNode, useEffect, useId } from "react";

type DialogProps = {
  aberto: boolean;
  titulo: string;
  onFechar: () => void;
  children: ReactNode;
  acoes?: ReactNode;
};

export function Dialog({ aberto, titulo, onFechar, children, acoes }: DialogProps) {
  const idTitulo = useId();

  useEffect(() => {
    if (!aberto) return;

    function aoPressionar(evento: KeyboardEvent) {
      if (evento.key === "Escape") onFechar();
    }
    document.addEventListener("keydown", aoPressionar);
    return () => document.removeEventListener("keydown", aoPressionar);
  }, [aberto, onFechar]);

  if (!aberto) return null;

  return (
    <div
      data-testid="dialog-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onFechar}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        className="w-full max-w-md rounded bg-white p-6"
        onClick={(evento) => evento.stopPropagation()}
      >
        <h2 id={idTitulo} className="mb-4 text-lg font-semibold">
          {titulo}
        </h2>
        <div>{children}</div>
        {acoes && <div className="mt-6 flex justify-end gap-2">{acoes}</div>}
      </div>
    </div>
  );
}
