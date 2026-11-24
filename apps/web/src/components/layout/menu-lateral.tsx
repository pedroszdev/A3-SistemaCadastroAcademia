"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icone, type NomeIcone } from "@/components/ui/icone";
import { estaAtivo, itensDoMenu } from "@/lib/menu";
import type { Cargo } from "@/lib/sessao";

const ICONES: Record<string, NomeIcone> = {
  "/dashboard": "painel",
  "/membros": "membros",
  "/treinos": "treinos",
  "/pagamentos": "pagamentos",
  "/atividades": "relogio",
  "/funcionarios": "cracha",
  "/perfil": "usuario",
};

export function MenuLateral({ cargo }: { cargo: Cargo | null }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Menu principal" className="flex-1">
      <p className="mb-2.5 ml-3.5 text-[11px] font-semibold tracking-[0.08em] text-suave-escuro-3 uppercase">
        Gestão
      </p>
      <ul className="flex flex-col gap-1">
        {itensDoMenu(cargo).map((item) => {
          const ativo = estaAtivo(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={ativo ? "page" : undefined}
                className={`flex items-center gap-3 rounded-[10px] px-3.5 py-[11px] text-sm no-underline ${
                  ativo
                    ? "bg-lima font-semibold text-tinta"
                    : "text-suave-escuro hover:bg-tinta-2 hover:text-white"
                }`}
              >
                <Icone nome={ICONES[item.href] ?? "painel"} />
                <span>{item.rotulo}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
