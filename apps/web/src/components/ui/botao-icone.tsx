import Link from "next/link";
import type { ButtonHTMLAttributes } from "react";
import { Icone, type NomeIcone } from "./icone";

const TONS = {
  normal: "text-tinta",
  alerta: "text-alerta",
  sucesso: "text-sucesso",
};

const CLASSES =
  "inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-borda bg-white hover:bg-fundo-2";

type Comum = {
  icone: NomeIcone;
  // Obrigatório: o botão só tem o ícone, então o nome acessível vem daqui.
  rotulo: string;
  tom?: keyof typeof TONS;
};

type BotaoIconeProps = Comum &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label" | "children">;

export function BotaoIcone({
  icone,
  rotulo,
  tom = "normal",
  type = "button",
  className = "",
  ...props
}: BotaoIconeProps) {
  return (
    <button
      type={type}
      aria-label={rotulo}
      title={rotulo}
      className={`${CLASSES} ${TONS[tom]} cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    >
      <Icone nome={icone} />
    </button>
  );
}

export function LinkIcone({ icone, rotulo, tom = "normal", href }: Comum & { href: string }) {
  return (
    <Link href={href} aria-label={rotulo} title={rotulo} className={`${CLASSES} ${TONS[tom]}`}>
      <Icone nome={icone} />
    </Link>
  );
}
