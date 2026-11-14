"use client";

import { type FormEvent, useState } from "react";
import { Input } from "@/components/ui/input";
import { RodapeFormulario } from "@/components/ui/rodape-formulario";
import { ApiError } from "@/lib/api";
import { apenasDigitos, mascaraCpf, mascaraTelefone } from "@/lib/format";
import { atualizarMembro, criarMembro, type Membro } from "./api";
import { type ErrosMembro, validarMembro } from "./validacao";

type FormMembroProps = {
  membro?: Membro;
  onSalvo: (membro: Membro) => void;
  onCancelar: () => void;
};

export function FormMembro({ membro, onSalvo, onCancelar }: FormMembroProps) {
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
    const campos = {
      nome: valores.nome.trim(),
      telefone: apenasDigitos(telefone),
      endereco: valores.endereco.trim(),
    };
    try {
      const salvo = membro
        ? await atualizarMembro(membro.id, campos)
        : await criarMembro({ ...campos, cpf: apenasDigitos(cpf) });
      onSalvo(salvo);
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        setErros({ cpf: e.message });
      } else {
        setErroApi((e as Error).message);
      }
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={aoEnviar} className="flex max-w-xl flex-col gap-4">
      <Input
        rotulo="Nome"
        name="nome"
        defaultValue={membro?.nome}
        erro={erros.nome}
      />
      <Input
        rotulo="CPF"
        name="cpf"
        inputMode="numeric"
        autoComplete="off"
        placeholder="000.000.000-00"
        value={cpf}
        onChange={(e) => setCpf(mascaraCpf(e.target.value))}
        disabled={modo === "editar"}
        erro={erros.cpf}
      />
      <Input
        rotulo="Telefone"
        name="telefone"
        type="tel"
        inputMode="tel"
        placeholder="(00) 00000-0000"
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
