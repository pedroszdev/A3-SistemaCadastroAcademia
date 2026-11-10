import { Button } from "./button";

type RodapeFormularioProps = {
  erro: string | null;
  enviando: boolean;
  desabilitado?: boolean;
  onCancelar: () => void;
};

export function RodapeFormulario({
  erro,
  enviando,
  desabilitado = false,
  onCancelar,
}: RodapeFormularioProps) {
  return (
    <>
      {erro && (
        <p role="alert" className="text-sm text-red-600">
          {erro}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button variante="secundario" onClick={onCancelar}>
          Cancelar
        </Button>
        <Button type="submit" disabled={enviando || desabilitado}>
          {enviando ? "Salvando…" : "Salvar"}
        </Button>
      </div>
    </>
  );
}
