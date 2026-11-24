"use client";

import { type FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Cartao } from "@/components/ui/cartao";
import { Icone } from "@/components/ui/icone";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { ROTULO_CARGO } from "@/features/funcionarios/cargos";
import type { Membro } from "@/features/membros/api";
import { apenasDigitos, formatarData, formatarMoeda, mascaraCpf, mascaraTelefone } from "@/lib/format";
import {
  atualizarMeusDados,
  buscarMeusDados,
  ehAluno,
  type FuncionarioDoPerfil,
  type MeusDados as Dados,
  trocarSenha,
} from "./api";
import {
  type ErrosDados,
  type ErrosSenha,
  validarDadosDoAluno,
  validarDadosDoFuncionario,
  validarTrocaDeSenha,
} from "./validacao";

type Estado =
  | { situacao: "carregando" }
  | { situacao: "erro"; mensagem: string }
  | { situacao: "pronto"; dados: Dados };

// RN20: tela "Meus dados" do aluno e do funcionário. Cada um vê os próprios dados, muda
// o que a regra deixa e troca a senha com a senha atual.
export function MeusDados() {
  const [estado, setEstado] = useState<Estado>({ situacao: "carregando" });
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let ativo = true;
    buscarMeusDados().then(
      (dados) => {
        if (ativo) setEstado({ situacao: "pronto", dados });
      },
      (e: unknown) => {
        if (ativo) setEstado({ situacao: "erro", mensagem: (e as Error).message });
      },
    );
    return () => {
      ativo = false;
    };
  }, [tentativa]);

  if (estado.situacao === "carregando") {
    return <p className="text-sm text-suave">Carregando…</p>;
  }

  if (estado.situacao === "erro") {
    return (
      <div className="flex flex-col items-start gap-3">
        <p role="alert" className="text-sm text-red-600">
          {estado.mensagem}
        </p>
        <Button
          variante="secundario"
          onClick={() => {
            setEstado({ situacao: "carregando" });
            setTentativa((n) => n + 1);
          }}
        >
          Tentar de novo
        </Button>
      </div>
    );
  }

  const aoAtualizar = (dados: Dados) => setEstado({ situacao: "pronto", dados });
  const { dados } = estado;

  return (
    <div className="grid items-start gap-5 lg:grid-cols-2">
      {ehAluno(dados) ? (
        <DadosDoAluno membro={dados} onAtualizado={aoAtualizar} />
      ) : (
        <DadosDoFuncionario funcionario={dados} onAtualizado={aoAtualizar} />
      )}
      <TrocarSenha />
    </div>
  );
}

function Dado({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[13px] text-suave">{rotulo}</dt>
      <dd className="font-medium">{valor}</dd>
    </div>
  );
}

function textoDaMensalidade(membro: Membro): string {
  if (membro.valorMensalidade === null || membro.diaVencimento === null) {
    return "Sem mensalidade automática";
  }
  return `${formatarMoeda(membro.valorMensalidade)}, vence todo dia ${membro.diaVencimento}`;
}

type DadosDoAlunoProps = { membro: Membro; onAtualizado: (dados: Dados) => void };

function DadosDoAluno({ membro, onAtualizado }: DadosDoAlunoProps) {
  const { mostrar } = useToast();
  const [telefone, setTelefone] = useState(mascaraTelefone(membro.telefone));
  const [endereco, setEndereco] = useState(membro.endereco);
  const [erros, setErros] = useState<ErrosDados>({});
  const [erroApi, setErroApi] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const encontrados = validarDadosDoAluno(telefone, endereco);
    setErros(encontrados);
    setErroApi(null);
    if (Object.keys(encontrados).length > 0) return;

    setEnviando(true);
    try {
      const dados = await atualizarMeusDados({
        telefone: apenasDigitos(telefone),
        endereco: endereco.trim(),
      });
      mostrar("Dados atualizados.");
      onAtualizado(dados);
    } catch (e) {
      setErroApi((e as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Cartao titulo="Seus dados" descricao="Nome e CPF só podem ser alterados pela recepção.">
      <form onSubmit={aoEnviar} className="flex flex-col gap-[18px]">
        <dl className="grid gap-4 sm:grid-cols-2">
          <Dado rotulo="Nome" valor={membro.nome} />
          <Dado rotulo="CPF" valor={mascaraCpf(membro.cpf)} />
          <Dado rotulo="Cadastro em" valor={formatarData(membro.dataCadastro)} />
          <Dado rotulo="Mensalidade" valor={textoDaMensalidade(membro)} />
        </dl>
        <Input
          rotulo="Telefone"
          obrigatorio
          type="tel"
          inputMode="tel"
          value={telefone}
          onChange={(e) => setTelefone(mascaraTelefone(e.target.value))}
          disabled={enviando}
          erro={erros.telefone}
        />
        <Input
          rotulo="Endereço"
          obrigatorio
          value={endereco}
          onChange={(e) => setEndereco(e.target.value)}
          disabled={enviando}
          erro={erros.endereco}
        />
        <Rodape erro={erroApi} enviando={enviando} rotulo="Salvar dados" />
      </form>
    </Cartao>
  );
}

type DadosDoFuncionarioProps = {
  funcionario: FuncionarioDoPerfil;
  onAtualizado: (dados: Dados) => void;
};

function DadosDoFuncionario({ funcionario, onAtualizado }: DadosDoFuncionarioProps) {
  const { mostrar } = useToast();
  const [nome, setNome] = useState(funcionario.nome);
  const [erros, setErros] = useState<ErrosDados>({});
  const [erroApi, setErroApi] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const encontrados = validarDadosDoFuncionario(nome);
    setErros(encontrados);
    setErroApi(null);
    if (Object.keys(encontrados).length > 0) return;

    setEnviando(true);
    try {
      const dados = await atualizarMeusDados({ nome: nome.trim() });
      mostrar("Dados atualizados.");
      onAtualizado(dados);
    } catch (e) {
      setErroApi((e as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Cartao titulo="Seus dados" descricao="Login e cargo só podem ser alterados pelo administrador.">
      <form onSubmit={aoEnviar} className="flex flex-col gap-[18px]">
        <dl className="grid gap-4 sm:grid-cols-2">
          <Dado rotulo="Login" valor={funcionario.login} />
          <Dado rotulo="Cargo" valor={ROTULO_CARGO[funcionario.cargo]} />
        </dl>
        <Input
          rotulo="Nome"
          obrigatorio
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          disabled={enviando}
          erro={erros.nome}
        />
        <Rodape erro={erroApi} enviando={enviando} rotulo="Salvar dados" />
      </form>
    </Cartao>
  );
}

function TrocarSenha() {
  const { mostrar } = useToast();
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erros, setErros] = useState<ErrosSenha>({});
  const [erroApi, setErroApi] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const encontrados = validarTrocaDeSenha(senhaAtual, novaSenha, confirmacao);
    setErros(encontrados);
    setErroApi(null);
    if (Object.keys(encontrados).length > 0) return;

    setEnviando(true);
    try {
      await trocarSenha(senhaAtual, novaSenha);
      mostrar("Senha alterada.");
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmacao("");
    } catch (e) {
      // 422 "Senha atual incorreta" fica no campo da senha atual.
      setErros({ senhaAtual: (e as Error).message });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Cartao titulo="Trocar senha" descricao="Mínimo de 8 caracteres.">
      <form onSubmit={aoEnviar} className="flex flex-col gap-[18px]">
        <Input
          rotulo="Senha atual"
          obrigatorio
          type="password"
          autoComplete="current-password"
          value={senhaAtual}
          onChange={(e) => setSenhaAtual(e.target.value)}
          disabled={enviando}
          erro={erros.senhaAtual}
        />
        <Input
          rotulo="Nova senha"
          obrigatorio
          type="password"
          autoComplete="new-password"
          value={novaSenha}
          onChange={(e) => setNovaSenha(e.target.value)}
          disabled={enviando}
          erro={erros.novaSenha}
        />
        <Input
          rotulo="Confirmar nova senha"
          obrigatorio
          type="password"
          autoComplete="new-password"
          value={confirmacao}
          onChange={(e) => setConfirmacao(e.target.value)}
          disabled={enviando}
          erro={erros.confirmacao}
        />
        <Rodape erro={erroApi} enviando={enviando} rotulo="Trocar senha" />
      </form>
    </Cartao>
  );
}

function Rodape({
  erro,
  enviando,
  rotulo,
}: {
  erro: string | null;
  enviando: boolean;
  rotulo: string;
}) {
  return (
    <>
      {erro && (
        <p role="alert" className="text-sm text-red-600">
          {erro}
        </p>
      )}
      <div className="flex justify-end">
        <Button type="submit" disabled={enviando}>
          <Icone nome="check" tamanho={16} />
          {enviando ? "Salvando…" : rotulo}
        </Button>
      </div>
    </>
  );
}
