import type { SelectHTMLAttributes } from "react";
import { useId } from "react";
import {
  bordaDoCampo,
  CLASSES_CAMPO,
  idsDaDescricao,
  MolduraDoCampo,
  type PropsDeCampo,
} from "./campo";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> &
  Omit<PropsDeCampo, "icone"> & {
    opcoes: { valor: string; rotulo: string }[];
    placeholder?: string;
  };

export function Select({
  rotulo,
  opcoes,
  placeholder,
  erro,
  ajuda,
  obrigatorio,
  rotuloOculto,
  id,
  className = "",
  ...props
}: SelectProps) {
  const idGerado = useId();
  const idCampo = id ?? idGerado;
  const { idErro, idAjuda, descritoPor } = idsDaDescricao(idCampo, erro, ajuda);

  return (
    <MolduraDoCampo
      rotulo={rotulo}
      rotuloOculto={rotuloOculto}
      obrigatorio={obrigatorio}
      idCampo={idCampo}
      idErro={idErro}
      idAjuda={idAjuda}
      erro={erro}
      ajuda={ajuda}
    >
      <select
        id={idCampo}
        aria-invalid={erro ? "true" : undefined}
        aria-describedby={descritoPor}
        className={`${CLASSES_CAMPO} ${bordaDoCampo(erro)} h-[46px] px-3 ${className}`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {opcoes.map((opcao) => (
          <option key={opcao.valor} value={opcao.valor}>
            {opcao.rotulo}
          </option>
        ))}
      </select>
    </MolduraDoCampo>
  );
}
