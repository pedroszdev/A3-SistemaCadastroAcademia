import type { ReactNode } from "react";

type CartaoProps = {
  titulo?: string;
  descricao?: ReactNode;
  // Link ou botão à direita do título (ex.: "Ver pagamentos").
  acao?: ReactNode;
  // "compacto" é o padding de 20px dos cartões laterais; "normal", 24px.
  espaco?: "normal" | "compacto";
  className?: string;
  children: ReactNode;
};

export function Cartao({
  titulo,
  descricao,
  acao,
  espaco = "normal",
  className = "",
  children,
}: CartaoProps) {
  return (
    <section
      className={`rounded-2xl border border-borda bg-white ${espaco === "normal" ? "p-6" : "p-5"} ${className}`}
    >
      {titulo && (
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold">{titulo}</h2>
            {descricao && <p className="mt-1 text-[13px] text-suave">{descricao}</p>}
          </div>
          {acao}
        </div>
      )}
      {children}
    </section>
  );
}

// Fileira com a área principal (tabela) e uma coluna lateral (formulário, atalhos), que
// desce para baixo da principal em telas estreitas.
export function DuasColunas({
  principal,
  lateral,
  larguraLateral = "340px",
}: {
  principal: ReactNode;
  lateral?: ReactNode;
  larguraLateral?: "280px" | "340px" | "360px";
}) {
  const flex = {
    "280px": "flex-[1_1_280px]",
    "340px": "flex-[1_1_340px]",
    "360px": "flex-[1_1_360px]",
  };
  return (
    <div className="flex flex-wrap items-start gap-5">
      <div className="min-w-0 flex-[999_1_560px]">{principal}</div>
      {lateral && <div className={`min-w-0 ${flex[larguraLateral]}`}>{lateral}</div>}
    </div>
  );
}
