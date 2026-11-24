import type { TextareaHTMLAttributes } from "react";
import { useId } from "react";
import {
  bordaDoCampo,
  CLASSES_CAMPO,
  idsDaDescricao,
  MolduraDoCampo,
  type PropsDeCampo,
} from "./campo";

type AreaTextoProps = TextareaHTMLAttributes<HTMLTextAreaElement> & Omit<PropsDeCampo, "icone">;

export function AreaTexto({
  rotulo,
  erro,
  ajuda,
  obrigatorio,
  rotuloOculto,
  id,
  rows = 3,
  className = "",
  ...props
}: AreaTextoProps) {
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
      <textarea
        id={idCampo}
        rows={rows}
        aria-invalid={erro ? "true" : undefined}
        aria-describedby={descritoPor}
        className={`${CLASSES_CAMPO} ${bordaDoCampo(erro)} resize-y px-3.5 py-3 ${className}`}
        {...props}
      />
    </MolduraDoCampo>
  );
}
