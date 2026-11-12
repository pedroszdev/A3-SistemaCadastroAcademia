"use client";

import { type FormEvent, useState } from "react";
import { Input } from "@/components/ui/input";
import { RodapeFormulario } from "@/components/ui/rodape-formulario";
import { ApiError } from "@/lib/api";
import { apenasDigitos, mascaraCpf, mascaraTelefone } from "@/lib/format";
import { atualizarMembro, criarMembro, type Membro } from "./api";
import { type ErrosMembro, validarMembro } from "./validacao";

export const MENSAGEM_CPF_DUPLICADO = "CPF já cadastrado";

type FormMembroProps = {
  membro?: Membro;
  onSalvo: () => void;
  onCancelar: () => void;
  // Avisa quem abriu o formulário para não deixar fechá-lo durante o envio.
  onEnviando?: (enviando: boolean) => void;
};

export function FormMembro({ membro, onSalvo, onCancelar, onEnviando }: FormMembroProps) {
  const modo = membro ? "editar" : "criar";
  const [cpf, setCpf] = useState(membro ? mascaraCpf(membro.cpf) : "");
  const [telefone, setTelefone] = useState(membro ? mascaraTelefone(membro.telefone) : "");
  const [erros, setErros] = useState<ErrosMembro>({});
  const [erroApi, setErroApi] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const dados = new FormData(evento.currentTarget);
    const valores = {
      nome: String(dados.get("nome") ?? ""),
      cpf,
      telefone,
      endereco: String(dados.get("endereco") ?? ""),
    };

    const errosEncontrados = validarMembro(valores, modo);
    setErros(errosEncontrados);
    setErroApi(null);
    if (Object.keys(errosEncontrados).length > 0) return;

    setEnviando(true);
    onEnviando?.(true);
    const campos = {
      nome: valores.nome.trim(),
      telefone: apenasDigitos(valores.telefone),
      endereco: valores.endereco.trim(),
    };
    try {
      if (membro) {
        await atualizarMembro(membro.id, campos);
      } else {
        await criarMembro({ ...campos, cpf: apenasDigitos(valores.cpf) });
      }
      onSalvo();
    } catch (e) {
      const duplicado = e instanceof ApiError && e.status === 409;
      setErroApi(duplicado ? MENSAGEM_CPF_DUPLICADO : (e as Error).message);
      setEnviando(false);
      onEnviando?.(false);
    }
  }

  return (
    <form onSubmit={aoEnviar} className="flex flex-col gap-4">
      <Input rotulo="Nome" name="nome" defaultValue={membro?.nome} erro={erros.nome} />
      <Input
        rotulo="CPF"
        inputMode="numeric"
        autoComplete="off"
        value={cpf}
        onChange={(e) => setCpf(mascaraCpf(e.target.value))}
        disabled={modo === "editar"}
        erro={erros.cpf}
      />
      <Input
        rotulo="Telefone"
        type="tel"
        inputMode="numeric"
        value={telefone}
        onChange={(e) => setTelefone(mascaraTelefone(e.target.value))}
        erro={erros.telefone}
      />
      <Input
        rotulo="Endereço"
        name="endereco"
        defaultValue={membro?.endereco}
        erro={erros.endereco}
      />
      <RodapeFormulario erro={erroApi} enviando={enviando} onCancelar={onCancelar} />
    </form>
  );
}
