import { Button } from "./button";
import { Icone } from "./icone";

type RodapeFormularioProps = {
  erro: string | null;
  enviando: boolean;
  desabilitado?: boolean;
  onCancelar: () => void;
  // Texto do botão de envio (ex.: "Salvar membro"). O padrão é "Salvar".
  rotuloSalvar?: string;
};

export function RodapeFormulario({
  erro,
  enviando,
  desabilitado = false,
  onCancelar,
  rotuloSalvar = "Salvar",
}: RodapeFormularioProps) {
  return (
    <>
      {erro && (
        <p role="alert" className="text-sm text-red-600">
          {erro}
        </p>
      )}
      <div className="flex flex-wrap justify-end gap-2.5 pt-1">
        <Button variante="secundario" onClick={onCancelar} disabled={enviando}>
          Cancelar
        </Button>
        <Button type="submit" disabled={enviando || desabilitado}>
          <Icone nome="check" tamanho={16} />
          {enviando ? "Salvando…" : rotuloSalvar}
        </Button>
      </div>
    </>
  );
}
