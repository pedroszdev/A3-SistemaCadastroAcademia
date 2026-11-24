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
  // RN04: por padrão só os ativos, porque só membro ativo recebe pagamento ou atividade.
  // A API ainda responde 422 se o membro for desativado depois da busca. O histórico, que
  // só consulta, inclui os inativos.
  incluirInativos?: boolean;
  // Durante o envio do formulário em volta, o membro escolhido não pode ser trocado.
  desabilitado?: boolean;
  // Texto de apoio do campo (ex.: "Membros inativos não aparecem.").
  ajuda?: string;
  // Na barra de filtros o rótulo fica só para leitor de tela.
  rotuloOculto?: boolean;
  placeholder?: string;
  rotulo?: string;
  // Marca o rótulo com "*" nos formulários.
  obrigatorio?: boolean;
};

type Resultado = { termo: string; membros: MembroBusca[]; total: number };
type ErroBusca = { termo: string; mensagem: string };

export function BuscaMembro({
  selecionado,
  onSelecionar,
  erro,
  incluirInativos = false,
  desabilitado = false,
  ajuda = "Busque pelo nome ou CPF.",
  rotuloOculto = false,
  placeholder = "Nome ou CPF",
  rotulo = "Membro",
  obrigatorio = false,
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
      <div className="flex flex-col gap-1.5">
        <span
          className={
            rotuloOculto
              ? "sr-only"
              : `text-sm font-semibold ${obrigatorio ? "after:text-alerta after:content-['_*']" : ""}`
          }
        >
          {rotulo}
        </span>
        <div className="flex min-h-[46px] items-center justify-between gap-2 rounded-[10px] border border-borda-campo bg-white py-1 pr-1 pl-3.5">
          <p className="truncate text-[15px] font-semibold">
            {selecionado.nome} · {mascaraCpf(selecionado.cpf)}
          </p>
          <Button
            variante="secundario"
            tamanho="pequeno"
            onClick={() => onSelecionar(null)}
            disabled={desabilitado}
          >
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
    <div className="relative flex flex-col gap-2">
      <Input
        rotulo={rotulo}
        rotuloOculto={rotuloOculto}
        obrigatorio={obrigatorio}
        icone="busca"
        type="search"
        placeholder={placeholder}
        ajuda={rotuloOculto ? undefined : ajuda}
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
        <p className="text-sm text-suave">
          {incluirInativos ? "Nenhum membro encontrado" : "Nenhum membro ativo encontrado"}
        </p>
      )}
      {membros && membros.length > 0 && (
        <ul
          aria-label="Membros encontrados"
          className="flex flex-col overflow-hidden rounded-xl border border-borda bg-white shadow-sm"
        >
          {membros.map((membro) => (
            <li key={membro.id}>
              <button
                type="button"
                className="w-full cursor-pointer border-b border-borda px-3.5 py-2.5 text-left text-sm last:border-b-0 hover:bg-fundo-2"
                onClick={() => escolher(membro)}
              >
                {membro.nome} · {mascaraCpf(membro.cpf)}
              </button>
            </li>
          ))}
        </ul>
      )}
      {doTermo && doTermo.total > doTermo.membros.length && (
        <p className="text-sm text-suave">
          Mostrando {doTermo.membros.length} de {doTermo.total}. Refine a busca para ver os outros.
        </p>
      )}
    </div>
  );
}
