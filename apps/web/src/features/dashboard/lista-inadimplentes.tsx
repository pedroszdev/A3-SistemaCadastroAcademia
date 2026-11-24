import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Cartao } from "@/components/ui/cartao";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/status-badge";
import { rotuloAtraso } from "@/features/pagamentos/status-pagamento";
import type { MembroInadimplente } from "./api";

export function ListaInadimplentes({ membros }: { membros: MembroInadimplente[] }) {
  return (
    <Cartao
      titulo="Inadimplentes"
      descricao="Não podem registrar atividade até regularizar"
      acao={
        <Link href="/pagamentos" className="text-sm font-semibold underline">
          Ver pagamentos
        </Link>
      }
    >
      {membros.length === 0 ? (
        <EmptyState titulo="Nenhum membro inadimplente" />
      ) : (
        <ul className="flex flex-col gap-2.5">
          {membros.map((membro) => (
            <li
              key={membro.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-[#f5d9c2] bg-[#fdf5ee] p-3.5"
            >
              <span className="inline-flex items-center gap-3">
                <Avatar nome={membro.nome} />
                <Link href={`/membros/${membro.id}`} className="font-semibold hover:underline">
                  {membro.nome}
                </Link>
              </span>
              <Badge tom="alerta">{rotuloAtraso(membro.maiorAtrasoDias)}</Badge>
            </li>
          ))}
        </ul>
      )}
    </Cartao>
  );
}
