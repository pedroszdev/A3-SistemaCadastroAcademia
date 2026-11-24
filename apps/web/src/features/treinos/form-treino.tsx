"use client";

import { type FormEvent, useState } from "react";
import { AreaTexto } from "@/components/ui/area-texto";
import { Input } from "@/components/ui/input";
import { RodapeFormulario } from "@/components/ui/rodape-formulario";
import { Select } from "@/components/ui/select";
import type { MembroBusca } from "@/features/pagamentos/api";
import { BuscaMembro } from "@/features/pagamentos/busca-membro";
import { hojeEmSaoPaulo } from "@/lib/format";
import { atualizarTreino, criarTreino, type Treino } from "./api";
import { ehTipoTreino, OPCOES_TIPO_TREINO } from "./tipos";
import { DURACAO_MAXIMA, DURACAO_MINIMA, type ErrosTreino, validarTreino } from "./validacao";

type FormTreinoProps = {
  // Com o treino, o formulário edita; sem ele, cria.
  treino?: Treino;
  onSalvo: () => void;
  onCancelar: () => void;
  // Avisa quem abriu o formulário para não deixar fechá-lo durante o envio.
  onEnviando?: (enviando: boolean) => void;
};

export function FormTreino({ treino, onSalvo, onCancelar, onEnviando }: FormTreinoProps) {
  const [hoje] = useState(() => hojeEmSaoPaulo());
  const [membro, setMembro] = useState<MembroBusca | null>(null);
  const [tipo, setTipo] = useState<string>(treino?.tipo ?? "");
  const [descricao, setDescricao] = useState(treino?.descricao ?? "");
  const [duracao, setDuracao] = useState(treino ? String(treino.duracao) : "");
  const [dataInicio, setDataInicio] = useState(treino?.dataInicio.slice(0, 10) ?? "");
  const [erros, setErros] = useState<ErrosTreino>({});
  const [erroApi, setErroApi] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const membroId = membro?.id ?? null;

    const errosEncontrados = validarTreino(
      { membroId, tipo, descricao, duracao, dataInicio },
      { hoje, salvo: treino && { dataInicio: treino.dataInicio.slice(0, 10) } },
    );
    setErros(errosEncontrados);
    setErroApi(null);
    if (Object.keys(errosEncontrados).length > 0 || !ehTipoTreino(tipo)) return;

    const dados = { tipo, descricao: descricao.trim(), duracao: Number(duracao), dataInicio };
    // Na criação o membroId já foi validado; o ramo sem ele só estreita o tipo.
    const salvar = treino
      ? () => atualizarTreino(treino.id, dados)
      : membroId
        ? () => criarTreino({ membroId, ...dados })
        : null;
    if (!salvar) return;

    setEnviando(true);
    onEnviando?.(true);
    try {
      await salvar();
      onSalvo();
    } catch (e) {
      // 400 (dados ou data no passado) e 422 (membro inativo): a mensagem da API explica.
      setErroApi((e as Error).message);
      setEnviando(false);
      onEnviando?.(false);
    }
  }

  function selecionarMembro(novo: MembroBusca | null) {
    setMembro(novo);
    // O erro "Selecione o membro" já foi resolvido: não volta ao clicar em Trocar.
    if (novo) setErros((atual) => ({ ...atual, membro: undefined }));
  }

  return (
    // noValidate: o min da data e os limites da duração só ajudam no campo; quem barra e mostra
    // a mensagem igual à da API é o validarTreino.
    <form onSubmit={aoEnviar} noValidate className="flex flex-col gap-[18px]">
      {treino ? (
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">Membro</span>
          <p className="flex h-[46px] items-center rounded-[10px] border border-borda-campo bg-fundo-2 px-3.5 text-[15px]">
            {treino.membro.nome}
          </p>
        </div>
      ) : (
        <BuscaMembro
          selecionado={membro}
          onSelecionar={selecionarMembro}
          erro={erros.membro}
          desabilitado={enviando}
          obrigatorio
          ajuda="Membros inativos não aparecem."
        />
      )}
      <Select
        rotulo="Tipo"
        obrigatorio
        placeholder="Selecione o tipo"
        opcoes={OPCOES_TIPO_TREINO}
        value={tipo}
        onChange={(e) => setTipo(e.target.value)}
        disabled={enviando}
        erro={erros.tipo}
      />
      <AreaTexto
        rotulo="Descrição"
        obrigatorio
        placeholder="Ex.: Treino C: pernas e glúteos"
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
        disabled={enviando}
        erro={erros.descricao}
      />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-4">
        <Input
          rotulo="Duração (min)"
          obrigatorio
          type="number"
          inputMode="numeric"
          placeholder="60"
          min={DURACAO_MINIMA}
          max={DURACAO_MAXIMA}
          step={1}
          value={duracao}
          onChange={(e) => setDuracao(e.target.value)}
          disabled={enviando}
          erro={erros.duracao}
        />
        <Input
          rotulo="Data de início"
          obrigatorio
          type="date"
          min={treino ? undefined : hoje}
          ajuda={treino ? undefined : "A partir de hoje."}
          value={dataInicio}
          onChange={(e) => setDataInicio(e.target.value)}
          disabled={enviando}
          erro={erros.dataInicio}
        />
      </div>
      <RodapeFormulario
        erro={erroApi}
        enviando={enviando}
        onCancelar={onCancelar}
        rotuloSalvar="Salvar treino"
      />
    </form>
  );
}
