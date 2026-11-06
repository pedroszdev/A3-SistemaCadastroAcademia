"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ITENS_MENU_ALUNO, estaAtivo } from "@/lib/menu";

export function MenuAluno() {
  const pathname = usePathname();

  return (
    <nav aria-label="Menu do aluno">
      <ul className="flex gap-1 overflow-x-auto">
        {ITENS_MENU_ALUNO.map((item) => {
          const ativo = estaAtivo(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={ativo ? "page" : undefined}
                className={`block whitespace-nowrap border-b-2 px-3 py-2 text-sm ${
                  ativo
                    ? "border-zinc-900 font-medium text-zinc-900"
                    : "border-transparent text-zinc-600 hover:text-zinc-900"
                }`}
              >
                {item.rotulo}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
