import { Icone } from "@/components/ui/icone";
import { MENSAGEM_INADIMPLENTE } from "./api";

type AvisoInadimplenciaProps = { maiorAtrasoDias?: number };

// RN09: membro inadimplente não registra atividade.
export function AvisoInadimplencia({ maiorAtrasoDias }: AvisoInadimplenciaProps) {
  return (
    <div
      role="alert"
      className="flex gap-3 rounded-xl border border-alerta-borda bg-alerta-claro p-3.5 text-sm leading-relaxed text-alerta-texto"
    >
      <span className="flex pt-px">
        <Icone nome="alerta" />
      </span>
      <div>
        <p className="font-bold">{MENSAGEM_INADIMPLENTE}</p>
        <p className="mt-0.5">
          A atividade não pode ser registrada até a recepção regularizar o pagamento
          {maiorAtrasoDias ? ` (maior atraso: ${maiorAtrasoDias} dias)` : ""}.
        </p>
      </div>
    </div>
  );
}
