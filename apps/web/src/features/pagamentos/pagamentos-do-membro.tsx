"use client";

import { TelaPagamentos } from "./tela-pagamentos";

type PagamentosDoMembroProps = {
  membroId: string;
  // RN04: membro inativo não recebe novo pagamento, então o botão some e fica o aviso.
  ativo: boolean;
  // Chamado depois de lançar, pagar ou cancelar, para a ficha atualizar o badge de situação.
  onAlterado?: () => void;
};

// Aba Pagamentos da ficha do membro (WEB-G3). Trocar o membroId zera a lista.
export function PagamentosDoMembro({ membroId, ativo, onAlterado }: PagamentosDoMembroProps) {
  // Sem membro (ex.: param ainda não resolvido) não lista os pagamentos de todo mundo.
  if (!membroId) return null;
  return <TelaPagamentos membroId={membroId} membroInativo={!ativo} onAlterado={onAlterado} />;
}
