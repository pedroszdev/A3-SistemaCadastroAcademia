import type { Metadata } from "next";
import { MeusDados } from "@/features/perfil/meus-dados";

export const metadata: Metadata = { title: "Meus dados · Academia" };

export default function MeusDadosPage() {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h1 className="font-display text-lg font-bold">Meus dados</h1>
        <p className="mt-1 text-sm text-suave">Confira e atualize seus dados de contato.</p>
      </div>
      <MeusDados />
    </section>
  );
}
