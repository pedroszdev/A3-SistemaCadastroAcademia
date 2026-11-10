import { TelaHistorico } from "@/features/historico/tela-historico";

export const metadata = { title: "Histórico · Academia" };

export default function AtividadesPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-zinc-900">Histórico de atividades</h1>
      <TelaHistorico />
    </div>
  );
}
