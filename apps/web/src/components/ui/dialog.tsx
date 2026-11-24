"use client";

import { type ReactNode, useEffect, useId } from "react";
import { BotaoIcone } from "./botao-icone";

type DialogProps = {
  aberto: boolean;
  titulo: string;
  onFechar: () => void;
  children: ReactNode;
  acoes?: ReactNode;
};

// O painel lateral cede o Escape a um Dialog modal aberto por cima dele (ex.: confirmar
// a exclusão com o painel de edição aberto): só o modal fecha.
function useFecharComEscape(aberto: boolean, onFechar: () => void, cederAoModal = false) {
  useEffect(() => {
    if (!aberto) return;

    function aoPressionar(evento: KeyboardEvent) {
      if (evento.key !== "Escape") return;
      if (cederAoModal && document.querySelector('[role="dialog"][aria-modal="true"]')) return;
      onFechar();
    }
    document.addEventListener("keydown", aoPressionar);
    return () => document.removeEventListener("keydown", aoPressionar);
  }, [aberto, onFechar, cederAoModal]);
}

export function Dialog({ aberto, titulo, onFechar, children, acoes }: DialogProps) {
  const idTitulo = useId();
  useFecharComEscape(aberto, onFechar);

  if (!aberto) return null;

  return (
    <div
      data-testid="dialog-overlay"
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center bg-tinta/50 p-4"
      onClick={onFechar}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        className="max-h-[calc(100vh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-borda bg-white p-6 shadow-xl"
        onClick={(evento) => evento.stopPropagation()}
      >
        <h2 id={idTitulo} className="mb-4 font-display text-lg font-semibold">
          {titulo}
        </h2>
        <div className="text-sm leading-relaxed">{children}</div>
        {acoes && <div className="mt-6 flex justify-end gap-2.5">{acoes}</div>}
      </div>
    </div>
  );
}

type PainelLateralProps = Omit<DialogProps, "acoes"> & {
  descricao?: string;
};

// Formulário que abre ao lado da tabela, como no design, em vez de por cima da tela.
// Não é modal: a lista continua visível e usável. Fecha com Escape ou com o X.
export function PainelLateral({
  aberto,
  titulo,
  descricao,
  onFechar,
  children,
}: PainelLateralProps) {
  const idTitulo = useId();
  useFecharComEscape(aberto, onFechar, true);

  if (!aberto) return null;

  return (
    <section
      role="dialog"
      aria-modal="false"
      aria-labelledby={idTitulo}
      className="rounded-2xl border border-borda bg-white p-6"
    >
      <div className="mb-[18px] flex items-start justify-between gap-3">
        <div>
          <h2 id={idTitulo} className="font-display text-lg font-semibold">
            {titulo}
          </h2>
          {descricao && <p className="mt-1 text-[13px] text-suave">{descricao}</p>}
        </div>
        <BotaoIcone icone="fechar" rotulo="Fechar painel" onClick={onFechar} />
      </div>
      {children}
    </section>
  );
}
