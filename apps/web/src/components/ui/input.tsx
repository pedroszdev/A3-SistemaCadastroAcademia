import type { InputHTMLAttributes } from "react";
import { useId } from "react";
import {
  bordaDoCampo,
  CLASSES_CAMPO,
  idsDaDescricao,
  MolduraDoCampo,
  type PropsDeCampo,
} from "./campo";

type InputProps = InputHTMLAttributes<HTMLInputElement> & PropsDeCampo;

export function Input({
  rotulo,
  erro,
  ajuda,
  obrigatorio,
  rotuloOculto,
  icone,
  id,
  className = "",
  ...props
}: InputProps) {
  const idGerado = useId();
  const idCampo = id ?? idGerado;
  const { idErro, idAjuda, descritoPor } = idsDaDescricao(idCampo, erro, ajuda);

  return (
    <MolduraDoCampo
      rotulo={rotulo}
      rotuloOculto={rotuloOculto}
      obrigatorio={obrigatorio}
      icone={icone}
      idCampo={idCampo}
      idErro={idErro}
      idAjuda={idAjuda}
      erro={erro}
      ajuda={ajuda}
    >
      <input
        id={idCampo}
        aria-invalid={erro ? "true" : undefined}
        aria-describedby={descritoPor}
        className={`${CLASSES_CAMPO} ${bordaDoCampo(erro)} h-[46px] pr-3.5 ${icone ? "pl-10" : "pl-3.5"} ${className}`}
        {...props}
      />
    </MolduraDoCampo>
  );
}
