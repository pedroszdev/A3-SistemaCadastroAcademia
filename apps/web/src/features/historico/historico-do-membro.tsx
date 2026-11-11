"use client";

import { TelaHistorico } from "./tela-historico";

// Aba Histórico da ficha do membro (WEB-G3). A key remonta a lista ao trocar de membro.
export function HistoricoDoMembro({ membroId }: { membroId: string }) {
  return <TelaHistorico key={membroId} membroId={membroId} />;
}
