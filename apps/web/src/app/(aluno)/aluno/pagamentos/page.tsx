import type { Metadata } from "next";
import { MeusPagamentos } from "@/features/aluno/meus-pagamentos";

export const metadata: Metadata = { title: "Meus pagamentos · Academia" };

export default function MeusPagamentosPage() {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h1 className="font-display text-lg font-bold">Pagamentos</h1>
        <p className="mt-1 text-sm text-suave">Suas mensalidades: pagas, em aberto e em atraso.</p>
      </div>
      <MeusPagamentos />
    </section>
  );
}
