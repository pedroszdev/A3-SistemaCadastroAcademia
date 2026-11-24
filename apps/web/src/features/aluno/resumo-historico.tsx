import type { ResumoDoPeriodo } from "./historico";

export function ResumoHistorico({ resumo }: { resumo: ResumoDoPeriodo }) {
  return (
    <dl className="grid grid-cols-2 gap-3">
      <div className="rounded-[14px] bg-tinta p-4">
        <dt className="text-[13px] text-[#b9c0bb]">Atividades</dt>
        <dd className="mt-1.5 font-display text-[30px] font-bold text-lima">
          {String(resumo.totalAtividades)}
        </dd>
      </div>
      <div className="rounded-[14px] border border-borda bg-white p-4">
        <dt className="text-[13px] text-suave">Minutos</dt>
        <dd className="mt-1.5 font-display text-[30px] font-bold">{String(resumo.totalMinutos)}</dd>
      </div>
    </dl>
  );
}
