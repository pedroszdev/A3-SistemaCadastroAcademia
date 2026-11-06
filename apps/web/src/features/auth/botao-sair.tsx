"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { ROTA_LOGIN } from "@/lib/protecao-rotas";
import { sair } from "./api";

export function BotaoSair() {
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
    <Button variante="secundario" onClick={aoClicar} disabled={saindo}>
      Sair
    </Button>
  );
}
