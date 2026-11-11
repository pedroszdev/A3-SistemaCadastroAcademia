"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mascaraCpf } from "@/lib/format";
import { buscarMembros, type MembroBusca } from "./api";

export const ESPERA_BUSCA_MS = 300;
export const MINIMO_BUSCA = 2;

type BuscaMembroProps = {
  selecionado: MembroBusca | null;
  onSelecionar: (membro: MembroBusca | null) => void;
  erro?: string;
  incluirInativos?: boolean;
  rotulo?: string;
  // Durante o envio do formulário em volta, o membro escolhido não pode ser trocado.
  desabilitado?: boolean;
};

type Resultado = { termo: string; membros: MembroBusca[]; total: number };
type ErroBusca = { termo: string; mensagem: string };

export function BuscaMembro({
  selecionado,
  onSelecionar,
  erro,
  incluirInativos = false,
  rotulo = "Membro",
  desabilitado = false,
}: BuscaMembroProps) {
  const [texto, setTexto] = useState("");
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [erroBusca, setErroBusca] = useState<ErroBusca | null>(null);
  const termoAtual = texto.trim();

  useEffect(() => {
    const termo = termoAtual;
    if (termo.length < MINIMO_BUSCA) return;

    let cancelado = false;
    const timer = setTimeout(() => {
      buscarMembros(termo, { incluirInativos })
        .then(({ membros, total }) => {
          if (cancelado) return;
          setResultado({ termo, membros, total });
          setErroBusca(null);
        })
        .catch((e: Error) => {
          if (!cancelado) setErroBusca({ termo, mensagem: e.message });
        });
    }, ESPERA_BUSCA_MS);
    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
  }, [termoAtual, incluirInativos]);

  if (selecionado) {
    return (
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-zinc-800">{rotulo}</span>
        <div className="flex items-center justify-between gap-2 rounded border border-zinc-300 px-3 py-2">
          <p className="text-sm">
            {selecionado.nome} · {mascaraCpf(selecionado.cpf)}
          </p>
          <Button variante="secundario" onClick={() => onSelecionar(null)} disabled={desabilitado}>
            Trocar
          </Button>
        </div>
      </div>
    );
  }

  const buscando = termoAtual.length >= MINIMO_BUSCA;
  // Uma resposta ou um erro de outro termo (mais antigo) não aparece.
  const doTermo = buscando && resultado?.termo === termoAtual ? resultado : null;
  const membros = doTermo?.membros ?? null;
  const mensagemErro = buscando && erroBusca?.termo === termoAtual ? erroBusca.mensagem : null;

  function escolher(membro: MembroBusca) {
    setTexto("");
    onSelecionar(membro);
  }

  return (
    <div className="flex flex-col gap-2">
      <Input
        rotulo={rotulo}
        placeholder="Nome ou CPF"
        autoComplete="off"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        // O campo fica dentro do <form> do pagamento: Enter aqui não deve enviá-lo.
        onKeyDown={(e) => {
          if (e.key === "Enter") e.preventDefault();
        }}
        erro={erro}
      />
      {mensagemErro && (
        <p role="alert" className="text-sm text-red-600">
          {mensagemErro}
        </p>
      )}
      {membros && membros.length === 0 && (
        <p className="text-sm text-zinc-600">
          {incluirInativos ? "Nenhum membro encontrado" : "Nenhum membro ativo encontrado"}
        </p>
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
      {doTermo && doTermo.total > doTermo.membros.length && (
        <p className="text-sm text-zinc-600">
          Mostrando {doTermo.membros.length} de {doTermo.total}. Refine a busca para ver os outros.
        </p>
      )}
    </div>
  );
}
