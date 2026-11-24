import type { ReactNode } from "react";
import { Icone, type NomeIcone } from "./icone";

// Peças comuns de Input, Select e AreaTexto: rótulo, ícone à esquerda, ajuda e erro.

export type PropsDeCampo = {
  rotulo: string;
  erro?: string;
  // Texto de apoio abaixo do campo. Com erro, o erro toma o lugar dele.
  ajuda?: string;
  // Marca o rótulo com "*". O asterisco vem do CSS, fora do nome acessível do campo.
  obrigatorio?: boolean;
  // Rótulo só para leitor de tela (ex.: busca da barra de filtros).
  rotuloOculto?: boolean;
  icone?: NomeIcone;
};

export const CLASSES_CAMPO =
  "w-full rounded-[10px] border bg-white text-[15px] text-tinta placeholder:text-suave/80 disabled:cursor-not-allowed disabled:bg-fundo-2 disabled:text-suave";

export function bordaDoCampo(erro?: string): string {
  return erro ? "border-red-600" : "border-borda-campo";
}

export function idsDaDescricao(idCampo: string, erro?: string, ajuda?: string) {
  const idErro = `${idCampo}-erro`;
  const idAjuda = `${idCampo}-ajuda`;
  return {
    idErro,
    idAjuda,
    descritoPor: erro ? idErro : ajuda ? idAjuda : undefined,
  };
}

type MolduraProps = Omit<PropsDeCampo, "erro" | "ajuda"> & {
  idCampo: string;
  idErro: string;
  idAjuda: string;
  erro?: string;
  ajuda?: string;
  children: ReactNode;
};

export function MolduraDoCampo({
  rotulo,
  rotuloOculto,
  obrigatorio,
  icone,
  idCampo,
  idErro,
  idAjuda,
  erro,
  ajuda,
  children,
}: MolduraProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label
        htmlFor={idCampo}
        className={
          rotuloOculto
            ? "sr-only"
            : `text-sm font-semibold text-tinta ${obrigatorio ? "after:text-alerta after:content-['_*']" : ""}`
        }
      >
        {rotulo}
      </label>
      <div className="relative">
        {icone && (
          <span className="pointer-events-none absolute top-[13px] left-[13px] flex text-suave">
            <Icone nome={icone} />
          </span>
        )}
        {children}
      </div>
      {erro ? (
        <p id={idErro} className="text-[13px] text-red-600">
          {erro}
        </p>
      ) : (
        ajuda && (
          <p id={idAjuda} className="text-[13px] text-suave">
            {ajuda}
          </p>
        )
      )}
    </div>
  );
}
