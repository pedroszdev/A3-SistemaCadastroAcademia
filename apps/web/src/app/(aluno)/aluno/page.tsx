import type { Metadata } from "next";
import Link from "next/link";
import { ITENS_MENU_ALUNO } from "@/lib/menu";

export const metadata: Metadata = { title: "Portal do aluno · Academia" };

export default function PortalDoAlunoPage() {
  return (
    <section>
      <h1 className="text-xl font-semibold text-zinc-900">Portal do aluno</h1>
      <p className="mt-1 text-sm text-zinc-600">Escolha o que você quer ver.</p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {ITENS_MENU_ALUNO.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="block rounded border border-zinc-200 p-4 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
            >
              {item.rotulo}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
