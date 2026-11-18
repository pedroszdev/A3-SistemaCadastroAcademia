"use client";

import Link from "next/link";
import { type KeyboardEvent, type ReactNode, useEffect, useId, useRef, useState } from "react";
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
import { listarTreinos, type Treino } from "@/features/treinos/api";
import { ApiError } from "@/lib/api";
import { formatarData, mascaraCpf, mascaraTelefone } from "@/lib/format";
import { temAcessoFinanceiro } from "@/lib/menu";
import { useListaPaginada } from "@/lib/use-lista-paginada";
import { AcessoDoMembro } from "./acesso-do-membro";
import {
  buscarMembro,
  consultarResumo,
  desativarMembro,
  type Membro,
  reativarMembro,
  type SituacaoFinanceira,
} from "./api";
import { podeGerenciarMembros } from "./permissoes";

// Mesmas classes do Button (components/ui/button.tsx), para o link ter a cara de botão.
const LINK_SECUNDARIO =
  "rounded px-4 py-2 text-sm font-medium border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-100";

// O instrutor não consulta a situação financeira nem as atividades (matriz 4.2): para ele
// esses dois campos ficam nulos e o cabeçalho não os mostra.
type DadosDaFicha = {
  membro: Membro;
  treinoMaisRecente: Treino | null;
  situacao: SituacaoFinanceira | null;
  atividades: number | null;
};

type Carga =
  | { tipo: "carregando" }
  | { tipo: "carregado"; dados: DadosDaFicha }
  | { tipo: "nao-encontrado" }
  | { tipo: "erro"; mensagem: string };

const PASSO_DA_SETA: Partial<Record<string, number>> = { ArrowRight: 1, ArrowLeft: -1 };

type Confirmacao = "desativar" | "reativar";

const ABAS = ["Treinos", "Pagamentos", "Histórico"] as const;
type Aba = (typeof ABAS)[number];

// Pagamentos é só do ADMIN e da RECEPCIONISTA (matriz 4.2): para o INSTRUTOR a aba nem aparece.
const ABAS_SEM_FINANCEIRO: readonly Aba[] = ABAS.filter((aba) => aba !== "Pagamentos");

async function carregarFicha(id: string, comResumo: boolean): Promise<DadosDaFicha> {
  if (comResumo) {
    const resumo = await consultarResumo(id);
    return {
      membro: resumo.membro,
      treinoMaisRecente: resumo.treinoMaisRecente,
      situacao: resumo.situacaoFinanceira,
      atividades: resumo.atividadesUltimos30Dias,
    };
  }
  // A API devolve os treinos do mais recente para o mais antigo.
  const [membro, treinos] = await Promise.all([
    buscarMembro(id),
    listarTreinos({ membroId: id, page: 1 }),
  ]);
  return { membro, treinoMaisRecente: treinos.data[0] ?? null, situacao: null, atividades: null };
}

function plural(quantidade: number, singular: string, pluralDe: string): string {
  return `${quantidade} ${quantidade === 1 ? singular : pluralDe}`;
}

export function FichaMembro({ id }: { id: string }) {
  return <FichaCarregada key={id} id={id} />;
}

function FichaCarregada({ id }: { id: string }) {
  const comResumo = podeGerenciarMembros(useUsuario());
  const [carga, setCarga] = useState<Carga>({ tipo: "carregando" });
  const [versao, setVersao] = useState(0);

  useEffect(() => {
    let ativo = true;
    carregarFicha(id, comResumo).then(
      (dados) => {
        if (ativo) setCarga({ tipo: "carregado", dados });
      },
      (e: unknown) => {
        if (!ativo) return;
        // O id que não é UUID dá 400 no ParseUUIDPipe da API: para quem abriu o
        // link, é o mesmo que um membro inexistente.
        setCarga(
          e instanceof ApiError && (e.status === 404 || e.status === 400)
            ? { tipo: "nao-encontrado" }
            : { tipo: "erro", mensagem: (e as Error).message },
        );
      },
    );
    return () => {
      ativo = false;
    };
  }, [id, comResumo, versao]);

  // Recarregar não volta para "Carregando…": a ficha antiga fica na tela até a nova chegar.
  function recarregar() {
    setVersao((v) => v + 1);
  }

  switch (carga.tipo) {
    case "carregando":
      return <p className="text-sm text-zinc-600">Carregando…</p>;
    case "nao-encontrado":
      return (
        <EmptyState
          titulo="Membro não encontrado"
          acao={
            <Link href="/membros" className={LINK_SECUNDARIO}>
              Voltar para membros
            </Link>
          }
        />
      );
    case "erro":
      return (
        <div className="flex flex-col items-start gap-3">
          <p role="alert" className="text-sm text-red-600">
            {carga.mensagem}
          </p>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setCarga({ tipo: "carregando" });
                recarregar();
              }}
            >
              Tentar de novo
            </Button>
            <Link href="/membros" className={LINK_SECUNDARIO}>
              Voltar para membros
            </Link>
          </div>
        </div>
      );
    case "carregado":
      return <ConteudoDaFicha id={id} dados={carga.dados} recarregar={recarregar} />;
  }
}

type ConteudoDaFichaProps = { id: string; dados: DadosDaFicha; recarregar: () => void };

function ConteudoDaFicha({ id, dados, recarregar }: ConteudoDaFichaProps) {
  const abas = temAcessoFinanceiro(useUsuario()) ? ABAS : ABAS_SEM_FINANCEIRO;
  const [aba, setAba] = useState<Aba>("Treinos");

  return (
    <div className="flex flex-col gap-6">
      <CabecalhoDaFicha id={id} dados={dados} recarregar={recarregar} />
      <Abas
        abas={abas}
        aba={aba}
        onMudar={setAba}
        painel={
          <>
            {aba === "Treinos" && <TreinosDoMembro membroId={id} />}
            {aba === "Pagamentos" && (
              <PagamentosDoMembro
                membroId={id}
                ativo={dados.membro.ativo}
                onAlterado={recarregar}
              />
            )}
            {aba === "Histórico" && (
              <HistoricoDoMembro membroId={id} ativo={dados.membro.ativo} onAlterado={recarregar} />
            )}
          </>
        }
      />
    </div>
  );
}

function CabecalhoDaFicha({ id, dados, recarregar }: ConteudoDaFichaProps) {
  const { membro, treinoMaisRecente, situacao, atividades } = dados;
  const podeGerenciar = podeGerenciarMembros(useUsuario());
  const { mostrar } = useToast();
  const [confirmar, setConfirmar] = useState<Confirmacao | null>(null);
  const [processando, setProcessando] = useState(false);

  async function aoConfirmar() {
    if (!confirmar) return;
    const desativando = confirmar === "desativar";
    setProcessando(true);
    try {
      await (desativando ? desativarMembro(id) : reativarMembro(id));
      mostrar(desativando ? "Membro desativado." : "Membro reativado.");
      recarregar();
    } catch (e) {
      mostrar((e as Error).message, "erro");
    } finally {
      setProcessando(false);
      setConfirmar(null);
    }
  }

  // Durante o PATCH a confirmação não fecha: senão dava para reabri-la e o fim do pedido
  // antigo fecharia a nova.
  function fecharConfirmacao() {
    if (!processando) setConfirmar(null);
  }

  return (
    <section aria-label="Dados do membro" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold text-zinc-900">{membro.nome}</h2>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={membro.ativo ? "ATIVO" : "INATIVO"} />
            {situacao && (
              <StatusBadge
                status={situacao.situacao === "INADIMPLENTE" ? "ATRASADO" : "PAGO"}
                rotulo={situacao.situacao === "INADIMPLENTE" ? "Inadimplente" : "Em dia"}
              />
            )}
            {situacao && situacao.pagamentosAtrasados > 0 && (
              <span className="text-sm text-zinc-600">
                {situacao.pagamentosAtrasados} em atraso, maior atraso de{" "}
                {plural(situacao.maiorAtrasoDias, "dia", "dias")}
              </span>
            )}
          </div>
        </div>

        {podeGerenciar && (
          <div className="flex flex-wrap gap-2">
            <Link href={`/membros/${encodeURIComponent(id)}/editar`} className={LINK_SECUNDARIO}>
              Editar
            </Link>
            {membro.ativo ? (
              <Button variante="perigo" onClick={() => setConfirmar("desativar")}>
                Desativar
              </Button>
            ) : (
              <Button onClick={() => setConfirmar("reativar")}>Reativar</Button>
            )}
          </div>
        )}
      </div>

      <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        <Dado rotulo="CPF" valor={mascaraCpf(membro.cpf)} />
        <Dado rotulo="Telefone" valor={mascaraTelefone(membro.telefone)} />
        <Dado rotulo="Endereço" valor={membro.endereco} />
        <Dado rotulo="Cadastro em" valor={formatarData(membro.dataCadastro)} />
        <Dado
          rotulo="Treino mais recente"
          valor={
            treinoMaisRecente
              ? `${treinoMaisRecente.tipo}, ${treinoMaisRecente.duracao} min, início em ${formatarData(treinoMaisRecente.dataInicio)}`
              : "Nenhum treino"
          }
        />
        {atividades !== null && (
          <Dado
            rotulo="Atividades"
            valor={`${plural(atividades, "atividade", "atividades")} nos últimos 30 dias`}
          />
        )}
      </dl>

      <AcessoDoMembro
        membroId={id}
        ativo={membro.ativo}
        acessoLiberado={membro.acessoLiberado}
        onAlterado={recarregar}
      />

      <Dialog
        aberto={confirmar !== null}
        titulo={confirmar === "reativar" ? "Reativar membro" : "Desativar membro"}
        onFechar={fecharConfirmacao}
        acoes={
          <>
            <Button variante="secundario" disabled={processando} onClick={fecharConfirmacao}>
              Cancelar
            </Button>
            <Button
              variante={confirmar === "reativar" ? "primario" : "perigo"}
              disabled={processando}
              onClick={aoConfirmar}
            >
              Confirmar
            </Button>
          </>
        }
      >
        {confirmar === "reativar" ? (
          <p>
            Reativar {membro.nome}? O membro volta a poder receber pagamentos, registrar atividades
            e, se o acesso estiver liberado, entrar no portal.
          </p>
        ) : (
          <p>
            Desativar {membro.nome}? O membro deixa de receber novos pagamentos, atividades e acesso
            ao portal. O histórico continua salvo e dá para reativar depois.
          </p>
        )}
      </Dialog>
    </section>
  );
}

function Dado({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex flex-col">
      <dt className="text-zinc-600">{rotulo}</dt>
      <dd className="text-zinc-900">{valor}</dd>
    </div>
  );
}

type AbasProps = {
  abas: readonly Aba[];
  aba: Aba;
  onMudar: (aba: Aba) => void;
  painel: ReactNode;
};

// WAI-ARIA tabs: só a aba ativa entra na ordem de Tab; as setas trocam de aba e levam o foco.
function Abas({ abas, aba, onMudar, painel }: AbasProps) {
  const prefixo = useId();
  const botoes = useRef<Array<HTMLButtonElement | null>>([]);
  const idDaAba = (nome: Aba) => `${prefixo}-aba-${nome}`;
  const idDoPainel = `${prefixo}-painel`;

  function aoPressionar(evento: KeyboardEvent<HTMLButtonElement>, indice: number) {
    const passo = PASSO_DA_SETA[evento.key];
    if (passo === undefined) return;
    evento.preventDefault();
    const proximo = (indice + passo + abas.length) % abas.length;
    onMudar(abas[proximo]);
    botoes.current[proximo]?.focus();
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        role="tablist"
        aria-label="Seções da ficha"
        className="flex gap-1 border-b border-zinc-200"
      >
        {abas.map((nome, indice) => {
          const selecionada = nome === aba;
          return (
            <button
              key={nome}
              ref={(el) => {
                botoes.current[indice] = el;
              }}
              id={idDaAba(nome)}
              type="button"
              role="tab"
              aria-selected={selecionada}
              aria-controls={selecionada ? idDoPainel : undefined}
              tabIndex={selecionada ? 0 : -1}
              onClick={() => onMudar(nome)}
              onKeyDown={(e) => aoPressionar(e, indice)}
              className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${
                selecionada
                  ? "border-zinc-900 text-zinc-900"
                  : "border-transparent text-zinc-600 hover:text-zinc-900"
              }`}
            >
              {nome}
            </button>
          );
        })}
      </div>
      <div role="tabpanel" id={idDoPainel} aria-labelledby={idDaAba(aba)}>
        {painel}
      </div>
    </div>
  );
}

const colunasDeTreinos: Coluna<Treino>[] = [
  { chave: "tipo", titulo: "Tipo", celula: (t) => t.tipo },
  { chave: "duracao", titulo: "Duração", celula: (t) => `${t.duracao} min` },
  { chave: "inicio", titulo: "Início", celula: (t) => formatarData(t.dataInicio) },
];

// Só leitura: criar e editar treino continua em /treinos.
function TreinosDoMembro({ membroId }: { membroId: string }) {
  const { filtro, setFiltro, pagina, erro } = useListaPaginada(
    (f: { page: number }) => listarTreinos({ ...f, membroId }),
    { page: 1 },
  );

  return (
    <TabelaPaginada
      pagina={pagina}
      erro={erro}
      colunas={colunasDeTreinos}
      chaveDaLinha={(t) => t.id}
      vazio={<EmptyState titulo="Nenhum treino cadastrado" />}
      onMudarPagina={(page) => setFiltro({ ...filtro, page })}
    />
  );
}
