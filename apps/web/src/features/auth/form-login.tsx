"use client";

import { type FormEvent, type KeyboardEvent, useState } from "react";
import { Button } from "@/components/ui/button";
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
    <>
      <div
        role="tablist"
        aria-label="Tipo de acesso"
        className="mb-4 grid grid-cols-2 gap-1 rounded border border-zinc-200 p-1"
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
            className={`rounded px-3 py-2 text-sm font-medium ${
              aba === item.aba
                ? "bg-zinc-900 text-white"
                : "text-zinc-700 hover:bg-zinc-100"
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
        className="flex flex-col gap-4"
      >
        {aba === "ALUNO" ? (
          <Input
            rotulo="CPF"
            name="cpf"
            inputMode="numeric"
            autoComplete="username"
            placeholder="000.000.000-00"
            value={cpf}
            onChange={(e) => setCpf(mascaraCpf(e.target.value))}
            required
          />
        ) : (
          <Input rotulo="Login" name="login" autoComplete="username" required />
        )}
        <Input
          rotulo="Senha"
          name="senha"
          type="password"
          autoComplete="current-password"
          required
        />
        {erro && (
          <p role="alert" className="text-sm text-red-600">
            {erro}
          </p>
        )}
        <Button type="submit" disabled={enviando}>
          {enviando ? "Entrando…" : "Entrar"}
        </Button>
      </form>
    </>
  );
}
