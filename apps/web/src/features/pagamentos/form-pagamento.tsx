"use client";

import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { criarPagamento, type MembroBusca } from "./api";
import { BuscaMembro } from "./busca-membro";
import { mascaraMoeda, valorDaMascara } from "./moeda";
import { type ErrosPagamento, validarPagamento } from "./validacao";

type FormPagamentoProps = {
  onSalvo: () => void;
  onCancelar: () => void;
};

export function FormPagamento({ onSalvo, onCancelar }: FormPagamentoProps) {
  const [membro, setMembro] = useState<MembroBusca | null>(null);
  const [valorTexto, setValorTexto] = useState("");
  const [dataVencimento, setDataVencimento] = useState("");
  const [erros, setErros] = useState<ErrosPagamento>({});
  const [erroApi, setErroApi] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const valor = valorDaMascara(valorTexto);

    const errosEncontrados = validarPagamento({
      membroId: membro?.id ?? null,
      valor,
      dataVencimento,
    });
    setErros(errosEncontrados);
    setErroApi(null);
    if (Object.keys(errosEncontrados).length > 0 || !membro) return;

    setEnviando(true);
    try {
      await criarPagamento({ membroId: membro.id, valor, dataVencimento });
      onSalvo();
    } catch (e) {
      setErroApi((e as Error).message);
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={aoEnviar} className="flex flex-col gap-4">
      <BuscaMembro selecionado={membro} onSelecionar={setMembro} erro={erros.membro} />
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
      {erroApi && (
        <p role="alert" className="text-sm text-red-600">
          {erroApi}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button variante="secundario" onClick={onCancelar}>
          Cancelar
        </Button>
        <Button type="submit" disabled={enviando}>
          {enviando ? "Salvando…" : "Salvar"}
        </Button>
      </div>
    </form>
  );
}
