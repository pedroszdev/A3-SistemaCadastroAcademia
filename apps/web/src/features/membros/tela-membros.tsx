"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { TabelaPaginada } from "@/components/ui/tabela-paginada";
import type { Coluna } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { useUsuario } from "@/features/auth/usuario";
import { mascaraCpf, mascaraTelefone } from "@/lib/format";
import { useFormDialog } from "@/lib/use-form-dialog";
import { useListaPaginada } from "@/lib/use-lista-paginada";
import { listarMembros, type Membro, podeGerirMembros } from "./api";
import { FormMembro } from "./form-membro";

export const ESPERA_BUSCA_MS = 300;

const OPCOES_SITUACAO = [
  { valor: "true", rotulo: "Ativos" },
  { valor: "false", rotulo: "Inativos" },
];

const COLUNAS: Coluna<Membro>[] = [
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
        href={`/membros/${m.id}`}
        aria-label={`Ver ficha de ${m.nome}`}
        className="inline-block rounded border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-100"
      >
        Ver ficha
      </Link>
    ),
  },
];

export function TelaMembros() {
  const usuario = useUsuario();
  const { mostrar } = useToast();
  const { filtro, setFiltro, pagina, erro, recarregar } = useListaPaginada(listarMembros, {
    page: 1,
  });
  const dialogForm = useFormDialog();
  const { form } = dialogForm;
  const [texto, setTexto] = useState("");

  // Debounce: a lista só é buscada depois que o usuário para de digitar.
  useEffect(() => {
    const busca = texto.trim() || undefined;
    const timer = setTimeout(() => {
      setFiltro((atual) => (atual.busca === busca ? atual : { ...atual, busca, page: 1 }));
    }, ESPERA_BUSCA_MS);
    return () => clearTimeout(timer);
  }, [texto, setFiltro]);

  function aoSalvar() {
    mostrar("Membro cadastrado.");
    dialogForm.concluir();
    recarregar();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-4">
        <Input
          rotulo="Buscar por nome ou CPF"
          type="search"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
        <Select
          rotulo="Situação"
          placeholder="Todos"
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
        {podeGerirMembros(usuario) && (
          <Button className="ml-auto" onClick={() => dialogForm.abrir()}>
            Novo membro
          </Button>
        )}
      </div>

      <TabelaPaginada
        pagina={pagina}
        erro={erro}
        colunas={COLUNAS}
        chaveDaLinha={(m) => m.id}
        vazio={<EmptyState titulo="Nenhum membro encontrado" />}
        onMudarPagina={(page) => setFiltro({ ...filtro, page })}
      />

      <Dialog aberto={form.aberto} titulo="Novo membro" onFechar={dialogForm.fechar}>
        <FormMembro
          key={form.chave}
          onSalvo={aoSalvar}
          onCancelar={dialogForm.fechar}
          onEnviando={dialogForm.setOcupado}
        />
      </Dialog>
    </div>
  );
}
