import type { ResumoDoPeriodo } from "./historico";

export function ResumoHistorico({ resumo }: { resumo: ResumoDoPeriodo }) {
  const cards = [
    { rotulo: "Atividades", valor: String(resumo.totalAtividades) },
    { rotulo: "Minutos", valor: String(resumo.totalMinutos) },
  ];

  return (
    <dl className="grid grid-cols-2 gap-4">
      {cards.map((card) => (
        <div
          key={card.rotulo}
          className="rounded-lg border border-zinc-200 bg-white p-4"
        >
          <dt className="text-sm text-zinc-600">{card.rotulo}</dt>
          <dd className="mt-1 text-2xl font-semibold text-zinc-900">
            {card.valor}
          </dd>
        </div>
      ))}
    </dl>
  );
}
