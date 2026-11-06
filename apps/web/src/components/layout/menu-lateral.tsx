"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { estaAtivo, itensDoMenu } from "@/lib/menu";
import type { Cargo } from "@/lib/sessao";

export function MenuLateral({ cargo }: { cargo: Cargo | null }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Menu principal">
      <ul className="flex flex-col gap-1">
        {itensDoMenu(cargo).map((item) => {
          const ativo = estaAtivo(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={ativo ? "page" : undefined}
                className={`block rounded px-3 py-2 text-sm ${
                  ativo
                    ? "bg-zinc-900 font-medium text-white"
                    : "text-zinc-700 hover:bg-zinc-100"
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
