"use client";

import { type FormEvent, type KeyboardEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icone } from "@/components/ui/icone";
import { Input } from "@/components/ui/input";
import { apenasDigitos, mascaraCpf } from "@/lib/format";
import { ROTA_ALUNO, ROTA_INICIAL } from "@/lib/protecao-rotas";
import { entrar, entrarAluno } from "./api";

type Aba = "FUNCIONARIO" | "ALUNO";

const ABAS: readonly { aba: Aba; id: string; rotulo: string }[] = [
  { aba: "FUNCIONARIO", id: "aba-funcionario", rotulo: "Funcionário" },
  { aba: "ALUNO", id: "aba-aluno", rotulo: "Aluno" },
];

// Teclas do padrão de abas do WAI-ARIA: setas circulam, Home e End vão às pontas.
function indiceDaTecla(tecla: string, atual: number): number | null {
  switch (tecla) {
    case "ArrowRight":
      return (atual + 1) % ABAS.length;
    case "ArrowLeft":
      return (atual - 1 + ABAS.length) % ABAS.length;
    case "Home":
      return 0;
    case "End":
      return ABAS.length - 1;
    default:
      return null;
  }
}

export function FormLogin() {
  const [aba, setAba] = useState<Aba>("FUNCIONARIO");
  const [cpf, setCpf] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function trocarAba(nova: Aba) {
    setAba(nova);
    setCpf("");
    setErro(null);
  }

  function aoTeclarNaAba(evento: KeyboardEvent<HTMLButtonElement>) {
    const indice = indiceDaTecla(
      evento.key,
      ABAS.findIndex((item) => item.aba === aba),
    );
    if (indice === null) return;
    evento.preventDefault();
    const nova = ABAS[indice];
    if (nova.aba !== aba) trocarAba(nova.aba);
    document.getElementById(nova.id)?.focus();
  }

  async function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const dados = new FormData(evento.currentTarget);
    const senha = String(dados.get("senha") ?? "");
    setErro(null);
    setEnviando(true);

    try {
      if (aba === "ALUNO") {
        await entrarAluno({ cpf: apenasDigitos(cpf), senha });
      } else {
        await entrar({ login: String(dados.get("login") ?? ""), senha });
      }
      // Recarrega a página inteira para o layout ler o cookie novo.
      window.location.replace(aba === "ALUNO" ? ROTA_ALUNO : ROTA_INICIAL);
    } catch (e) {
      setErro((e as Error).message);
      setEnviando(false);
    }
  }

  return (
    <div className="flex flex-col gap-7">
      <div
        role="tablist"
        aria-label="Tipo de acesso"
        className="grid grid-cols-2 gap-1 rounded-xl bg-fundo-3 p-1"
      >
        {ABAS.map((item) => (
          <button
            key={item.aba}
            type="button"
            role="tab"
            id={item.id}
            aria-selected={aba === item.aba}
            aria-controls="painel-login"
            tabIndex={aba === item.aba ? 0 : -1}
            disabled={enviando}
            onClick={() => trocarAba(item.aba)}
            onKeyDown={aoTeclarNaAba}
            className={`min-h-11 cursor-pointer rounded-[9px] text-sm ${
              aba === item.aba
                ? "bg-white font-semibold text-tinta shadow-sm"
                : "font-medium text-suave hover:text-tinta"
            }`}
          >
            {item.rotulo}
          </button>
        ))}
      </div>
      <form
        key={aba}
        id="painel-login"
        role="tabpanel"
        aria-labelledby={ABAS.find((item) => item.aba === aba)?.id}
        onSubmit={aoEnviar}
        className="flex flex-col gap-[18px]"
      >
        {aba === "ALUNO" ? (
          <Input
            rotulo="CPF"
            name="cpf"
            icone="usuario"
            obrigatorio
            inputMode="numeric"
            autoComplete="username"
            placeholder="000.000.000-00"
            ajuda="Só números ou com pontos e traço."
            value={cpf}
            onChange={(e) => setCpf(mascaraCpf(e.target.value))}
            required
          />
        ) : (
          <Input
            rotulo="Login"
            name="login"
            icone="usuario"
            obrigatorio
            placeholder="ex.: recepcao"
            autoComplete="username"
            required
          />
        )}
        <Input
          rotulo="Senha"
          name="senha"
          type="password"
          icone="cadeado"
          obrigatorio
          placeholder="Sua senha"
          autoComplete="current-password"
          required
        />
        {erro && (
          <p role="alert" className="text-sm text-red-600">
            {erro}
          </p>
        )}
        <Button type="submit" disabled={enviando} className="min-h-[50px] rounded-xl text-[15px] font-bold">
          {enviando ? "Entrando…" : "Entrar"}
          <Icone nome="proximo" tamanho={16} />
        </Button>
      </form>
      {aba === "ALUNO" ? (
        <p className="rounded-xl bg-lima-fundo px-4 py-3.5 text-sm leading-relaxed text-lima-texto">
          O acesso do aluno é liberado pela recepção no cadastro. Se ainda não tem senha, fale
          com a recepção.
        </p>
      ) : (
        <p className="text-sm text-suave">Esqueceu a senha? Peça ao administrador para redefinir.</p>
      )}
    </div>
  );
}
