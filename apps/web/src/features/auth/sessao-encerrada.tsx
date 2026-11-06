"use client";

import { useEffect, useState } from "react";
import { ROTA_LOGIN } from "@/lib/protecao-rotas";
import { sair } from "./api";

// O layout (Server Component) não consegue apagar o cookie, então quem apaga é
// o DELETE de /api/sessao. Ir direto para o login não serve: o proxy ainda vê
// um token legível e devolveria para a área.
export function SessaoEncerrada() {
  const [falhou, setFalhou] = useState(false);

  useEffect(() => {
    sair().then(
      () => window.location.replace(ROTA_LOGIN),
      () => setFalhou(true),
    );
  }, []);

  return (
    <p role="status" className="p-4 text-sm text-zinc-600">
      {falhou
        ? "Não foi possível encerrar a sessão. Recarregue a página."
        : "Sua sessão terminou. Voltando para o login…"}
    </p>
  );
}
