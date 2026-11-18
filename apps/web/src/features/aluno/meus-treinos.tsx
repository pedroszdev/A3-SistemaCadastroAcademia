"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { OPCOES_TIPO_TREINO, ehTipoTreino, type TipoTreino } from "@/features/treinos/tipos";
import { formatarData } from "@/lib/format";
import { ListaTreinos } from "./lista-treinos";
import { type TreinoDoAluno, listarMeusTreinos } from "./treinos";

type Estado =
  | { situacao: "carregando" }
  | { situacao: "erro"; mensagem: string }
  | {
      situacao: "pronto";
      treinos: TreinoDoAluno[];
      total: number;
      page: number;
      carregandoMais: boolean;
      erroMais: string | null;
    };

export function MeusTreinos() {
  const [tipo, setTipo] = useState<TipoTreino | undefined>(undefined);
  const [estado, setEstado] = useState<Estado>({ situacao: "carregando" });
  const [aberto, setAberto] = useState<TreinoDoAluno | null>(null);
  // Muda a cada "Tentar de novo": refaz a busca do mesmo filtro.
  const [tentativa, setTentativa] = useState(0);
  // Muda a cada busca do filtro: um Carregar mais de uma busca anterior é descartado,
  // mesmo que o aluno tenha voltado ao mesmo tipo.
  const geracao = useRef(0);

  useEffect(() => {
    geracao.current += 1;
    let ativo = true;

    listarMeusTreinos(tipo, 1)
      .then((pagina) => {
        if (ativo) {
          setEstado({
            situacao: "pronto",
            treinos: pagina.data,
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
  }, [tipo, tentativa]);

  function escolher(valor: string) {
    const novo = ehTipoTreino(valor) ? valor : undefined;
    if (novo === tipo) return;
    setTipo(novo);
    setEstado({ situacao: "carregando" });
  }

  function tentarDeNovo() {
    setEstado({ situacao: "carregando" });
    setTentativa((n) => n + 1);
  }

  function carregarMais() {
    if (estado.situacao !== "pronto") return;
    const { page } = estado;
    const doTipo = tipo;
    const daGeracao = geracao.current;

    setEstado({ ...estado, carregandoMais: true, erroMais: null });
    listarMeusTreinos(doTipo, page + 1)
      .then((proxima) => {
        if (geracao.current !== daGeracao) return;
        setEstado((atual) => {
          if (atual.situacao !== "pronto") return atual;
          // A lista é por página: se um treino novo entrou no topo entre uma página e
          // outra, o último da página anterior volta na próxima. Ele não aparece duas vezes.
          const jaNaLista = new Set(atual.treinos.map((t) => t.id));
          return {
            ...atual,
            treinos: [...atual.treinos, ...proxima.data.filter((t) => !jaNaLista.has(t.id))],
            total: proxima.total,
            page: page + 1,
            carregandoMais: false,
            erroMais: null,
          };
        });
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
    <div className="flex flex-col gap-4">
      <Select
        rotulo="Tipo"
        placeholder="Todos os tipos"
        opcoes={OPCOES_TIPO_TREINO}
        value={tipo ?? ""}
        onChange={(e) => escolher(e.target.value)}
      />

      {estado.situacao === "carregando" && (
        <p className="text-sm text-zinc-600">Carregando…</p>
      )}

      {estado.situacao === "erro" && (
        <div className="flex flex-col items-start gap-2">
          <p role="alert" className="text-sm text-red-600">
            {estado.mensagem}
          </p>
          <Button variante="secundario" onClick={tentarDeNovo}>
            Tentar de novo
          </Button>
        </div>
      )}

      {estado.situacao === "pronto" && (
        <>
          <ListaTreinos treinos={estado.treinos} onAbrir={setAberto} />
          {estado.treinos.length < estado.total && (
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
        </>
      )}

      <Dialog
        aberto={aberto !== null}
        titulo={aberto?.tipo ?? ""}
        onFechar={() => setAberto(null)}
        acoes={
          <Button variante="secundario" onClick={() => setAberto(null)}>
            Fechar
          </Button>
        }
      >
        {aberto && (
          <dl className="flex flex-col gap-2 text-sm">
            <div>
              <dt className="font-medium text-zinc-800">Início</dt>
              <dd>{formatarData(aberto.dataInicio)}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-800">Duração</dt>
              <dd>{`${aberto.duracao} min`}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-800">Descrição</dt>
              <dd className="whitespace-pre-line">{aberto.descricao}</dd>
            </div>
          </dl>
        )}
      </Dialog>
    </div>
  );
}
