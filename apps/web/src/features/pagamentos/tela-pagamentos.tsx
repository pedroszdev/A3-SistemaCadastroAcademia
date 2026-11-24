"use client";

import { type ReactNode, useState } from "react";
import { CabecalhoPagina } from "@/components/layout/cabecalho-pagina";
import { useUsuario } from "@/features/auth/usuario";
import { Pessoa } from "@/components/ui/avatar";
import { BotaoIcone } from "@/components/ui/botao-icone";
import { Button } from "@/components/ui/button";
import { DuasColunas } from "@/components/ui/cartao";
import { Dialog, PainelLateral } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { BarraDeFiltros, FiltroChips } from "@/components/ui/filtro-chips";
import { Icone } from "@/components/ui/icone";
import { Input } from "@/components/ui/input";
import { TabelaPaginada } from "@/components/ui/tabela-paginada";
import { AcoesDaLinha, type Coluna } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { formatarData, formatarMoeda } from "@/lib/format";
import { temAcessoFinanceiro } from "@/lib/menu";
import { useFormDialog } from "@/lib/use-form-dialog";
import { useListaPaginada } from "@/lib/use-lista-paginada";
import {
  cancelarPagamento,
  estaEmAberto,
  type FiltroPagamentos,
  listarPagamentos,
  type MembroBusca,
  type Pagamento,
  registrarPagamento,
} from "./api";
import { BuscaMembro } from "./busca-membro";
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
  // Na página /pagamentos o cabeçalho (com o botão Novo pagamento) vem daqui.
  cabecalho?: { titulo: string; descricao?: string };
};

export function TelaPagamentos({
  membroId,
  membroInativo = false,
  onAlterado,
  cabecalho,
}: TelaPagamentosProps) {
  const usuario = useUsuario();

  if (!temAcessoFinanceiro(usuario)) {
    return (
      <>
        {cabecalho && <CabecalhoPagina {...cabecalho} />}
        <EmptyState
          titulo="Acesso restrito"
          descricao="Só o administrador e a recepção gerenciam pagamentos."
        />
      </>
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
      cabecalho={cabecalho}
    />
  );
}

type GestaoPagamentosProps = {
  membroFixo: string | undefined;
  membroInativo: boolean;
  onAlterado?: () => void;
  cabecalho?: TelaPagamentosProps["cabecalho"];
};

function GestaoPagamentos({
  membroFixo,
  membroInativo,
  onAlterado,
  cabecalho,
}: GestaoPagamentosProps) {
  const { mostrar } = useToast();
  // O membro fixo entra no carregamento, não no filtro: nenhum setFiltro consegue perdê-lo.
  const { filtro, setFiltro, pagina, erro, recarregar } = useListaPaginada(
    (f: FiltroPagamentos) => listarPagamentos(membroFixo ? { ...f, membroId: membroFixo } : f),
    { page: 1 },
  );
  const [confirmar, setConfirmar] = useState<Confirmacao | null>(null);
  const [dataPagamento, setDataPagamento] = useState("");
  const [processando, setProcessando] = useState(false);
  const [membroFiltro, setMembroFiltro] = useState<MembroBusca | null>(null);
  const dialogForm = useFormDialog();

  function aoEscolherMembro(membro: MembroBusca | null) {
    setMembroFiltro(membro);
    setFiltro({ ...filtro, membroId: membro?.id, page: 1 });
  }

  function atualizar() {
    recarregar();
    onAlterado?.();
  }

  function aoSalvar() {
    mostrar("Pagamento lançado.");
    dialogForm.concluir();
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
    celula: (p) => <Pessoa nome={p.membro.nome} />,
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
    {
      chave: "valor",
      titulo: "Valor",
      celula: (p) => <span className="font-semibold tabular-nums">{formatarMoeda(p.valor)}</span>,
    },
    { chave: "vencimento", titulo: "Vencimento", celula: (p) => formatarData(p.dataVencimento) },
    {
      chave: "pagamento",
      titulo: "Pago em",
      celula: (p) => (p.dataPagamento ? formatarData(p.dataPagamento) : "—"),
    },
    { chave: "status", titulo: "Status", celula: (p) => <BadgeStatusPagamento pagamento={p} /> },
    {
      chave: "acoes",
      titulo: "Ações",
      acoes: true,
      celula: (p) =>
        estaEmAberto(p) ? (
          <AcoesDaLinha>
            <Button
              variante="escuro"
              tamanho="pequeno"
              aria-label={`Registrar pagamento de ${descricao(p)}`}
              onClick={() => abrirConfirmacao("pagar", p)}
            >
              Dar baixa
            </Button>
            <BotaoIcone
              icone="energia"
              tom="alerta"
              rotulo={`Cancelar pagamento de ${descricao(p)}`}
              onClick={() => abrirConfirmacao("cancelar", p)}
            />
          </AcoesDaLinha>
        ) : null,
    },
  ];

  const pagando = confirmar?.acao === "pagar";
  const alvoDaConfirmacao = confirmar?.pagamento;

  const botaoNovo: ReactNode = membroInativo ? (
    <p className="text-sm text-suave">Membro inativo não recebe novo pagamento.</p>
  ) : (
    <Button onClick={() => dialogForm.abrir()}>
      <Icone nome="mais" tamanho={16} />
      Novo pagamento
    </Button>
  );

  return (
    <div className="flex flex-col gap-6">
      {cabecalho && <CabecalhoPagina {...cabecalho} acoes={botaoNovo} />}

      <BarraDeFiltros>
        {!membroFixo && (
          <div className="max-w-[420px] flex-[1_1_320px]">
            <BuscaMembro
              incluirInativos
              rotuloOculto
              rotulo="Buscar membro"
              placeholder="Buscar membro"
              selecionado={membroFiltro}
              onSelecionar={aoEscolherMembro}
            />
          </div>
        )}
        <FiltroChips
          rotulo="Status"
          opcoes={OPCOES_STATUS_PAGAMENTO}
          valor={filtro.status}
          onMudar={(status) => setFiltro({ ...filtro, status, page: 1 })}
        />
      </BarraDeFiltros>

      <div className="flex flex-wrap items-end gap-4">
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
        {!cabecalho && <div className="ml-auto">{botaoNovo}</div>}
      </div>

      <DuasColunas
        principal={
          <TabelaPaginada
            pagina={pagina}
            erro={erro}
            colunas={colunas}
            chaveDaLinha={(p) => p.id}
            rotuloItens="pagamentos"
            vazio={<EmptyState titulo="Nenhum pagamento encontrado" />}
            onMudarPagina={(page) => setFiltro({ ...filtro, page })}
          />
        }
        lateral={
          dialogForm.form.aberto && (
            <PainelLateral
              aberto
              titulo="Novo pagamento"
              descricao="Lance uma mensalidade. O status começa como Pendente."
              onFechar={dialogForm.fechar}
            >
              <FormPagamento
                key={dialogForm.form.chave}
                membroId={membroFixo}
                onSalvo={aoSalvar}
                onCancelar={dialogForm.fechar}
                onEnviando={dialogForm.setOcupado}
              />
            </PainelLateral>
          )
        }
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
                <p className="text-[13px] text-suave">Em branco, vale a data de hoje.</p>
              </>
            )}
          </div>
        )}
      </Dialog>

    </div>
  );
}
