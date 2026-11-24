"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ITENS_MENU_ALUNO, estaAtivo } from "@/lib/menu";

export function MenuAluno() {
  const pathname = usePathname();

  return (
    <nav aria-label="Menu do aluno">
      <ul className="-mx-5 flex gap-1 overflow-x-auto px-5">
        {ITENS_MENU_ALUNO.map((item) => {
          const ativo = estaAtivo(pathname, item.href);
          return (
            <li key={item.href} className="flex-1 shrink-0">
              <Link
                href={item.href}
                aria-current={ativo ? "page" : undefined}
                className={`flex min-h-[46px] items-center justify-center border-b-[3px] px-3 text-sm whitespace-nowrap no-underline ${
                  ativo
                    ? "border-lima font-semibold text-white"
                    : "border-transparent font-medium text-suave-escuro-2 hover:text-white"
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
