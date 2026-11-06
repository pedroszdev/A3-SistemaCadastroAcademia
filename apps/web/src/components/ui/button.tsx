import type { ButtonHTMLAttributes } from "react";

const VARIANTES = {
  primario: "bg-zinc-900 text-white hover:bg-zinc-700",
  secundario: "border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-100",
  perigo: "bg-red-600 text-white hover:bg-red-500",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: keyof typeof VARIANTES;
};

export function Button({
  variante = "primario",
  type = "button",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`rounded px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTES[variante]} ${className}`}
      {...props}
    />
  );
}
