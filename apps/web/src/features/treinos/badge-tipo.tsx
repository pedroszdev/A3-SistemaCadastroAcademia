import { Badge, type TomBadge } from "@/components/ui/status-badge";
import type { TipoTreino } from "./tipos";

// Cor de cada tipo de treino no design.
const TOM_DO_TIPO: Record<TipoTreino, TomBadge> = {
  Musculação: "lima",
  Cardio: "alerta",
  Funcional: "info",
  Alongamento: "roxo",
  Crossfit: "escuro",
  Outro: "neutro",
};

export function BadgeTipoTreino({ tipo }: { tipo: string }) {
  return <Badge tom={TOM_DO_TIPO[tipo as TipoTreino] ?? "neutro"}>{tipo}</Badge>;
}
