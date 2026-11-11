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
import { temAcessoFinanceiro } from "@/lib/menu";
import {
  consultarSituacao,
  listarTreinosDoMembro,
  MENSAGEM_INADIMPLENTE,
  registrarAtividade,
  type SituacaoFinanceira,
  type TreinoDoMembro,
} from "./api";
import { AvisoInadimplencia } from "./aviso-inadimplencia";
import { type ErrosAtividade, hojeEmSaoPaulo, validarAtividade } from "./validacao";

type FormAtividadeProps = {
  // Na ficha do membro (WEB-Y4) o membro já vem fixo e a busca some.
  membroId?: string;
  onSalvo: () => void;
  onCancelar: () => void;
  // Avisa quem abriu o formulário para não deixar fechá-lo durante o envio.
  onEnviando?: (enviando: boolean) => void;
};

function placeholderDoTreino(
  membroId: string | undefined,
  treinos: TreinoDoMembro[] | null,
): string {
  if (!membroId) return "Escolha o membro primeiro";
  if (!treinos) return "Carregando treinos…";
  return treinos.length === 0 ? "Nenhum treino disponível" : "Sem treino";
}

export function FormAtividade({
  membroId: membroFixo,
  onSalvo,
  onCancelar,
  onEnviando,
}: FormAtividadeProps) {
  const usuario = useUsuario();
  const consultaSituacao = temAcessoFinanceiro(usuario);
  const [hoje] = useState(() => hojeEmSaoPaulo());
  const [membro, setMembro] = useState<MembroBusca | null>(null);
  const [treinos, setTreinos] = useState<TreinoDoMembro[] | null>(null);
  const [erroTreinos, setErroTreinos] = useState<string | null>(null);
  const [treinoId, setTreinoId] = useState("");
  const [atividade, setAtividade] = useState("");
  const [data, setData] = useState(hoje);
  const [tempo, setTempo] = useState("");
  const [situacao, setSituacao] = useState<SituacaoFinanceira | null>(null);
  const [inadimplente422, setInadimplente422] = useState(false);
  const [erros, setErros] = useState<ErrosAtividade>({});
  const [erroApi, setErroApi] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  // `||`: "" conta como sem membro fixo, igual ao `!membroFixo` que decide se a busca aparece.
  const membroId = membroFixo || membro?.id;

  useEffect(() => {
    if (!membroId) return;

    let cancelado = false;
    listarTreinosDoMembro(membroId)
      .then((lista) => {
        if (!cancelado) setTreinos(lista);
      })
      .catch((e: Error) => {
        if (cancelado) return;
        setTreinos([]);
        setErroTreinos(`Não foi possível carregar os treinos: ${e.message}`);
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
    setErroTreinos(null);
    setSituacao(null);
    setInadimplente422(false);
    setErroApi(null);
  }

  const bloqueado = situacao?.situacao === "INADIMPLENTE" || inadimplente422;

  async function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    // RN09: o bloqueio vale para qualquer submit, não só para o botão desabilitado.
    if (bloqueado) return;
    const errosEncontrados = validarAtividade(
      { membroId: membroId ?? null, atividade, data, tempoExecucao: tempo },
      hoje,
    );
    setErros(errosEncontrados);
    setErroApi(null);
    if (Object.keys(errosEncontrados).length > 0 || !membroId) return;

    setEnviando(true);
    onEnviando?.(true);
    try {
      await registrarAtividade({
        membroId,
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

  return (
    // noValidate: o max da data e os limites do tempo só ajudam no campo; quem barra e mostra
    // a mensagem igual à da API é o validarAtividade.
    <form onSubmit={aoEnviar} noValidate className="flex flex-col gap-4">
      {!membroFixo && (
        <BuscaMembro
          selecionado={membro}
          onSelecionar={aoSelecionarMembro}
          erro={erros.membro}
          desabilitado={enviando}
        />
      )}
      {bloqueado && <AvisoInadimplencia maiorAtrasoDias={situacao?.maiorAtrasoDias} />}
      <Select
        rotulo="Treino (opcional)"
        placeholder={placeholderDoTreino(membroId, treinos)}
        opcoes={(treinos ?? []).map((treino) => ({
          valor: treino.id,
          rotulo: `${treino.tipo} · início ${formatarData(treino.dataInicio)}`,
        }))}
        value={treinoId}
        onChange={(e) => setTreinoId(e.target.value)}
        disabled={!membroId || !treinos?.length}
        erro={erroTreinos ?? undefined}
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
