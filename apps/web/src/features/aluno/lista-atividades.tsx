import { EmptyState } from "@/components/ui/empty-state";
import { formatarData } from "@/lib/format";
import type { AtividadeDoAluno } from "./historico";

export function ListaAtividades({ atividades }: { atividades: AtividadeDoAluno[] }) {
  if (atividades.length === 0) {
    return (
      <div className="rounded-2xl border border-borda bg-white">
        <EmptyState
          titulo="Nenhuma atividade no período"
          descricao="As atividades registradas pela academia aparecem aqui."
        />
      </div>
    );
  }

  return (
    <ul className="rounded-2xl border border-borda bg-white">
      {atividades.map((item) => (
        <li
          key={item.id}
          className="flex justify-between gap-3 border-b border-borda px-4 py-3.5 last:border-b-0"
        >
          <div className="min-w-0">
            <p className="text-[15px] font-semibold">{item.atividade}</p>
            <p className="mt-0.5 text-[13px] text-suave">
              <span>{formatarData(item.data)}</span>
              <span aria-hidden="true"> · </span>
              <span>{item.treino?.tipo ?? "Sem treino vinculado"}</span>
            </p>
          </div>
          <span className="text-sm font-semibold whitespace-nowrap">{`${item.tempoExecucao} min`}</span>
        </li>
      ))}
    </ul>
  );
}
