import type { SelectHTMLAttributes } from "react";
import { useId } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  rotulo: string;
  opcoes: { valor: string; rotulo: string }[];
  placeholder?: string;
  erro?: string;
};

export function Select({
  rotulo,
  opcoes,
  placeholder,
  erro,
  id,
  className = "",
  ...props
}: SelectProps) {
  const idGerado = useId();
  const idCampo = id ?? idGerado;
  const idErro = `${idCampo}-erro`;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={idCampo} className="text-sm font-medium text-zinc-800">
        {rotulo}
      </label>
      <select
        id={idCampo}
        aria-invalid={erro ? "true" : undefined}
        aria-describedby={erro ? idErro : undefined}
        className={`rounded border border-zinc-300 px-3 py-2 text-sm ${className}`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {opcoes.map((opcao) => (
          <option key={opcao.valor} value={opcao.valor}>
            {opcao.rotulo}
          </option>
        ))}
      </select>
      {erro && (
        <p id={idErro} className="text-sm text-red-600">
          {erro}
        </p>
      )}
    </div>
  );
}
