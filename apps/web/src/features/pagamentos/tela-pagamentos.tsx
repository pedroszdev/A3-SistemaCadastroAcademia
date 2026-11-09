"use client";

import { useEffect, useState } from "react";
import { useUsuario } from "@/features/auth/usuario";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { type Coluna, Table } from "@/components/ui/table";
import { formatarData, formatarMoeda } from "@/lib/format";
import {
  type FiltroPagamentos,
  listarPagamentos,
  type Pagamento,
  type PaginaPagamentos,
  podeGerirPagamentos,
  type StatusPagamento,
} from "./api";
import { BadgeStatusPagamento, OPCOES_STATUS_PAGAMENTO } from "./status-pagamento";

export function TelaPagamentos() {
  const usuario = useUsuario();

  if (!podeGerirPagamentos(usuario)) {
    return (
      <EmptyState
        titulo="Acesso restrito"
        descricao="Só o administrador e a recepção gerenciam pagamentos."
      />
    );
  }

  return <GestaoPagamentos />;
}

function GestaoPagamentos() {
  const [filtro, setFiltro] = useState<FiltroPagamentos>({ page: 1 });
  const [pagina, setPagina] = useState<PaginaPagamentos | null>(null);
  const [erroLista, setErroLista] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    listarPagamentos(filtro)
      .then((resultado) => {
        if (cancelado) return;
        // A página ficou vazia (ex.: registros mudaram entre uma página e outra):
        // volta para a última página que ainda tem registros.
        const ultimaPagina = Math.max(1, Math.ceil(resultado.total / resultado.pageSize));
        if (resultado.data.length === 0 && filtro.page > ultimaPagina) {
          setFiltro((atual) => ({ ...atual, page: ultimaPagina }));
          return;
        }
        setPagina(resultado);
        setErroLista(null);
      })
      .catch((e: Error) => {
        if (cancelado) return;
        // Sem a página antiga, a tabela não mostra linhas que não batem com o filtro.
        setPagina(null);
        setErroLista(e.message);
      });
    return () => {
      cancelado = true;
    };
  }, [filtro]);

  const colunas: Coluna<Pagamento>[] = [
    { chave: "membro", titulo: "Membro", celula: (p) => p.membro.nome },
    { chave: "valor", titulo: "Valor", celula: (p) => formatarMoeda(p.valor) },
    { chave: "vencimento", titulo: "Vencimento", celula: (p) => formatarData(p.dataVencimento) },
    {
      chave: "pagamento",
      titulo: "Pagamento",
      celula: (p) => (p.dataPagamento ? formatarData(p.dataPagamento) : "—"),
    },
    { chave: "status", titulo: "Status", celula: (p) => <BadgeStatusPagamento pagamento={p} /> },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-4">
        <Select
          rotulo="Status"
          placeholder="Todos"
          opcoes={OPCOES_STATUS_PAGAMENTO}
          value={filtro.status ?? ""}
          onChange={(e) =>
            setFiltro({
              ...filtro,
              status: (e.target.value || undefined) as StatusPagamento | undefined,
              page: 1,
            })
          }
        />
        <Input
          rotulo="Vencimento de"
          type="date"
          value={filtro.vencimentoDe ?? ""}
          max={filtro.vencimentoAte}
          onChange={(e) => setFiltro({ ...filtro, vencimentoDe: e.target.value || undefined, page: 1 })}
        />
        <Input
          rotulo="Vencimento até"
          type="date"
          value={filtro.vencimentoAte ?? ""}
          min={filtro.vencimentoDe}
          onChange={(e) => setFiltro({ ...filtro, vencimentoAte: e.target.value || undefined, page: 1 })}
        />
      </div>

      {erroLista && (
        <p role="alert" className="text-sm text-red-600">
          {erroLista}
        </p>
      )}

      {!pagina && !erroLista ? (
        <p className="text-sm text-zinc-600">Carregando…</p>
      ) : (
        pagina && (
          <Table
            colunas={colunas}
            linhas={pagina.data}
            chaveDaLinha={(p) => p.id}
            paginacao={{
              page: pagina.page,
              pageSize: pagina.pageSize,
              total: pagina.total,
              onMudarPagina: (page) => setFiltro({ ...filtro, page }),
            }}
            vazio={<EmptyState titulo="Nenhum pagamento encontrado" />}
          />
        )
      )}
    </div>
  );
}
