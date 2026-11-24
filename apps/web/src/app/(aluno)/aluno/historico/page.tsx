import type { Metadata } from "next";
import { MeuHistorico } from "@/features/aluno/meu-historico";

export const metadata: Metadata = { title: "Meu histórico · Academia" };

export default function MeuHistoricoPage() {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h1 className="font-display text-lg font-bold">Meu histórico</h1>
        <p className="mt-1 text-sm text-suave">Suas atividades na academia.</p>
      </div>
      <MeuHistorico />
    </section>
  );
}
