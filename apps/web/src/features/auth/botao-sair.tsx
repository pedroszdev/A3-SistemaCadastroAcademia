"use client";

import { useState } from "react";
import { Icone } from "@/components/ui/icone";
import { useToast } from "@/components/ui/toast";
import { ROTA_LOGIN } from "@/lib/protecao-rotas";
import { sair } from "./api";

// Ícone de saída sobre fundo escuro (menu lateral e cabeçalho do portal do aluno).
// "compacto" é a versão menor do cartão do usuário no menu lateral, onde o nome do cargo
// precisa do espaço.
export function BotaoSair({ compacto = false }: { compacto?: boolean }) {
  const { mostrar } = useToast();
  const [saindo, setSaindo] = useState(false);

  async function aoClicar() {
    setSaindo(true);
    try {
      await sair();
      window.location.replace(ROTA_LOGIN);
    } catch (e) {
      mostrar((e as Error).message, "erro");
      setSaindo(false);
    }
  }

  return (
    <button
      type="button"
      aria-label="Sair"
      title="Sair"
      onClick={aoClicar}
      disabled={saindo}
      className={`flex ${compacto ? "size-8" : "size-11"} shrink-0 cursor-pointer items-center justify-center rounded-lg text-suave-escuro hover:bg-tinta-3 hover:text-white disabled:cursor-not-allowed disabled:opacity-50`}
    >
      <Icone nome="sair" />
    </button>
  );
}
