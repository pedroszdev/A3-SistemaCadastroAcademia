"use client";

import { type FormEvent, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { RodapeFormulario } from "@/components/ui/rodape-formulario";
import { Select } from "@/components/ui/select";
import { useUsuario } from "@/features/auth/usuario";
import type { MembroBusca } from "@/features/pagamentos/api";
import { BuscaMembro } from "@/features/pagamentos/busca-membro";
import { ApiError } from "@/lib/api";
import { formatarData } from "@/lib/format";
import {
  consultarSituacao,
  listarTreinosDoMembro,
  MENSAGEM_INADIMPLENTE,
  podeConsultarSituacao,
  registrarAtividade,
  type SituacaoFinanceira,
  type TreinoDoMembro,
} from "./api";
import { AvisoInadimplencia } from "./aviso-inadimplencia";
import { type ErrosAtividade, hojeEmSaoPaulo, validarAtividade } from "./validacao";

type FormAtividadeProps = {
  onSalvo: () => void;
  onCancelar: () => void;
  // Avisa quem abriu o formulário para não deixar fechá-lo durante o envio.
  onEnviando?: (enviando: boolean) => void;
};

function placeholderDoTreino(membro: MembroBusca | null, treinos: TreinoDoMembro[] | null): string {
  if (!membro) return "Escolha o membro primeiro";
  if (!treinos) return "Carregando treinos…";
  return treinos.length === 0 ? "Nenhum treino disponível" : "Sem treino";
}

export function FormAtividade({ onSalvo, onCancelar, onEnviando }: FormAtividadeProps) {
  const usuario = useUsuario();
  const consultaSituacao = podeConsultarSituacao(usuario);
  const [hoje] = useState(() => hojeEmSaoPaulo());
  const [membro, setMembro] = useState<MembroBusca | null>(null);
  const [treinos, setTreinos] = useState<TreinoDoMembro[] | null>(null);
  const [treinoId, setTreinoId] = useState("");
  const [atividade, setAtividade] = useState("");
  const [data, setData] = useState(hoje);
  const [tempo, setTempo] = useState("");
  const [situacao, setSituacao] = useState<SituacaoFinanceira | null>(null);
  const [inadimplente422, setInadimplente422] = useState(false);
  const [erros, setErros] = useState<ErrosAtividade>({});
  const [erroApi, setErroApi] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const membroId = membro?.id;

  useEffect(() => {
    if (!membroId) return;

    let cancelado = false;
    listarTreinosDoMembro(membroId)
      .then((lista) => {
        if (!cancelado) setTreinos(lista);
      })
      .catch(() => {
        if (!cancelado) setTreinos([]);
      });
    if (consultaSituacao) {
      consultarSituacao(membroId)
        .then((resposta) => {
          if (!cancelado) setSituacao(resposta);
        })
        .catch(() => {
          if (!cancelado) setSituacao(null);
        });
    }
    return () => {
      cancelado = true;
    };
  }, [membroId, consultaSituacao]);

  function aoSelecionarMembro(escolhido: MembroBusca | null) {
    setMembro(escolhido);
    setTreinoId("");
    setTreinos(null);
    setSituacao(null);
    setInadimplente422(false);
    setErroApi(null);
  }

  async function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const errosEncontrados = validarAtividade(
      { membroId: membro?.id ?? null, atividade, data, tempoExecucao: tempo },
      hoje,
    );
    setErros(errosEncontrados);
    setErroApi(null);
    if (Object.keys(errosEncontrados).length > 0 || !membro) return;

    setEnviando(true);
    onEnviando?.(true);
    try {
      await registrarAtividade({
        membroId: membro.id,
        treinoId: treinoId || undefined,
        atividade: atividade.trim(),
        data,
        tempoExecucao: Number(tempo),
      });
      onSalvo();
    } catch (e) {
      if (e instanceof ApiError && e.status === 422 && e.message === MENSAGEM_INADIMPLENTE) {
        setInadimplente422(true);
      } else {
        setErroApi((e as Error).message);
      }
      setEnviando(false);
      onEnviando?.(false);
    }
  }

  const bloqueado = situacao?.situacao === "INADIMPLENTE" || inadimplente422;

  return (
    // noValidate: o max da data e os limites do tempo só ajudam no campo; quem barra e mostra
    // a mensagem igual à da API é o validarAtividade.
    <form onSubmit={aoEnviar} noValidate className="flex flex-col gap-4">
      <BuscaMembro selecionado={membro} onSelecionar={aoSelecionarMembro} erro={erros.membro} />
      {bloqueado && <AvisoInadimplencia maiorAtrasoDias={situacao?.maiorAtrasoDias} />}
      <Select
        rotulo="Treino (opcional)"
        placeholder={placeholderDoTreino(membro, treinos)}
        opcoes={(treinos ?? []).map((treino) => ({
          valor: treino.id,
          rotulo: `${treino.tipo} · início ${formatarData(treino.dataInicio)}`,
        }))}
        value={treinoId}
        onChange={(e) => setTreinoId(e.target.value)}
        disabled={!membro || !treinos?.length}
      />
      <Input
        rotulo="Atividade"
        value={atividade}
        onChange={(e) => setAtividade(e.target.value)}
        erro={erros.atividade}
      />
      <Input
        rotulo="Data"
        type="date"
        max={hoje}
        value={data}
        onChange={(e) => setData(e.target.value)}
        erro={erros.data}
      />
      <Input
        rotulo="Tempo (min)"
        type="number"
        inputMode="numeric"
        min={1}
        max={600}
        step={1}
        value={tempo}
        onChange={(e) => setTempo(e.target.value)}
        erro={erros.tempoExecucao}
      />
      <RodapeFormulario
        erro={erroApi}
        enviando={enviando}
        desabilitado={bloqueado}
        onCancelar={onCancelar}
      />
    </form>
  );
}
