"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { TabelaPaginada } from "@/components/ui/tabela-paginada";
import type { Coluna } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { useUsuario } from "@/features/auth/usuario";
import { HistoricoDoMembro } from "@/features/historico/historico-do-membro";
import { PagamentosDoMembro } from "@/features/pagamentos/pagamentos-do-membro";
import { formatarData, mascaraCpf, mascaraTelefone } from "@/lib/format";
import { useFormDialog } from "@/lib/use-form-dialog";
import { useListaPaginada } from "@/lib/use-lista-paginada";
import {
  consultarResumo,
  desativarMembro,
  listarTreinosDoMembro,
  podeGerirMembros,
  reativarMembro,
  type ResumoMembro,
  type SituacaoFinanceira,
  type TreinoDoMembro,
} from "./api";
import { FormMembro } from "./form-membro";

type Aba = "treinos" | "pagamentos" | "historico";

const ABAS: { chave: Aba; rotulo: string }[] = [
  { chave: "treinos", rotulo: "Treinos" },
  { chave: "pagamentos", rotulo: "Pagamentos" },
  { chave: "historico", rotulo: "Histórico" },
];

const COLUNAS_TREINOS: Coluna<TreinoDoMembro>[] = [
  { chave: "tipo", titulo: "Tipo", celula: (t) => t.tipo },
  { chave: "duracao", titulo: "Duração", celula: (t) => `${t.duracao} min` },
  { chave: "inicio", titulo: "Início", celula: (t) => formatarData(t.dataInicio) },
];

type FichaMembroProps = { membroId: string };

export function FichaMembro({ membroId }: FichaMembroProps) {
  // A key zera o resumo, a aba e os diálogos ao trocar de membro.
  return <Ficha key={membroId} membroId={membroId} />;
}

function Ficha({ membroId }: FichaMembroProps) {
  const usuario = useUsuario();
  const { mostrar } = useToast();
  const [resumo, setResumo] = useState<ResumoMembro | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [versao, setVersao] = useState(0);
  const [aba, setAba] = useState<Aba>("treinos");
  const [confirmando, setConfirmando] = useState(false);
  const [processando, setProcessando] = useState(false);
  const dialogForm = useFormDialog();
  const { form } = dialogForm;

  useEffect(() => {
    let cancelado = false;
    consultarResumo(membroId)
      .then((recebido) => {
        if (cancelado) return;
        setResumo(recebido);
        setErro(null);
      })
      .catch((e: Error) => {
        if (!cancelado) setErro(e.message);
      });
    return () => {
      cancelado = true;
    };
  }, [membroId, versao]);

  // Passado às abas: depois de pagar, lançar ou registrar, o badge e o resumo se atualizam.
  function recarregar() {
    setVersao((v) => v + 1);
  }

  function aoSalvar() {
    mostrar("Membro atualizado.");
    dialogForm.concluir();
    recarregar();
  }

  async function aoConfirmar() {
    if (!resumo) return;
    const desativando = resumo.membro.ativo;
    setProcessando(true);
    try {
      if (desativando) {
        await desativarMembro(membroId);
      } else {
        await reativarMembro(membroId);
      }
      mostrar(desativando ? "Membro desativado." : "Membro reativado.");
      recarregar();
    } catch (e) {
      mostrar((e as Error).message, "erro");
    } finally {
      setProcessando(false);
      setConfirmando(false);
    }
  }

  const voltar = (
    <Link href="/membros" className="text-sm text-zinc-700 underline">
      Voltar para membros
    </Link>
  );

  if (!resumo) {
    return (
      <div className="flex flex-col gap-4">
        {voltar}
        {erro ? (
          <p role="alert" className="text-sm text-red-600">
            {erro}
          </p>
        ) : (
          <p className="text-sm text-zinc-600">Carregando…</p>
        )}
      </div>
    );
  }

  const { membro, situacaoFinanceira, treinoMaisRecente, atividadesUltimos30Dias } = resumo;
  const gere = podeGerirMembros(usuario);

  return (
    <div className="flex flex-col gap-6">
      {voltar}
      {erro && (
        <p role="alert" className="text-sm text-red-600">
          {erro}
        </p>
      )}

      <section aria-label="Dados do membro" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-semibold text-zinc-900">{membro.nome}</h2>
          <StatusBadge status={membro.ativo ? "ATIVO" : "INATIVO"} />
          {situacaoFinanceira && <BadgeSituacaoFinanceira situacao={situacaoFinanceira} />}
          {/* WEB-G6: o AcessoDoMembro (liberar, redefinir e revogar acesso) entra aqui. */}
          {gere && (
            <div className="ml-auto flex gap-2">
              <Button variante="secundario" onClick={() => dialogForm.abrir()}>
                Editar
              </Button>
              <Button
                variante={membro.ativo ? "perigo" : "secundario"}
                onClick={() => setConfirmando(true)}
              >
                {membro.ativo ? "Desativar" : "Reativar"}
              </Button>
            </div>
          )}
        </div>

        <dl className="grid grid-cols-1 gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
          <Dado rotulo="CPF" valor={mascaraCpf(membro.cpf)} />
          <Dado rotulo="Telefone" valor={mascaraTelefone(membro.telefone)} />
          <Dado rotulo="Endereço" valor={membro.endereco} />
          <Dado rotulo="Cadastrado em" valor={formatarData(membro.dataCadastro)} />
          <Dado
            rotulo="Treino mais recente"
            valor={
              treinoMaisRecente
                ? `${treinoMaisRecente.tipo} · ${treinoMaisRecente.duracao} min · início em ${formatarData(treinoMaisRecente.dataInicio)}`
                : "Nenhum treino cadastrado"
            }
          />
          <Dado rotulo="Atividades nos últimos 30 dias" valor={String(atividadesUltimos30Dias)} />
        </dl>
      </section>

      <section className="flex flex-col gap-4">
        <div
          role="tablist"
          aria-label="Seções da ficha"
          className="flex gap-2 border-b border-zinc-200"
          onKeyDown={(evento) => {
            // Padrão WAI-ARIA de abas: setas trocam de aba e levam o foco junto.
            if (evento.key !== "ArrowRight" && evento.key !== "ArrowLeft") return;
            evento.preventDefault();
            const atual = ABAS.findIndex(({ chave }) => chave === aba);
            const passo = evento.key === "ArrowRight" ? 1 : -1;
            const proxima = ABAS[(atual + passo + ABAS.length) % ABAS.length].chave;
            setAba(proxima);
            document.getElementById(`aba-${proxima}`)?.focus();
          }}
        >
          {ABAS.map(({ chave, rotulo }) => (
            <button
              key={chave}
              type="button"
              role="tab"
              id={`aba-${chave}`}
              aria-selected={aba === chave}
              aria-controls="painel-aba"
              tabIndex={aba === chave ? 0 : -1}
              onClick={() => setAba(chave)}
              className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${
                aba === chave
                  ? "border-zinc-900 text-zinc-900"
                  : "border-transparent text-zinc-600 hover:text-zinc-900"
              }`}
            >
              {rotulo}
            </button>
          ))}
        </div>

        <div role="tabpanel" id="painel-aba" aria-labelledby={`aba-${aba}`}>
          {aba === "treinos" && <TreinosDoMembro membroId={membroId} />}
          {aba === "pagamentos" && (
            <PagamentosDoMembro membroId={membroId} ativo={membro.ativo} onAlterado={recarregar} />
          )}
          {aba === "historico" && (
            <HistoricoDoMembro membroId={membroId} ativo={membro.ativo} onAlterado={recarregar} />
          )}
        </div>
      </section>

      <Dialog aberto={form.aberto} titulo="Editar membro" onFechar={dialogForm.fechar}>
        <FormMembro
          key={form.chave}
          membro={membro}
          onSalvo={aoSalvar}
          onCancelar={dialogForm.fechar}
          onEnviando={dialogForm.setOcupado}
        />
      </Dialog>

      <Dialog
        aberto={confirmando}
        titulo={membro.ativo ? "Desativar membro" : "Reativar membro"}
        onFechar={() => setConfirmando(false)}
        acoes={
          <>
            <Button variante="secundario" onClick={() => setConfirmando(false)}>
              Cancelar
            </Button>
            <Button
              variante={membro.ativo ? "perigo" : "primario"}
              disabled={processando}
              onClick={aoConfirmar}
            >
              Confirmar
            </Button>
          </>
        }
      >
        <p>
          Deseja {membro.ativo ? "desativar" : "reativar"} {membro.nome}?
        </p>
      </Dialog>
    </div>
  );
}

function Dado({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex gap-2">
      <dt className="font-medium text-zinc-800">{rotulo}:</dt>
      <dd className="text-zinc-700">{valor}</dd>
    </div>
  );
}

function BadgeSituacaoFinanceira({ situacao }: { situacao: SituacaoFinanceira }) {
  if (situacao.situacao === "EM_DIA") return <StatusBadge status="PAGO" rotulo="Em dia" />;
  return (
    <StatusBadge
      status="ATRASADO"
      rotulo={`Inadimplente · ${situacao.pagamentosAtrasados} em atraso (até ${situacao.maiorAtrasoDias} dias)`}
    />
  );
}

// Aba Treinos: só leitura. Criar e editar treino é da tela /treinos (WEB-G4).
function TreinosDoMembro({ membroId }: { membroId: string }) {
  const { setFiltro, filtro, pagina, erro } = useListaPaginada(
    (f: { page: number }) => listarTreinosDoMembro(membroId, f),
    { page: 1 },
  );

  return (
    <TabelaPaginada
      pagina={pagina}
      erro={erro}
      colunas={COLUNAS_TREINOS}
      chaveDaLinha={(t) => t.id}
      vazio={<EmptyState titulo="Nenhum treino cadastrado" />}
      onMudarPagina={(page) => setFiltro({ ...filtro, page })}
    />
  );
}
