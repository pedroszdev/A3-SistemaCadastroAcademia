import type { Metadata } from "next";
import { MeusTreinos } from "@/features/aluno/meus-treinos";

export const metadata: Metadata = { title: "Meus treinos · Academia" };

export default function MeusTreinosPage() {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Meus treinos</h1>
        <p className="mt-1 text-sm text-zinc-600">Os treinos montados para você.</p>
      </div>
      <MeusTreinos />
    </section>
  );
}
