"use client";

import { type FormEvent, useState } from "react";
import { Input } from "@/components/ui/input";
import { RodapeFormulario } from "@/components/ui/rodape-formulario";
import { Select } from "@/components/ui/select";
import { hojeEmSaoPaulo } from "@/features/historico/validacao";
import type { MembroBusca } from "@/features/pagamentos/api";
import { BuscaMembro } from "@/features/pagamentos/busca-membro";
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
    <form onSubmit={aoEnviar} noValidate className="flex flex-col gap-4">
      {treino ? (
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-zinc-800">Membro</span>
          <p className="rounded border border-zinc-300 px-3 py-2 text-sm">{treino.membro.nome}</p>
        </div>
      ) : (
        <BuscaMembro
          selecionado={membro}
          onSelecionar={selecionarMembro}
          erro={erros.membro}
          desabilitado={enviando}
        />
      )}
      <Select
        rotulo="Tipo"
        placeholder="Selecione o tipo"
        opcoes={OPCOES_TIPO_TREINO}
        value={tipo}
        onChange={(e) => setTipo(e.target.value)}
        erro={erros.tipo}
      />
      <Input
        rotulo="Descrição"
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
        erro={erros.descricao}
      />
      <Input
        rotulo="Duração (min)"
        type="number"
        inputMode="numeric"
        min={DURACAO_MINIMA}
        max={DURACAO_MAXIMA}
        step={1}
        value={duracao}
        onChange={(e) => setDuracao(e.target.value)}
        erro={erros.duracao}
      />
      <Input
        rotulo="Início"
        type="date"
        min={treino ? undefined : hoje}
        value={dataInicio}
        onChange={(e) => setDataInicio(e.target.value)}
        erro={erros.dataInicio}
      />
      <RodapeFormulario erro={erroApi} enviando={enviando} onCancelar={onCancelar} />
    </form>
  );
}
