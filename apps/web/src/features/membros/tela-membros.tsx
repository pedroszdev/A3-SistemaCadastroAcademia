"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useUsuario } from "@/features/auth/usuario";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { TabelaPaginada } from "@/components/ui/tabela-paginada";
import type { Coluna } from "@/components/ui/table";
import { mascaraCpf, mascaraTelefone } from "@/lib/format";
import { useListaPaginada } from "@/lib/use-lista-paginada";
import { listarMembros, type Membro } from "./api";
import { podeGerenciarMembros } from "./permissoes";

export const ESPERA_BUSCA_MS = 300;

const OPCOES_SITUACAO = [
  { valor: "true", rotulo: "Ativos" },
  { valor: "false", rotulo: "Inativos" },
];

// Mesmas classes do Button (components/ui/button.tsx), para o link ter a cara de botão.
const LINK_PRIMARIO =
  "rounded px-4 py-2 text-sm font-medium bg-zinc-900 text-white hover:bg-zinc-700";
const LINK_SECUNDARIO =
  "rounded px-4 py-2 text-sm font-medium border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-100";

const colunas: Coluna<Membro>[] = [
  { chave: "nome", titulo: "Nome", celula: (m) => m.nome },
  { chave: "cpf", titulo: "CPF", celula: (m) => mascaraCpf(m.cpf) },
  { chave: "telefone", titulo: "Telefone", celula: (m) => mascaraTelefone(m.telefone) },
  {
    chave: "situacao",
    titulo: "Situação",
    celula: (m) => <StatusBadge status={m.ativo ? "ATIVO" : "INATIVO"} />,
  },
  {
    chave: "acoes",
    titulo: "Ações",
    celula: (m) => (
      <Link
        href={`/membros/${encodeURIComponent(m.id)}`}
        aria-label={`Ver ficha de ${m.nome}`}
        className={LINK_SECUNDARIO}
      >
        Ver ficha
      </Link>
    ),
  },
];

export function TelaMembros() {
  const usuario = useUsuario();
  const { filtro, setFiltro, pagina, erro } = useListaPaginada(listarMembros, { page: 1 });
  const [texto, setTexto] = useState("");

  useEffect(() => {
    const termo = texto.trim();
    const timer = setTimeout(() => {
      // Devolver o filtro atual sem mudança evita recarregar a lista na montagem.
      setFiltro((atual) =>
        (atual.busca ?? "") === termo ? atual : { ...atual, busca: termo || undefined, page: 1 },
      );
    }, ESPERA_BUSCA_MS);
    return () => clearTimeout(timer);
  }, [texto, setFiltro]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-4">
        <Input
          rotulo="Buscar"
          placeholder="Nome ou CPF"
          type="search"
          autoComplete="off"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
        <Select
          rotulo="Situação"
          placeholder="Todas"
          opcoes={OPCOES_SITUACAO}
          value={filtro.ativo === undefined ? "" : String(filtro.ativo)}
          onChange={(e) =>
            setFiltro({
              ...filtro,
              ativo: e.target.value === "" ? undefined : e.target.value === "true",
              page: 1,
            })
          }
        />
        {podeGerenciarMembros(usuario) && (
          <Link href="/membros/novo" className={`ml-auto ${LINK_PRIMARIO}`}>
            Novo membro
          </Link>
        )}
      </div>

      <TabelaPaginada
        pagina={pagina}
        erro={erro}
        colunas={colunas}
        chaveDaLinha={(m) => m.id}
        vazio={<EmptyState titulo="Nenhum membro encontrado" />}
        onMudarPagina={(page) => setFiltro({ ...filtro, page })}
      />
    </div>
  );
}
