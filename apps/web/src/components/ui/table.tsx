import type { ReactNode } from "react";
import { BotaoIcone } from "./botao-icone";
import { EmptyState } from "./empty-state";

export type Coluna<T> = {
  chave: string;
  titulo: string;
  celula: (linha: T) => ReactNode;
  // Coluna de botões: título só para leitor de tela e conteúdo alinhado à direita.
  acoes?: boolean;
  // Conteúdo curto (ex.: marcas de sim/não) centralizado na coluna.
  centralizar?: boolean;
};

function alinhamento<T>(coluna: Coluna<T>): string {
  if (coluna.acoes) return "text-right";
  return coluna.centralizar ? "text-center" : "";
}

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
  // Nome dos itens no rodapé: "Mostrando 1–10 de 32 membros".
  rotuloItens?: string;
  // false: sem a borda e o fundo do cartão, para a tabela que já fica dentro de um Cartao.
  moldura?: boolean;
};

function Rodape({
  paginacao,
  quantidade,
  rotuloItens,
}: {
  paginacao: Paginacao;
  quantidade: number;
  rotuloItens: string;
}) {
  const { page, pageSize, total, onMudarPagina } = paginacao;
  const totalPaginas = Math.max(1, Math.ceil(total / pageSize));
  const primeiro = (page - 1) * pageSize + 1;
  const ultimo = primeiro + quantidade - 1;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-borda px-4 py-3.5">
      <p className="text-[13px] text-suave">
        {quantidade > 0
          ? `Mostrando ${primeiro}–${ultimo} de ${total} ${rotuloItens}`
          : `Nenhum item nesta página (${total} ${rotuloItens} no total)`}
      </p>
      <div className="flex items-center gap-1.5">
        <BotaoIcone
          icone="anterior"
          rotulo="Anterior"
          disabled={page <= 1}
          onClick={() => onMudarPagina(page - 1)}
        />
        <span className="sr-only">
          Página {page} de {totalPaginas}
        </span>
        <span
          aria-hidden="true"
          className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg bg-tinta px-2 text-[13px] font-semibold text-white"
        >
          {page}
        </span>
        <BotaoIcone
          icone="proximo"
          rotulo="Próxima"
          disabled={page >= totalPaginas}
          onClick={() => onMudarPagina(page + 1)}
        />
      </div>
    </div>
  );
}

export function Table<T>({
  colunas,
  linhas,
  chaveDaLinha,
  paginacao,
  vazio,
  rotuloItens = "registros",
  moldura = true,
}: TableProps<T>) {
  const rodape = paginacao && (
    <Rodape paginacao={paginacao} quantidade={linhas.length} rotuloItens={rotuloItens} />
  );
  const classesMoldura = moldura ? "overflow-hidden rounded-2xl border border-borda bg-white" : "";

  if (linhas.length === 0) {
    const estadoVazio = vazio ?? <EmptyState titulo="Nenhum registro encontrado" />;
    // Numa página vazia depois da primeira, o rodapé fica para o usuário voltar.
    const mostrarRodape = paginacao && paginacao.page > 1;
    return (
      <div className={classesMoldura}>
        {estadoVazio}
        {mostrarRodape && rodape}
      </div>
    );
  }

  return (
    <div className={classesMoldura}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr>
              {colunas.map((coluna) => (
                <th
                  key={coluna.chave}
                  className={`whitespace-nowrap border-b border-borda bg-cabecalho px-4 py-3 text-xs font-semibold tracking-[0.04em] text-suave uppercase ${alinhamento(coluna)}`}
                >
                  {coluna.acoes ? <span className="sr-only">{coluna.titulo}</span> : coluna.titulo}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {linhas.map((linha) => (
              <tr key={chaveDaLinha(linha)} className="border-b border-borda last:border-b-0">
                {colunas.map((coluna) => (
                  <td
                    key={coluna.chave}
                    className={`px-4 py-3.5 align-middle text-sm text-tinta ${alinhamento(coluna)}`}
                  >
                    {coluna.celula(linha)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rodape}
    </div>
  );
}

// Grupo de botões da coluna de ações, alinhado à direita.
export function AcoesDaLinha({ children }: { children: ReactNode }) {
  return <div className="flex justify-end gap-1.5">{children}</div>;
}
