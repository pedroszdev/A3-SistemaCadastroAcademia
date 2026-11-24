import Link from "next/link";
import { Icone } from "@/components/ui/icone";

type Passo = { rotulo: string; href?: string };

// Trilha de navegação ("Membros › Novo membro"). O último passo é a página atual.
export function Trilha({ passos }: { passos: Passo[] }) {
  return (
    <nav aria-label="Trilha" className="text-sm text-suave">
      <ol className="flex flex-wrap items-center gap-1.5">
        {passos.map((passo, i) => {
          const atual = i === passos.length - 1;
          return (
            <li key={passo.rotulo} className="flex items-center gap-1.5">
              {i > 0 && <Icone nome="proximo" tamanho={14} />}
              {atual || !passo.href ? (
                <span aria-current={atual ? "page" : undefined}>{passo.rotulo}</span>
              ) : (
                <Link href={passo.href} className="text-tinta underline">
                  {passo.rotulo}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
