import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { Table } from "@/components/ui/table";
import type { MembroInadimplente } from "./api";

export function ListaInadimplentes({ membros }: { membros: MembroInadimplente[] }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-zinc-900">Membros inadimplentes</h2>
      <Table
        colunas={[
          {
            chave: "nome",
            titulo: "Membro",
            celula: (membro) => (
              <Link
                href={`/membros/${membro.id}`}
                className="text-zinc-900 underline"
              >
                {membro.nome}
              </Link>
            ),
          },
          {
            chave: "atraso",
            titulo: "Dias em atraso",
            celula: (membro) => membro.maiorAtrasoDias,
          },
        ]}
        linhas={membros}
        chaveDaLinha={(membro) => membro.id}
        vazio={<EmptyState titulo="Nenhum membro inadimplente" />}
      />
    </section>
  );
}
