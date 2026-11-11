import { MENSAGEM_INADIMPLENTE } from "./api";

type AvisoInadimplenciaProps = { maiorAtrasoDias?: number };

// RN09: membro inadimplente não registra atividade.
export function AvisoInadimplencia({ maiorAtrasoDias }: AvisoInadimplenciaProps) {
  return (
    <div role="alert" className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
      <p className="font-semibold">{MENSAGEM_INADIMPLENTE}</p>
      <p>
        A atividade não pode ser registrada até a recepção regularizar o pagamento
        {maiorAtrasoDias ? ` (maior atraso: ${maiorAtrasoDias} dias)` : ""}.
      </p>
    </div>
  );
}
