import type { ButtonHTMLAttributes } from "react";

// Classes também usadas por links com cara de botão (ex.: "Novo membro").
export const VARIANTES_BOTAO = {
  primario: "border border-lima-borda bg-lima text-tinta hover:brightness-95",
  escuro: "border border-tinta bg-tinta text-white hover:bg-tinta-2",
  secundario: "border border-borda bg-white text-tinta hover:bg-fundo-2",
  perigo: "border border-alerta bg-alerta text-white hover:brightness-110",
};

export const TAMANHOS_BOTAO = {
  normal: "min-h-11 gap-2 rounded-[10px] px-[18px] text-sm",
  pequeno: "min-h-9 gap-1.5 rounded-lg px-3 text-[13px]",
};

export function classesDoBotao(
  variante: keyof typeof VARIANTES_BOTAO = "primario",
  tamanho: keyof typeof TAMANHOS_BOTAO = "normal",
): string {
  return `inline-flex items-center justify-center whitespace-nowrap font-semibold no-underline ${TAMANHOS_BOTAO[tamanho]} ${VARIANTES_BOTAO[variante]}`;
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: keyof typeof VARIANTES_BOTAO;
  tamanho?: keyof typeof TAMANHOS_BOTAO;
};

export function Button({
  variante = "primario",
  tamanho = "normal",
  type = "button",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${classesDoBotao(variante, tamanho)} cursor-pointer disabled:cursor-not-allowed disabled:border-desabilitado disabled:bg-desabilitado disabled:text-desabilitado-texto disabled:brightness-100 ${className}`}
      {...props}
    />
  );
}
