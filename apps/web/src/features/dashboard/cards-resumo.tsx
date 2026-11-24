import { Icone, type NomeIcone } from "@/components/ui/icone";
import { formatarMoeda } from "@/lib/format";
import type { ResumoDashboard } from "./api";

type Card = {
  rotulo: string;
  valor: string;
  legenda: string;
  icone: NomeIcone;
  destaque?: boolean;
};

export function CardsResumo({ resumo }: { resumo: ResumoDashboard }) {
  const cards: Card[] = [
    {
      rotulo: "Membros ativos",
      valor: String(resumo.membrosAtivos),
      legenda: "Com cadastro ativo",
      icone: "membros",
    },
    {
      rotulo: "Inadimplentes",
      valor: String(resumo.membrosInadimplentes),
      legenda: "Atraso acima de 10 dias",
      icone: "alerta",
    },
    {
      rotulo: "Pagamentos atrasados",
      valor: String(resumo.pagamentosAtrasados),
      legenda: "Vencidos e não pagos",
      icone: "pagamentos",
    },
    {
      rotulo: "Receita do mês",
      valor: formatarMoeda(resumo.receitaMes),
      legenda: "Pagamentos com status Pago",
      icone: "raio",
      destaque: true,
    },
    {
      rotulo: "Atividades hoje",
      valor: String(resumo.atividadesHoje),
      legenda: "Registradas pelos instrutores",
      icone: "relogio",
    },
  ];

  return (
    <dl className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-4">
      {cards.map((card) => (
        <div
          key={card.rotulo}
          className={`relative flex flex-col gap-3.5 rounded-2xl border p-5 ${
            card.destaque ? "border-tinta bg-tinta" : "border-borda bg-white"
          }`}
        >
          {/* O ícone vem antes do dt para o valor (dd) seguir logo depois do rótulo. */}
          <span
            className={`absolute top-5 right-5 flex size-[34px] items-center justify-center rounded-[9px] text-tinta ${
              card.destaque ? "bg-lima" : "bg-fundo-2"
            }`}
          >
            <Icone nome={card.icone} />
          </span>
          <dt
            className={`flex min-h-[34px] items-center pr-11 text-sm font-medium ${
              card.destaque ? "text-[#b9c0bb]" : "text-suave"
            }`}
          >
            {card.rotulo}
          </dt>
          <dd
            className={`font-display text-[34px] leading-none font-bold tracking-[-0.02em] ${
              card.destaque ? "text-white" : "text-tinta"
            }`}
          >
            {card.valor}
          </dd>
          <p className={`text-[13px] ${card.destaque ? "text-[#b9c0bb]" : "text-suave"}`}>
            {card.legenda}
          </p>
        </div>
      ))}
    </dl>
  );
}
