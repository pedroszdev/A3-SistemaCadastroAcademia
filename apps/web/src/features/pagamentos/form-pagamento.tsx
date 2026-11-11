"use client";

import { type FormEvent, useState } from "react";
import { Input } from "@/components/ui/input";
import { RodapeFormulario } from "@/components/ui/rodape-formulario";
import { criarPagamento, type MembroBusca } from "./api";
import { BuscaMembro } from "./busca-membro";
import { mascaraMoeda, valorDaMascara } from "./moeda";
import { type ErrosPagamento, validarPagamento } from "./validacao";

type FormPagamentoProps = {
  // Na ficha do membro (WEB-Y4) o membro já vem fixo e a busca some.
  membroId?: string;
  onSalvo: () => void;
  onCancelar: () => void;
};

export function FormPagamento({ membroId: membroFixo, onSalvo, onCancelar }: FormPagamentoProps) {
  const [membro, setMembro] = useState<MembroBusca | null>(null);
  const [valorTexto, setValorTexto] = useState("");
  const [dataVencimento, setDataVencimento] = useState("");
  const [erros, setErros] = useState<ErrosPagamento>({});
  const [erroApi, setErroApi] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const membroId = membroFixo ?? membro?.id ?? null;

  async function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const valor = valorDaMascara(valorTexto);

    const errosEncontrados = validarPagamento({ membroId, valor, dataVencimento });
    setErros(errosEncontrados);
    setErroApi(null);
    if (Object.keys(errosEncontrados).length > 0 || !membroId) return;

    setEnviando(true);
    try {
      await criarPagamento({ membroId, valor, dataVencimento });
      onSalvo();
    } catch (e) {
      setErroApi((e as Error).message);
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={aoEnviar} className="flex flex-col gap-4">
      {!membroFixo && (
        <BuscaMembro selecionado={membro} onSelecionar={setMembro} erro={erros.membro} />
      )}
      <Input
        rotulo="Valor"
        inputMode="numeric"
        placeholder="R$ 0,00"
        value={valorTexto}
        onChange={(e) => setValorTexto(mascaraMoeda(e.target.value))}
        erro={erros.valor}
      />
      <Input
        rotulo="Vencimento"
        type="date"
        value={dataVencimento}
        onChange={(e) => setDataVencimento(e.target.value)}
        erro={erros.dataVencimento}
      />
      <RodapeFormulario erro={erroApi} enviando={enviando} onCancelar={onCancelar} />
    </form>
  );
}
