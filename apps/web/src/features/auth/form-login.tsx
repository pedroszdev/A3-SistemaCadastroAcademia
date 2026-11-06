"use client";

import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROTA_INICIAL } from "@/lib/protecao-rotas";
import { entrar } from "./api";

export function FormLogin() {
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const dados = new FormData(evento.currentTarget);
    setErro(null);
    setEnviando(true);

    try {
      await entrar({
        login: String(dados.get("login") ?? ""),
        senha: String(dados.get("senha") ?? ""),
      });
      // Recarrega a página inteira para o layout ler o cookie novo.
      window.location.replace(ROTA_INICIAL);
    } catch (e) {
      setErro((e as Error).message);
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={aoEnviar} className="flex flex-col gap-4">
      <Input rotulo="Login" name="login" autoComplete="username" required />
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
  );
}
