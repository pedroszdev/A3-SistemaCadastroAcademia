"use client";

import { TelaHistorico } from "./tela-historico";

type HistoricoDoMembroProps = {
  membroId: string;
  // Membro inativo não registra atividade, então o botão some e fica o aviso.
  ativo: boolean;
  // Chamado depois de registrar, para a ficha atualizar o resumo (atividades dos últimos 30 dias).
  onAlterado?: () => void;
};

// Aba Histórico da ficha do membro (WEB-G3). Trocar o membroId zera a lista.
export function HistoricoDoMembro({ membroId, ativo, onAlterado }: HistoricoDoMembroProps) {
  // Sem membro (ex.: param ainda não resolvido) não lista as atividades de todo mundo.
  if (!membroId) return null;
  return <TelaHistorico membroId={membroId} membroInativo={!ativo} onAlterado={onAlterado} />;
}
