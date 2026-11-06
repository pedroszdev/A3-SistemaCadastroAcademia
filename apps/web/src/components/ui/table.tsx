import type { ReactNode } from "react";
import { Button } from "./button";
import { EmptyState } from "./empty-state";

export type Coluna<T> = {
  chave: string;
  titulo: string;
  celula: (linha: T) => ReactNode;
};

type Paginacao = {
  page: number;
  pageSize: number;
  total: number;
  onMudarPagina: (page: number) => void;
};

type TableProps<T> = {
  colunas: Coluna<T>[];
  linhas: T[];
  chaveDaLinha: (linha: T) => string;
  paginacao?: Paginacao;
  vazio?: ReactNode;
};

export function Table<T>({
  colunas,
  linhas,
  chaveDaLinha,
  paginacao,
  vazio,
}: TableProps<T>) {
  if (linhas.length === 0) {
    return vazio ?? <EmptyState titulo="Nenhum registro encontrado" />;
  }

  const totalPaginas = paginacao
    ? Math.max(1, Math.ceil(paginacao.total / paginacao.pageSize))
    : 1;

  return (
    <div className="flex flex-col gap-3">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-200">
            {colunas.map((coluna) => (
              <th key={coluna.chave} className="px-3 py-2 font-medium">
                {coluna.titulo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {linhas.map((linha) => (
            <tr key={chaveDaLinha(linha)} className="border-b border-zinc-100">
              {colunas.map((coluna) => (
                <td key={coluna.chave} className="px-3 py-2">
                  {coluna.celula(linha)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {paginacao && (
        <div className="flex items-center justify-between text-sm">
          <span>
            Página {paginacao.page} de {totalPaginas}
          </span>
          <div className="flex gap-2">
            <Button
              variante="secundario"
              disabled={paginacao.page <= 1}
              onClick={() => paginacao.onMudarPagina(paginacao.page - 1)}
            >
              Anterior
            </Button>
            <Button
              variante="secundario"
              disabled={paginacao.page >= totalPaginas}
              onClick={() => paginacao.onMudarPagina(paginacao.page + 1)}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
