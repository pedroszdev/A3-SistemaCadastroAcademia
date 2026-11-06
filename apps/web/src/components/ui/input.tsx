import type { InputHTMLAttributes } from "react";
import { useId } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  rotulo: string;
  erro?: string;
};

export function Input({ rotulo, erro, id, className = "", ...props }: InputProps) {
  const idGerado = useId();
  const idCampo = id ?? idGerado;
  const idErro = `${idCampo}-erro`;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={idCampo} className="text-sm font-medium text-zinc-800">
        {rotulo}
      </label>
      <input
        id={idCampo}
        aria-invalid={erro ? "true" : undefined}
        aria-describedby={erro ? idErro : undefined}
        className={`rounded border border-zinc-300 px-3 py-2 text-sm ${className}`}
        {...props}
      />
      {erro && (
        <p id={idErro} className="text-sm text-red-600">
          {erro}
        </p>
      )}
    </div>
  );
}
