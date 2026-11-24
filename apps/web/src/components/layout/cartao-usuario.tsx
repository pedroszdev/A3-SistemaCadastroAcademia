import Link from "next/link";
import type { ReactNode } from "react";
import { ROTULO_CARGO } from "@/features/funcionarios/cargos";
import type { Cargo } from "@/lib/sessao";

// Rodapé do menu lateral: o token só traz o cargo, então o cartão mostra o cargo por extenso
// e o código dele, como no design ("Administrador" / "ADMIN").
export function CartaoUsuario({ cargo, acao }: { cargo: Cargo; acao: ReactNode }) {
  const nome = ROTULO_CARGO[cargo];

  return (
    <div className="flex items-center gap-3 rounded-xl bg-tinta-2 p-3">
      <span
        aria-hidden="true"
        className="flex size-[38px] flex-none items-center justify-center rounded-full bg-tinta-3 text-sm font-bold text-lima"
      >
        {nome.slice(0, 2).toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        {/* O cartão leva para "Meus dados" (RN20). */}
        <Link
          href="/perfil"
          title="Meus dados"
          className="block truncate text-sm font-semibold text-white no-underline hover:underline"
        >
          {nome}
        </Link>
        <p className="mt-0.5 text-xs text-suave-escuro-2">{cargo}</p>
      </div>
      {acao}
    </div>
  );
}
