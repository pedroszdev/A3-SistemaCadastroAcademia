"use client";

import { useEffect, useState } from "react";
import { useUsuario } from "@/features/auth/usuario";
import { temAcessoFinanceiro } from "@/lib/menu";
import {
  type MembroInadimplente,
  type ResumoDashboard,
  buscarInadimplentes,
  buscarResumo,
} from "./api";
import { CardsResumo } from "./cards-resumo";
import { ListaInadimplentes } from "./lista-inadimplentes";

// A lista falha sozinha: um erro nela não pode esconder os cards do resumo.
type Lista = { membros: MembroInadimplente[] } | { erro: string };

type Estado =
  | { situacao: "carregando" }
  | { situacao: "erro"; mensagem: string }
  | {
      situacao: "pronto";
      resumo: ResumoDashboard;
      lista: Lista | null;
    };

export function PainelDashboard() {
  const verInadimplentes = temAcessoFinanceiro(useUsuario());
  const [estado, setEstado] = useState<Estado>({ situacao: "carregando" });

  useEffect(() => {
    let ativo = true;

    const buscaLista: Promise<Lista | null> = verInadimplentes
      ? buscarInadimplentes().then(
          (membros) => ({ membros }),
          (e: unknown) => ({ erro: (e as Error).message }),
        )
      : Promise.resolve(null);

    Promise.all([buscarResumo(), buscaLista])
      .then(([resumo, lista]) => {
        if (ativo) setEstado({ situacao: "pronto", resumo, lista });
      })
      .catch((e: unknown) => {
        if (ativo) setEstado({ situacao: "erro", mensagem: (e as Error).message });
      });

    return () => {
      ativo = false;
    };
  }, [verInadimplentes]);

  if (estado.situacao === "carregando") {
    return <p className="text-sm text-zinc-600">Carregando…</p>;
  }

  if (estado.situacao === "erro") {
    return (
      <p role="alert" className="text-sm text-red-600">
        {estado.mensagem}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <CardsResumo resumo={estado.resumo} />
      {estado.lista &&
        ("erro" in estado.lista ? (
          <p role="alert" className="text-sm text-red-600">
            {estado.lista.erro}
          </p>
        ) : (
          <ListaInadimplentes membros={estado.lista.membros} />
        ))}
    </div>
  );
}
