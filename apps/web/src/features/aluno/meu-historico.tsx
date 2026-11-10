"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  type AtividadeDoAluno,
  type ResumoDoPeriodo,
  buscarResumoDoPeriodo,
  listarMinhasAtividades,
} from "./historico";
import { ListaAtividades } from "./lista-atividades";
import {
  type Intervalo,
  PERIODOS,
  PERIODO_PADRAO,
  type Periodo,
  intervaloDoPeriodo,
} from "./periodo";
import { ResumoHistorico } from "./resumo-historico";

type Estado =
  | { situacao: "carregando" }
  | { situacao: "erro"; mensagem: string }
  | {
      situacao: "pronto";
      intervalo: Intervalo;
      resumo: ResumoDoPeriodo;
      atividades: AtividadeDoAluno[];
      total: number;
      page: number;
      carregandoMais: boolean;
      erroMais: string | null;
    };

export function MeuHistorico() {
  const [periodo, setPeriodo] = useState<Periodo>(PERIODO_PADRAO);
  const [estado, setEstado] = useState<Estado>({ situacao: "carregando" });
  // Muda a cada busca do período: um Carregar mais de uma busca anterior é descartado,
  // mesmo que o aluno tenha voltado ao mesmo período (30 → 7 → 30 dias).
  const geracao = useRef(0);

  useEffect(() => {
    geracao.current += 1;
    let ativo = true;
    const intervalo = intervaloDoPeriodo(periodo);

    Promise.all([
      buscarResumoDoPeriodo(intervalo),
      listarMinhasAtividades(intervalo, 1),
    ])
      .then(([resumo, pagina]) => {
        if (ativo) {
          setEstado({
            situacao: "pronto",
            intervalo,
            resumo,
            atividades: pagina.data,
            total: pagina.total,
            page: 1,
            carregandoMais: false,
            erroMais: null,
          });
        }
      })
      .catch((e: unknown) => {
        if (ativo) setEstado({ situacao: "erro", mensagem: (e as Error).message });
      });

    return () => {
      ativo = false;
    };
  }, [periodo]);

  function escolher(novo: Periodo) {
    if (novo === periodo) return;
    setPeriodo(novo);
    setEstado({ situacao: "carregando" });
  }

  function carregarMais() {
    if (estado.situacao !== "pronto") return;
    const { intervalo, page } = estado;
    const daGeracao = geracao.current;

    setEstado({ ...estado, carregandoMais: true, erroMais: null });
    listarMinhasAtividades(intervalo, page + 1)
      .then((proxima) => {
        if (geracao.current !== daGeracao) return;
        setEstado((atual) =>
          atual.situacao === "pronto"
            ? {
                ...atual,
                atividades: [...atual.atividades, ...proxima.data],
                total: proxima.total,
                page: page + 1,
                carregandoMais: false,
                erroMais: null,
              }
            : atual,
        );
      })
      .catch((e: unknown) => {
        if (geracao.current !== daGeracao) return;
        setEstado((atual) =>
          atual.situacao === "pronto"
            ? { ...atual, carregandoMais: false, erroMais: (e as Error).message }
            : atual,
        );
      });
  }

  return (
    <div className="flex flex-col gap-6">
      <div role="group" aria-label="Período" className="flex flex-wrap gap-2">
        {PERIODOS.map((p) => {
          const ativo = p.valor === periodo;
          return (
            <Button
              key={p.valor}
              variante={ativo ? "primario" : "secundario"}
              aria-pressed={ativo}
              onClick={() => escolher(p.valor)}
            >
              {p.rotulo}
            </Button>
          );
        })}
      </div>

      {estado.situacao === "carregando" && (
        <p className="text-sm text-zinc-600">Carregando…</p>
      )}

      {estado.situacao === "erro" && (
        <p role="alert" className="text-sm text-red-600">
          {estado.mensagem}
        </p>
      )}

      {estado.situacao === "pronto" && (
        <>
          <ResumoHistorico resumo={estado.resumo} />
          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold text-zinc-900">Atividades</h2>
            <ListaAtividades atividades={estado.atividades} />
            {estado.atividades.length < estado.total && (
              <Button
                variante="secundario"
                disabled={estado.carregandoMais}
                onClick={carregarMais}
              >
                {estado.carregandoMais ? "Carregando…" : "Carregar mais"}
              </Button>
            )}
            {estado.erroMais && (
              <p role="alert" className="text-sm text-red-600">
                {estado.erroMais}
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
