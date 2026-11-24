import type { Metadata } from "next";
import Link from "next/link";
import { ITENS_MENU_ALUNO } from "@/lib/menu";

export const metadata: Metadata = { title: "Portal do aluno · Academia" };

export default function PortalDoAlunoPage() {
  return (
    <section>
      <h1 className="font-display text-lg font-bold">Portal do aluno</h1>
      <p className="mt-1 text-sm text-suave">Escolha o que você quer ver.</p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {ITENS_MENU_ALUNO.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="block rounded-2xl border border-borda bg-white p-5 font-display text-base font-semibold no-underline hover:border-borda-campo"
            >
              {item.rotulo}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
