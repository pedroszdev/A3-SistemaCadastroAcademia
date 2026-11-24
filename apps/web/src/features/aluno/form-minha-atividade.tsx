"use client";

import { type FormEvent, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { RodapeFormulario } from "@/components/ui/rodape-formulario";
import { Select } from "@/components/ui/select";
import { AvisoInadimplencia } from "@/features/historico/aviso-inadimplencia";
import { MENSAGEM_INADIMPLENTE } from "@/features/historico/api";
import { ApiError } from "@/lib/api";
import { formatarData, hojeEmSaoPaulo } from "@/lib/format";
import { registrarMinhaAtividade } from "./historico";
import { listarMeusTreinos, type TreinoDoAluno } from "./treinos";
import { type ErrosMinhaAtividade, validarMinhaAtividade } from "./validacao-atividade";

type FormMinhaAtividadeProps = {
  onSalvo: () => void;
  onCancelar: () => void;
  onEnviando?: (enviando: boolean) => void;
};

// RN19: o aluno registra o treino que fez. Só aparecem os treinos dele.
export function FormMinhaAtividade({ onSalvo, onCancelar, onEnviando }: FormMinhaAtividadeProps) {
  const [hoje] = useState(() => hojeEmSaoPaulo());
  const [treinos, setTreinos] = useState<TreinoDoAluno[] | null>(null);
  const [erroTreinos, setErroTreinos] = useState<string | null>(null);
  const [treinoId, setTreinoId] = useState("");
  const [atividade, setAtividade] = useState("");
  const [data, setData] = useState(hoje);
  const [tempo, setTempo] = useState("");
  const [erros, setErros] = useState<ErrosMinhaAtividade>({});
  const [erroApi, setErroApi] = useState<string | null>(null);
  const [inadimplente, setInadimplente] = useState(false);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    let ativo = true;
    listarMeusTreinos(undefined, 1)
      .then((pagina) => {
        if (ativo) setTreinos(pagina.data);
      })
      .catch((e: Error) => {
        if (!ativo) return;
        setTreinos([]);
        setErroTreinos(`Não foi possível carregar seus treinos: ${e.message}`);
      });
    return () => {
      ativo = false;
    };
  }, []);

  function escolherTreino(id: string) {
    setTreinoId(id);
    // A duração planejada do treino já entra como sugestão do tempo.
    const escolhido = treinos?.find((t) => t.id === id);
    if (escolhido && tempo === "") setTempo(String(escolhido.duracao));
  }

  async function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (inadimplente) return;
    const encontrados = validarMinhaAtividade({ treinoId, atividade, data, tempoExecucao: tempo }, hoje);
    setErros(encontrados);
    setErroApi(null);
    if (Object.keys(encontrados).length > 0) return;

    setEnviando(true);
    onEnviando?.(true);
    try {
      await registrarMinhaAtividade({
        treinoId,
        data,
        tempoExecucao: Number(tempo),
        ...(atividade.trim() && { atividade: atividade.trim() }),
      });
      onSalvo();
    } catch (e) {
      if (e instanceof ApiError && e.status === 422 && e.message === MENSAGEM_INADIMPLENTE) {
        setInadimplente(true);
      } else {
        setErroApi((e as Error).message);
      }
      setEnviando(false);
      onEnviando?.(false);
    }
  }

  let placeholder = "Escolha o treino";
  if (!treinos) placeholder = "Carregando treinos…";
  else if (treinos.length === 0) placeholder = "Você ainda não tem treinos";

  return (
    <form onSubmit={aoEnviar} noValidate className="flex flex-col gap-[18px]">
      {inadimplente && <AvisoInadimplencia />}
      <Select
        rotulo="Treino"
        obrigatorio
        placeholder={placeholder}
        opcoes={(treinos ?? []).map((t) => ({
          valor: t.id,
          rotulo: `${t.tipo} · ${t.descricao.slice(0, 50)} · desde ${formatarData(t.dataInicio)}`,
        }))}
        value={treinoId}
        onChange={(e) => escolherTreino(e.target.value)}
        disabled={enviando || !treinos?.length}
        erro={erros.treino ?? erroTreinos ?? undefined}
      />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-4">
        <Input
          rotulo="Data"
          obrigatorio
          type="date"
          max={hoje}
          value={data}
          onChange={(e) => setData(e.target.value)}
          disabled={enviando}
          erro={erros.data}
        />
        <Input
          rotulo="Tempo (min)"
          obrigatorio
          type="number"
          inputMode="numeric"
          min={1}
          max={600}
          step={1}
          value={tempo}
          onChange={(e) => setTempo(e.target.value)}
          disabled={enviando}
          erro={erros.tempoExecucao}
        />
      </div>
      <Input
        rotulo="Observação (opcional)"
        placeholder="Em branco, vale a descrição do treino"
        value={atividade}
        onChange={(e) => setAtividade(e.target.value)}
        disabled={enviando}
        erro={erros.atividade}
      />
      <RodapeFormulario
        erro={erroApi}
        enviando={enviando}
        desabilitado={inadimplente}
        onCancelar={onCancelar}
        rotuloSalvar="Registrar"
      />
    </form>
  );
}
