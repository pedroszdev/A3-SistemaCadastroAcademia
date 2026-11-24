import type { ReactNode } from "react";
import type { Pagina } from "@/lib/use-lista-paginada";
import { type Coluna, Table } from "./table";

type TabelaPaginadaProps<T> = {
  pagina: Pagina<T> | null;
  erro: string | null;
  colunas: Coluna<T>[];
  chaveDaLinha: (linha: T) => string;
  vazio: ReactNode;
  onMudarPagina: (page: number) => void;
  rotuloItens?: string;
};

export function TabelaPaginada<T>({
  pagina,
  erro,
  colunas,
  chaveDaLinha,
  vazio,
  onMudarPagina,
  rotuloItens,
}: TabelaPaginadaProps<T>) {
  return (
    <div className="flex flex-col gap-3">
      {erro && (
        <p role="alert" className="text-sm text-red-600">
          {erro}
        </p>
      )}

      {!pagina && !erro ? (
        <p className="rounded-2xl border border-borda bg-white px-4 py-10 text-center text-sm text-suave">
          Carregando…
        </p>
      ) : (
        pagina && (
          <Table
            colunas={colunas}
            linhas={pagina.data}
            chaveDaLinha={chaveDaLinha}
            rotuloItens={rotuloItens}
            paginacao={{
              page: pagina.page,
              pageSize: pagina.pageSize,
              total: pagina.total,
              onMudarPagina,
            }}
            vazio={vazio}
          />
        )
      )}
    </div>
  );
}
