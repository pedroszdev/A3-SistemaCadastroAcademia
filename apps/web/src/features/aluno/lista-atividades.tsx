import { EmptyState } from "@/components/ui/empty-state";
import { formatarData } from "@/lib/format";
import type { AtividadeDoAluno } from "./historico";

export function ListaAtividades({ atividades }: { atividades: AtividadeDoAluno[] }) {
  if (atividades.length === 0) {
    return (
      <EmptyState
        titulo="Nenhuma atividade no período"
        descricao="As atividades registradas pela academia aparecem aqui."
      />
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {atividades.map((item) => (
        <li key={item.id} className="rounded-lg border border-zinc-200 bg-white p-3">
          <div className="flex flex-wrap justify-between gap-x-3">
            <span className="font-medium text-zinc-900">{item.atividade}</span>
            <span className="text-sm text-zinc-600">{formatarData(item.data)}</span>
          </div>
          <div className="flex flex-wrap justify-between gap-x-3 text-sm text-zinc-600">
            <span>{`${item.tempoExecucao} min`}</span>
            <span>{item.treino?.tipo ?? "Sem treino vinculado"}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
