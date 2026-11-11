"use client";

import { useCallback, useState } from "react";
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
import { useFormEmDialog, useListaPaginada } from "@/lib/use-lista-paginada";
import {
  cancelarPagamento,
  estaEmAberto,
  type FiltroPagamentos,
  listarPagamentos,
  type Pagamento,
  podeGerirPagamentos,
  registrarPagamento,
  type StatusPagamento,
} from "./api";
import { FormPagamento } from "./form-pagamento";
import { BadgeStatusPagamento, OPCOES_STATUS_PAGAMENTO } from "./status-pagamento";

type Confirmacao = { acao: "pagar" | "cancelar"; pagamento: Pagamento };

type TelaPagamentosProps = {
  // Na ficha do membro (WEB-Y4) a lista e o formulário ficam presos a esse membro.
  membroId?: string;
  // RN04: membro inativo não recebe novo pagamento (a API responde 422).
  membroInativo?: boolean;
  // Chamado depois de lançar, pagar ou cancelar, para a ficha atualizar a situação financeira.
  onAlterado?: () => void;
};

export function TelaPagamentos({
  membroId,
  membroInativo = false,
  onAlterado,
}: TelaPagamentosProps) {
  const usuario = useUsuario();

  if (!podeGerirPagamentos(usuario)) {
    return (
      <EmptyState
        titulo="Acesso restrito"
        descricao="Só o administrador e a recepção gerenciam pagamentos."
      />
    );
  }

  // "" conta como sem membro, igual a undefined.
  const membroFixo = membroId || undefined;

  // A key zera filtros, página e diálogos ao trocar de membro.
  return (
    <GestaoPagamentos
      key={membroFixo}
      membroFixo={membroFixo}
      membroInativo={membroInativo}
      onAlterado={onAlterado}
    />
  );
}

type GestaoPagamentosProps = {
  membroFixo: string | undefined;
  membroInativo: boolean;
  onAlterado?: () => void;
};

function GestaoPagamentos({ membroFixo, membroInativo, onAlterado }: GestaoPagamentosProps) {
  const { mostrar } = useToast();
  // O membro fixo entra no carregamento, não no filtro: nenhum setFiltro consegue perdê-lo.
  const carregar = useCallback(
    (filtro: FiltroPagamentos) =>
      listarPagamentos(membroFixo ? { ...filtro, membroId: membroFixo } : filtro),
    [membroFixo],
  );
  const { filtro, setFiltro, pagina, erro, recarregar } = useListaPaginada(carregar, { page: 1 });
  const [confirmar, setConfirmar] = useState<Confirmacao | null>(null);
  const [dataPagamento, setDataPagamento] = useState("");
  const [processando, setProcessando] = useState(false);
  const { form, abrir: abrirForm, fechar: fecharForm, fecharSeAinda } = useFormEmDialog();

  function atualizar() {
    recarregar();
    onAlterado?.();
  }

  function aoSalvar() {
    const { chave } = form;
    mostrar("Pagamento lançado.");
    fecharSeAinda(chave);
    atualizar();
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
      atualizar();
    } catch (e) {
      mostrar((e as Error).message, "erro");
      // A linha pode ter mudado de estado (ex.: já paga por outra pessoa).
      atualizar();
    } finally {
      setProcessando(false);
      // Só fecha se a confirmação aberta ainda é a deste pedido.
      setConfirmar((atual) => (atual === alvo ? null : atual));
    }
  }

  const colunaMembro: Coluna<Pagamento> = {
    chave: "membro",
    titulo: "Membro",
    celula: (p) => p.membro.nome,
  };

  // Na ficha toda linha é do mesmo membro: o nome não distingue os botões,
  // o valor e o vencimento sim.
  function descricao(p: Pagamento) {
    return membroFixo
      ? `${formatarMoeda(p.valor)} com vencimento em ${formatarData(p.dataVencimento)}`
      : p.membro.nome;
  }

  const colunas: Coluna<Pagamento>[] = [
    // Na ficha do membro a coluna Membro repetiria o mesmo nome em toda linha.
    ...(membroFixo ? [] : [colunaMembro]),
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
              aria-label={`Registrar pagamento de ${descricao(p)}`}
              onClick={() => abrirConfirmacao("pagar", p)}
            >
              Registrar pagamento
            </Button>
            <Button
              variante="perigo"
              aria-label={`Cancelar pagamento de ${descricao(p)}`}
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
        {membroInativo ? (
          <p className="ml-auto text-sm text-zinc-600">
            Membro inativo não recebe novo pagamento.
          </p>
        ) : (
          <Button className="ml-auto" onClick={abrirForm}>
            Novo pagamento
          </Button>
        )}
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

      <Dialog aberto={form.aberto} titulo="Novo pagamento" onFechar={fecharForm}>
        <FormPagamento
          key={form.chave}
          membroId={membroFixo}
          onSalvo={aoSalvar}
          onCancelar={fecharForm}
        />
      </Dialog>
    </div>
  );
}
