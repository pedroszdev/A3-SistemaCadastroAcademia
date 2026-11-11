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
};

export function TabelaPaginada<T>({
  pagina,
  erro,
  colunas,
  chaveDaLinha,
  vazio,
  onMudarPagina,
}: TabelaPaginadaProps<T>) {
  return (
    <>
      {erro && (
        <p role="alert" className="text-sm text-red-600">
          {erro}
        </p>
      )}

      {!pagina && !erro ? (
        <p className="text-sm text-zinc-600">Carregando…</p>
      ) : (
        pagina && (
          <Table
            colunas={colunas}
            linhas={pagina.data}
            chaveDaLinha={chaveDaLinha}
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
    </>
  );
}
