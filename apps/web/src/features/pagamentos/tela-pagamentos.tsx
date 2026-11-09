"use client";

import { useEffect, useState } from "react";
import { useUsuario } from "@/features/auth/usuario";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { type Coluna, Table } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { formatarData, formatarMoeda } from "@/lib/format";
import {
  cancelarPagamento,
  estaEmAberto,
  type FiltroPagamentos,
  listarPagamentos,
  type Pagamento,
  type PaginaPagamentos,
  podeGerirPagamentos,
  registrarPagamento,
  type StatusPagamento,
} from "./api";
import { BadgeStatusPagamento, OPCOES_STATUS_PAGAMENTO } from "./status-pagamento";

type Confirmacao = { acao: "pagar" | "cancelar"; pagamento: Pagamento };

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
  const { mostrar } = useToast();
  const [filtro, setFiltro] = useState<FiltroPagamentos>({ page: 1 });
  const [versao, setVersao] = useState(0);
  const [pagina, setPagina] = useState<PaginaPagamentos | null>(null);
  const [erroLista, setErroLista] = useState<string | null>(null);
  const [confirmar, setConfirmar] = useState<Confirmacao | null>(null);
  const [dataPagamento, setDataPagamento] = useState("");
  const [processando, setProcessando] = useState(false);

  useEffect(() => {
    let cancelado = false;
    listarPagamentos(filtro)
      .then((resultado) => {
        if (cancelado) return;
        // A página ficou vazia (ex.: deu baixa no último da página com o filtro Pendente):
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
  }, [filtro, versao]);

  function recarregar() {
    setVersao((v) => v + 1);
  }

  function abrirConfirmacao(acao: Confirmacao["acao"], pagamento: Pagamento) {
    setDataPagamento("");
    setConfirmar({ acao, pagamento });
  }

  async function aoConfirmar() {
    if (!confirmar) return;
    const alvo = confirmar;
    setProcessando(true);
    try {
      if (alvo.acao === "pagar") {
        await registrarPagamento(alvo.pagamento.id, dataPagamento || undefined);
      } else {
        await cancelarPagamento(alvo.pagamento.id);
      }
      mostrar(alvo.acao === "pagar" ? "Pagamento registrado." : "Pagamento cancelado.");
      recarregar();
    } catch (e) {
      mostrar((e as Error).message, "erro");
      // A linha pode ter mudado de estado (ex.: já paga por outra pessoa).
      recarregar();
    } finally {
      setProcessando(false);
      // Só fecha se a confirmação aberta ainda é a deste pedido.
      setConfirmar((atual) => (atual === alvo ? null : atual));
    }
  }

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
    {
      chave: "acoes",
      titulo: "Ações",
      celula: (p) =>
        estaEmAberto(p) ? (
          <div className="flex gap-2">
            <Button
              aria-label={`Registrar pagamento de ${p.membro.nome}`}
              onClick={() => abrirConfirmacao("pagar", p)}
            >
              Registrar pagamento
            </Button>
            <Button
              variante="perigo"
              aria-label={`Cancelar pagamento de ${p.membro.nome}`}
              onClick={() => abrirConfirmacao("cancelar", p)}
            >
              Cancelar
            </Button>
          </div>
        ) : null,
    },
  ];

  const pagando = confirmar?.acao === "pagar";
  const alvoDaConfirmacao = confirmar?.pagamento;

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

      <Dialog
        aberto={confirmar !== null}
        titulo={pagando ? "Registrar pagamento" : "Cancelar pagamento"}
        onFechar={() => setConfirmar(null)}
        acoes={
          <>
            <Button variante="secundario" onClick={() => setConfirmar(null)}>
              Voltar
            </Button>
            <Button
              variante={pagando ? "primario" : "perigo"}
              disabled={processando}
              onClick={aoConfirmar}
            >
              Confirmar
            </Button>
          </>
        }
      >
        {alvoDaConfirmacao && (
          <div className="flex flex-col gap-3">
            <p>
              {pagando ? "Confirmar o pagamento de" : "Cancelar o pagamento de"}{" "}
              {formatarMoeda(alvoDaConfirmacao.valor)} de {alvoDaConfirmacao.membro.nome}, com
              vencimento em {formatarData(alvoDaConfirmacao.dataVencimento)}?
            </p>
            {pagando && (
              <>
                <Input
                  rotulo="Data do pagamento"
                  type="date"
                  value={dataPagamento}
                  onChange={(e) => setDataPagamento(e.target.value)}
                />
                <p className="text-sm text-zinc-600">Em branco, vale a data de hoje.</p>
              </>
            )}
          </div>
        )}
      </Dialog>
    </div>
  );
}
