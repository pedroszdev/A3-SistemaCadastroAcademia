"use client";

import { EmptyState } from "@/components/ui/empty-state";
import { formatarData } from "@/lib/format";
import type { TreinoDoAluno } from "./treinos";

type ListaTreinosProps = {
  treinos: TreinoDoAluno[];
  onAbrir: (treino: TreinoDoAluno) => void;
};

export function ListaTreinos({ treinos, onAbrir }: ListaTreinosProps) {
  if (treinos.length === 0) {
    return (
      <EmptyState
        titulo="Nenhum treino encontrado"
        descricao="Os treinos montados pelo seu instrutor aparecem aqui."
      />
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {treinos.map((t) => (
        <li key={t.id}>
          <button
            type="button"
            onClick={() => onAbrir(t)}
            className="w-full rounded-lg border border-zinc-200 bg-white p-3 text-left hover:bg-zinc-50"
          >
            {/* Só span dentro do botão: o conteúdo dele precisa ser inline. */}
            <span className="flex flex-wrap justify-between gap-x-3">
              <span className="font-medium text-zinc-900">{t.tipo}</span>
              <span className="text-sm text-zinc-600">{`Início ${formatarData(t.dataInicio)}`}</span>
            </span>
            <span className="mt-1 line-clamp-2 block text-sm text-zinc-700">{t.descricao}</span>
            <span className="block text-sm text-zinc-600">{`${t.duracao} min`}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
