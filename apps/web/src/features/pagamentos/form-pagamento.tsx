"use client";

import { type FormEvent, useState } from "react";
import { Input } from "@/components/ui/input";
import { RodapeFormulario } from "@/components/ui/rodape-formulario";
import { criarPagamento, type MembroBusca } from "./api";
import { BuscaMembro } from "./busca-membro";
import { mascaraMoeda, mascaraMoedaColada, valorDaMascara } from "./moeda";
import { type ErrosPagamento, validarPagamento, vencimentoMinimo } from "./validacao";

type FormPagamentoProps = {
  // Na ficha do membro (WEB-Y4) o membro já vem fixo e a busca some.
  membroId?: string;
  onSalvo: () => void;
  onCancelar: () => void;
  // Avisa quem abriu o formulário para não deixar fechá-lo durante o envio.
  onEnviando?: (enviando: boolean) => void;
};

export function FormPagamento({
  membroId: membroFixo,
  onSalvo,
  onCancelar,
  onEnviando,
}: FormPagamentoProps) {
  const [membro, setMembro] = useState<MembroBusca | null>(null);
  const [valorTexto, setValorTexto] = useState("");
  const [dataVencimento, setDataVencimento] = useState("");
  const [erros, setErros] = useState<ErrosPagamento>({});
  const [erroApi, setErroApi] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  // `||`: "" conta como sem membro fixo, igual ao `!membroFixo` que decide se a busca aparece.
  const membroId = membroFixo || membro?.id || null;

  async function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const valor = valorDaMascara(valorTexto);

    const errosEncontrados = validarPagamento({ membroId, valor, dataVencimento });
    setErros(errosEncontrados);
    setErroApi(null);
    if (Object.keys(errosEncontrados).length > 0 || !membroId) return;

    setEnviando(true);
    onEnviando?.(true);
    try {
      await criarPagamento({ membroId, valor, dataVencimento });
      onSalvo();
    } catch (e) {
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
    // noValidate: o `min` da data só limita o calendário; quem mostra o erro é validarPagamento.
    <form onSubmit={aoEnviar} noValidate className="flex flex-col gap-4">
      {!membroFixo && (
        <BuscaMembro
          selecionado={membro}
          onSelecionar={selecionarMembro}
          erro={erros.membro}
          desabilitado={enviando}
        />
      )}
      <Input
        rotulo="Valor"
        inputMode="numeric"
        placeholder="R$ 0,00"
        value={valorTexto}
        onChange={(e) => setValorTexto(mascaraMoeda(e.target.value))}
        onPaste={(e) => {
          e.preventDefault();
          setValorTexto(mascaraMoedaColada(e.clipboardData.getData("text")));
        }}
        erro={erros.valor}
      />
      <Input
        rotulo="Vencimento"
        type="date"
        min={vencimentoMinimo()}
        value={dataVencimento}
        onChange={(e) => setDataVencimento(e.target.value)}
        erro={erros.dataVencimento}
      />
      <RodapeFormulario erro={erroApi} enviando={enviando} onCancelar={onCancelar} />
    </form>
  );
}
