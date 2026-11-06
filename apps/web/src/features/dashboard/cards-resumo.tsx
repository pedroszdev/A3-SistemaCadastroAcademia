import { formatarMoeda } from "@/lib/format";
import type { ResumoDashboard } from "./api";

export function CardsResumo({ resumo }: { resumo: ResumoDashboard }) {
  const cards = [
    { rotulo: "Membros ativos", valor: String(resumo.membrosAtivos) },
    { rotulo: "Inadimplentes", valor: String(resumo.membrosInadimplentes) },
    { rotulo: "Pagamentos atrasados", valor: String(resumo.pagamentosAtrasados) },
    { rotulo: "Receita do mês", valor: formatarMoeda(resumo.receitaMes) },
    { rotulo: "Atividades hoje", valor: String(resumo.atividadesHoje) },
  ];

  return (
    <dl className="grid grid-cols-2 gap-4 lg:grid-cols-5">
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
