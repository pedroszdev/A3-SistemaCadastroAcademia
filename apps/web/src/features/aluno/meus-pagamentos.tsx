"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FiltroChips } from "@/components/ui/filtro-chips";
import { Icone } from "@/components/ui/icone";
import type { Pagamento, StatusPagamento } from "@/features/pagamentos/api";
import {
  BadgeStatusPagamento,
  OPCOES_STATUS_PAGAMENTO,
} from "@/features/pagamentos/status-pagamento";
import { formatarData, formatarMoeda } from "@/lib/format";
import {
  buscarResumoDosPagamentos,
  listarMeusPagamentos,
  type ResumoDosPagamentos,
} from "./pagamentos";

type Lista = {
  pagamentos: Pagamento[];
  total: number;
  page: number;
  carregandoMais: boolean;
  erroMais: string | null;
};

type Estado =
  | { situacao: "carregando" }
  | { situacao: "erro"; mensagem: string }
  | { situacao: "pronto"; lista: Lista };

function plural(n: number, singular: string, pluralDe: string) {
  return `${n} ${n === 1 ? singular : pluralDe}`;
}

// O aviso do topo: em dia, em atraso dentro da tolerância ou inadimplente (RN09).
export function AvisoDaSituacao({ resumo }: { resumo: ResumoDosPagamentos }) {
  const { situacao, pagamentosAtrasados, maiorAtrasoDias, proximoPagamento } = resumo;

  if (situacao === "INADIMPLENTE") {
    return (
      <div
        role="alert"
        className="flex gap-3 rounded-[14px] border border-alerta-borda bg-alerta-claro p-4 text-sm leading-relaxed text-alerta-texto"
      >
        <Icone nome="alerta" />
        <p>
          <strong>Mensalidade em atraso há {plural(maiorAtrasoDias, "dia", "dias")}.</strong>{" "}
          Enquanto não regularizar na recepção, você não consegue registrar atividades.
        </p>
      </div>
    );
  }

  if (pagamentosAtrasados > 0) {
    return (
      <div className="flex gap-3 rounded-[14px] bg-alerta-fundo p-4 text-sm leading-relaxed text-alerta">
        <Icone nome="alerta" />
        <p>
          {plural(pagamentosAtrasados, "mensalidade atrasada", "mensalidades atrasadas")} (
          {plural(maiorAtrasoDias, "dia", "dias")}). Regularize na recepção para não ficar
          bloqueado.
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5 rounded-[14px] bg-sucesso-fundo p-4 text-sm text-sucesso">
      <Icone nome="check" espessura={2.2} />
      <p>
        Mensalidade em dia.
        {proximoPagamento &&
          ` Próximo vencimento em ${formatarData(proximoPagamento.dataVencimento)}, de ${formatarMoeda(proximoPagamento.valor)}.`}
      </p>
    </div>
  );
}

function ItemPagamento({ pagamento }: { pagamento: Pagamento }) {
  return (
    <li className="flex items-center justify-between gap-3 border-b border-borda px-4 py-3.5 last:border-b-0">
      <div className="min-w-0">
        <p className="text-[15px] font-semibold tabular-nums">{formatarMoeda(pagamento.valor)}</p>
        <p className="mt-0.5 text-[13px] text-suave">
          {`Vencimento ${formatarData(pagamento.dataVencimento)}`}
          {pagamento.dataPagamento && ` · pago em ${formatarData(pagamento.dataPagamento)}`}
        </p>
      </div>
      <BadgeStatusPagamento pagamento={pagamento} />
    </li>
  );
}

// Tela de pagamentos do aluno: situação, plano e a lista das mensalidades, só leitura.
export function MeusPagamentos() {
  const [resumo, setResumo] = useState<ResumoDosPagamentos | null>(null);
  const [status, setStatus] = useState<StatusPagamento | undefined>(undefined);
  const [estado, setEstado] = useState<Estado>({ situacao: "carregando" });
  // Um "Carregar mais" de um filtro anterior é descartado.
  const geracao = useRef(0);

  useEffect(() => {
    let ativo = true;
    buscarResumoDosPagamentos()
      .then((dados) => {
        if (ativo) setResumo(dados);
      })
      // Sem o resumo, a lista ainda aparece: o aviso só some.
      .catch(() => {});
    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    geracao.current += 1;
    let ativo = true;
    listarMeusPagamentos(status, 1)
      .then((pagina) => {
        if (!ativo) return;
        setEstado({
          situacao: "pronto",
          lista: {
            pagamentos: pagina.data,
            total: pagina.total,
            page: 1,
            carregandoMais: false,
            erroMais: null,
          },
        });
      })
      .catch((e: unknown) => {
        if (ativo) setEstado({ situacao: "erro", mensagem: (e as Error).message });
      });
    return () => {
      ativo = false;
    };
  }, [status]);

  function escolher(novo: StatusPagamento | undefined) {
    if (novo === status) return;
    setStatus(novo);
    setEstado({ situacao: "carregando" });
  }

  function carregarMais() {
    if (estado.situacao !== "pronto") return;
    const { lista } = estado;
    const daGeracao = geracao.current;
    setEstado({ situacao: "pronto", lista: { ...lista, carregandoMais: true, erroMais: null } });
    listarMeusPagamentos(status, lista.page + 1)
      .then((proxima) => {
        if (geracao.current !== daGeracao) return;
        setEstado((atual) => {
          if (atual.situacao !== "pronto") return atual;
          const jaNaLista = new Set(atual.lista.pagamentos.map((p) => p.id));
          return {
            situacao: "pronto",
            lista: {
              pagamentos: [
                ...atual.lista.pagamentos,
                ...proxima.data.filter((p) => !jaNaLista.has(p.id)),
              ],
              total: proxima.total,
              page: lista.page + 1,
              carregandoMais: false,
              erroMais: null,
            },
          };
        });
      })
      .catch((e: unknown) => {
        if (geracao.current !== daGeracao) return;
        setEstado((atual) =>
          atual.situacao === "pronto"
            ? {
                situacao: "pronto",
                lista: { ...atual.lista, carregandoMais: false, erroMais: (e as Error).message },
              }
            : atual,
        );
      });
  }

  return (
    <div className="flex flex-col gap-4">
      {resumo && (
        <>
          <AvisoDaSituacao resumo={resumo} />
          <p className="text-sm text-suave">
            {resumo.valorMensalidade !== null && resumo.diaVencimento !== null
              ? `Sua mensalidade: ${formatarMoeda(resumo.valorMensalidade)}, vence todo dia ${resumo.diaVencimento}.`
              : "Sua mensalidade ainda não foi definida pela recepção."}
          </p>
        </>
      )}

      <FiltroChips
        rotulo="Status"
        opcoes={OPCOES_STATUS_PAGAMENTO}
        valor={status}
        onMudar={escolher}
      />

      {estado.situacao === "carregando" && <p className="text-sm text-suave">Carregando…</p>}

      {estado.situacao === "erro" && (
        <p role="alert" className="text-sm text-red-600">
          {estado.mensagem}
        </p>
      )}

      {estado.situacao === "pronto" &&
        (estado.lista.pagamentos.length === 0 ? (
          <div className="rounded-2xl border border-borda bg-white">
            <EmptyState
              titulo="Nenhum pagamento encontrado"
              descricao="Suas mensalidades aparecem aqui."
            />
          </div>
        ) : (
          <>
            <ul aria-label="Mensalidades" className="rounded-2xl border border-borda bg-white">
              {estado.lista.pagamentos.map((p) => (
                <ItemPagamento key={p.id} pagamento={p} />
              ))}
            </ul>
            {estado.lista.pagamentos.length < estado.lista.total && (
              <Button
                variante="secundario"
                disabled={estado.lista.carregandoMais}
                onClick={carregarMais}
              >
                {estado.lista.carregandoMais ? "Carregando…" : "Carregar mais"}
              </Button>
            )}
            {estado.lista.erroMais && (
              <p role="alert" className="text-sm text-red-600">
                {estado.lista.erroMais}
              </p>
            )}
          </>
        ))}
    </div>
  );
}
