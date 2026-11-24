"use client";

import { type ReactNode, useSyncExternalStore } from "react";

const DIA = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

// "segunda-feira, 16 de novembro de 2026" → "Segunda, 16 de novembro de 2026".
export function dataPorExtenso(data: Date): string {
  const texto = DIA.format(data).replace("-feira", "");
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

const semAssinatura = () => () => {};

// No servidor fica vazio: a data do request poderia não bater com a do navegador.
function useDataDeHoje(): string {
  return useSyncExternalStore(
    semAssinatura,
    () => dataPorExtenso(new Date()),
    () => "",
  );
}

type CabecalhoPaginaProps = {
  titulo: string;
  descricao?: string;
  acoes?: ReactNode;
};

export function CabecalhoPagina({ titulo, descricao, acoes }: CabecalhoPaginaProps) {
  const hoje = useDataDeHoje();

  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="mb-1.5 min-h-5 text-[13px] text-suave">{hoje}</p>
        <h1 className="font-display text-[32px] leading-tight font-bold tracking-[-0.02em]">
          {titulo}
        </h1>
        {descricao && <p className="mt-1.5 text-[15px] text-suave">{descricao}</p>}
      </div>
      {acoes && <div className="flex flex-wrap gap-2.5">{acoes}</div>}
    </header>
  );
}
