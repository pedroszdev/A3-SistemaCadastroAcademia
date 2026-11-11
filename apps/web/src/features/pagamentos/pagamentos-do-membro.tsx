"use client";

import { TelaPagamentos } from "./tela-pagamentos";

// Aba Pagamentos da ficha do membro (WEB-G3). A key remonta a lista ao trocar de membro.
export function PagamentosDoMembro({ membroId }: { membroId: string }) {
  return <TelaPagamentos key={membroId} membroId={membroId} />;
}
