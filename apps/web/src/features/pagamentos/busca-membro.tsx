"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mascaraCpf } from "@/lib/format";
import { buscarMembrosAtivos, type MembroBusca } from "./api";

export const ESPERA_BUSCA_MS = 300;
export const MINIMO_BUSCA = 2;

type BuscaMembroProps = {
  selecionado: MembroBusca | null;
  onSelecionar: (membro: MembroBusca | null) => void;
  erro?: string;
};

type Resultado = { termo: string; membros: MembroBusca[] };

export function BuscaMembro({ selecionado, onSelecionar, erro }: BuscaMembroProps) {
  const [texto, setTexto] = useState("");
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [erroBusca, setErroBusca] = useState<string | null>(null);

  useEffect(() => {
    const termo = texto.trim();
    if (termo.length < MINIMO_BUSCA) return;

    let cancelado = false;
    const timer = setTimeout(() => {
      buscarMembrosAtivos(termo)
        .then((membros) => {
          if (cancelado) return;
          setResultado({ termo, membros });
          setErroBusca(null);
        })
        .catch((e: Error) => {
          if (!cancelado) setErroBusca(e.message);
        });
    }, ESPERA_BUSCA_MS);
    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
  }, [texto]);

  if (selecionado) {
    return (
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-zinc-800">Membro</span>
        <div className="flex items-center justify-between gap-2 rounded border border-zinc-300 px-3 py-2">
          <p className="text-sm">
            {selecionado.nome} · {mascaraCpf(selecionado.cpf)}
          </p>
          <Button variante="secundario" onClick={() => onSelecionar(null)}>
            Trocar
          </Button>
        </div>
      </div>
    );
  }

  const termoAtual = texto.trim();
  const buscando = termoAtual.length >= MINIMO_BUSCA;
  // Uma resposta de outro termo (mais antigo) não aparece.
  const membros = buscando && resultado?.termo === termoAtual ? resultado.membros : null;

  function escolher(membro: MembroBusca) {
    setTexto("");
    onSelecionar(membro);
  }

  return (
    <div className="flex flex-col gap-2">
      <Input
        rotulo="Membro"
        placeholder="Nome ou CPF"
        autoComplete="off"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        erro={erro}
      />
      {buscando && erroBusca && (
        <p role="alert" className="text-sm text-red-600">
          {erroBusca}
        </p>
      )}
      {membros && membros.length === 0 && (
        <p className="text-sm text-zinc-600">Nenhum membro ativo encontrado</p>
      )}
      {membros && membros.length > 0 && (
        <ul aria-label="Membros encontrados" className="flex flex-col gap-1">
          {membros.map((membro) => (
            <li key={membro.id}>
              <button
                type="button"
                className="w-full rounded border border-zinc-300 px-3 py-2 text-left text-sm hover:bg-zinc-100"
                onClick={() => escolher(membro)}
              >
                {membro.nome} · {mascaraCpf(membro.cpf)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
