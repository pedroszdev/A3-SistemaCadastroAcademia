"use client";

import { useState } from "react";
import { useUsuario } from "@/features/auth/usuario";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { TabelaPaginada } from "@/components/ui/tabela-paginada";
import type { Coluna } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { formatarData, formatarMoeda } from "@/lib/format";
import { temAcessoFinanceiro } from "@/lib/menu";
import { useFormDialog } from "@/lib/use-form-dialog";
import { useListaPaginada } from "@/lib/use-lista-paginada";
import {
  cancelarPagamento,
  estaEmAberto,
  listarPagamentos,
  type Pagamento,
  registrarPagamento,
  type StatusPagamento,
} from "./api";
import { FormPagamento } from "./form-pagamento";
import { BadgeStatusPagamento, OPCOES_STATUS_PAGAMENTO } from "./status-pagamento";

type Confirmacao = { acao: "pagar" | "cancelar"; pagamento: Pagamento };

export function TelaPagamentos() {
  const usuario = useUsuario();

  if (!temAcessoFinanceiro(usuario)) {
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
  const { filtro, setFiltro, pagina, erro, recarregar } = useListaPaginada(listarPagamentos, {
    page: 1,
  });
  const [confirmar, setConfirmar] = useState<Confirmacao | null>(null);
  const [dataPagamento, setDataPagamento] = useState("");
  const [processando, setProcessando] = useState(false);
  const dialogForm = useFormDialog();

  function aoSalvar() {
    mostrar("Pagamento lançado.");
    dialogForm.concluir();
    recarregar();
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
        <Button className="ml-auto" onClick={() => dialogForm.abrir()}>
          Novo pagamento
        </Button>
      </div>

      <TabelaPaginada
        pagina={pagina}
        erro={erro}
        colunas={colunas}
        chaveDaLinha={(p) => p.id}
        vazio={<EmptyState titulo="Nenhum pagamento encontrado" />}
        onMudarPagina={(page) => setFiltro({ ...filtro, page })}
      />

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

      <Dialog aberto={dialogForm.form.aberto} titulo="Novo pagamento" onFechar={dialogForm.fechar}>
        <FormPagamento
          key={dialogForm.form.chave}
          onSalvo={aoSalvar}
          onCancelar={dialogForm.fechar}
          onEnviando={dialogForm.setOcupado}
        />
      </Dialog>
    </div>
  );
}
