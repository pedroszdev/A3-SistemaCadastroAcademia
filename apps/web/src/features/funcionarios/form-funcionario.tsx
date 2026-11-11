"use client";

import { type FormEvent, useState } from "react";
import { Input } from "@/components/ui/input";
import { RodapeFormulario } from "@/components/ui/rodape-formulario";
import { Select } from "@/components/ui/select";
import type { Cargo } from "@/lib/sessao";
import { atualizarFuncionario, criarFuncionario, type Funcionario } from "./api";
import { OPCOES_CARGO } from "./cargos";
import { type ErrosFuncionario, validarFuncionario } from "./validacao";

type FormFuncionarioProps = {
  funcionario?: Funcionario;
  onSalvo: () => void;
  onCancelar: () => void;
  // Avisa quem abriu o formulário para não deixar fechá-lo durante o envio.
  onEnviando?: (enviando: boolean) => void;
};

export function FormFuncionario({
  funcionario,
  onSalvo,
  onCancelar,
  onEnviando,
}: FormFuncionarioProps) {
  const modo = funcionario ? "editar" : "criar";
  const [erros, setErros] = useState<ErrosFuncionario>({});
  const [erroApi, setErroApi] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const dados = new FormData(evento.currentTarget);
    const valores = {
      nome: String(dados.get("nome") ?? ""),
      login: String(dados.get("login") ?? ""),
      cargo: String(dados.get("cargo") ?? ""),
      senha: String(dados.get("senha") ?? ""),
    };

    const errosEncontrados = validarFuncionario(valores, modo);
    setErros(errosEncontrados);
    setErroApi(null);
    if (Object.keys(errosEncontrados).length > 0) return;

    setEnviando(true);
    onEnviando?.(true);
    const nome = valores.nome.trim();
    const cargo = valores.cargo as Cargo;
    try {
      if (funcionario) {
        await atualizarFuncionario(funcionario.id, {
          nome,
          cargo,
          ...(valores.senha && { senha: valores.senha }),
        });
      } else {
        await criarFuncionario({ nome, login: valores.login.trim(), cargo, senha: valores.senha });
      }
      onSalvo();
    } catch (e) {
      setErroApi((e as Error).message);
      setEnviando(false);
      onEnviando?.(false);
    }
  }

  return (
    <form onSubmit={aoEnviar} className="flex flex-col gap-4">
      <Input
        rotulo="Nome"
        name="nome"
        defaultValue={funcionario?.nome}
        erro={erros.nome}
      />
      <Input
        rotulo="Login"
        name="login"
        autoComplete="off"
        defaultValue={funcionario?.login}
        disabled={modo === "editar"}
        erro={erros.login}
      />
      <Select
        rotulo="Cargo"
        name="cargo"
        placeholder="Selecione"
        opcoes={OPCOES_CARGO}
        defaultValue={funcionario?.cargo ?? ""}
        erro={erros.cargo}
      />
      <Input
        rotulo={modo === "editar" ? "Nova senha (deixe em branco para manter)" : "Senha"}
        name="senha"
        type="password"
        autoComplete="new-password"
        erro={erros.senha}
      />
      <RodapeFormulario erro={erroApi} enviando={enviando} onCancelar={onCancelar} />
    </form>
  );
}
