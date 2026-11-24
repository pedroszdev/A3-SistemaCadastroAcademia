"use client";

import { EmptyState } from "@/components/ui/empty-state";
import { BadgeTipoTreino } from "@/features/treinos/badge-tipo";
import { formatarData } from "@/lib/format";
import type { TreinoDoAluno } from "./treinos";

type ListaTreinosProps = {
  treinos: TreinoDoAluno[];
  onAbrir: (treino: TreinoDoAluno) => void;
};

export function ListaTreinos({ treinos, onAbrir }: ListaTreinosProps) {
  if (treinos.length === 0) {
    return (
      <div className="rounded-2xl border border-borda bg-white">
        <EmptyState
          titulo="Nenhum treino encontrado"
          descricao="Os treinos montados pelo seu instrutor aparecem aqui."
        />
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3.5">
      {treinos.map((t) => (
        <li key={t.id}>
          <button
            type="button"
            onClick={() => onAbrir(t)}
            className="flex w-full cursor-pointer flex-col gap-2.5 rounded-2xl border border-borda bg-white p-[18px] text-left hover:border-borda-campo"
          >
            {/* Só span dentro do botão: o conteúdo dele precisa ser inline. */}
            <span className="flex w-full items-center justify-between gap-3">
              <BadgeTipoTreino tipo={t.tipo} />
              <span className="text-[13px] text-suave">{`${t.duracao} min`}</span>
            </span>
            <span className="line-clamp-2 block text-base font-semibold text-tinta">
              {t.descricao}
            </span>
            <span className="block text-[13px] text-suave">{`Desde ${formatarData(t.dataInicio)}`}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
