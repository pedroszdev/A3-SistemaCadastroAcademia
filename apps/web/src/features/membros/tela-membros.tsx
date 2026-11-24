"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CabecalhoPagina } from "@/components/layout/cabecalho-pagina";
import { Pessoa } from "@/components/ui/avatar";
import { LinkIcone } from "@/components/ui/botao-icone";
import { classesDoBotao } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { BarraDeFiltros, FiltroChips } from "@/components/ui/filtro-chips";
import { Icone } from "@/components/ui/icone";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { TabelaPaginada } from "@/components/ui/tabela-paginada";
import { AcoesDaLinha, type Coluna } from "@/components/ui/table";
import { useUsuario } from "@/features/auth/usuario";
import { formatarData, mascaraCpf, mascaraTelefone } from "@/lib/format";
import { useListaPaginada } from "@/lib/use-lista-paginada";
import { listarMembros, type Membro } from "./api";
import { podeGerenciarMembros } from "./permissoes";

export const ESPERA_BUSCA_MS = 300;

const OPCOES_SITUACAO = [
  { valor: "ativos", rotulo: "Ativos" },
  { valor: "inativos", rotulo: "Inativos" },
] as const;

type Situacao = (typeof OPCOES_SITUACAO)[number]["valor"];

function colunasDaLista(podeEditar: boolean): Coluna<Membro>[] {
  return [
    { chave: "nome", titulo: "Membro", celula: (m) => <Pessoa nome={m.nome} /> },
    {
      chave: "cpf",
      titulo: "CPF",
      celula: (m) => <span className="tabular-nums">{mascaraCpf(m.cpf)}</span>,
    },
    { chave: "telefone", titulo: "Telefone", celula: (m) => mascaraTelefone(m.telefone) },
    { chave: "cadastro", titulo: "Cadastro", celula: (m) => formatarData(m.dataCadastro) },
    {
      chave: "situacao",
      titulo: "Status",
      celula: (m) => <StatusBadge status={m.ativo ? "ATIVO" : "INATIVO"} />,
    },
    {
      chave: "acoes",
      titulo: "Ações",
      acoes: true,
      celula: (m) => {
        const id = encodeURIComponent(m.id);
        return (
          <AcoesDaLinha>
            <LinkIcone icone="olho" rotulo={`Ver ficha de ${m.nome}`} href={`/membros/${id}`} />
            {podeEditar && (
              <LinkIcone
                icone="editar"
                rotulo={`Editar ${m.nome}`}
                href={`/membros/${id}/editar`}
              />
            )}
          </AcoesDaLinha>
        );
      },
    },
  ];
}

export function TelaMembros() {
  const usuario = useUsuario();
  const podeEditar = podeGerenciarMembros(usuario);
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

  let situacao: Situacao | undefined;
  if (filtro.ativo !== undefined) situacao = filtro.ativo ? "ativos" : "inativos";

  return (
    <div className="flex flex-col gap-6">
      <CabecalhoPagina
        titulo="Membros"
        descricao="Cadastro e situação de cada aluno da academia."
        acoes={
          podeEditar && (
            <Link href="/membros/novo" className={classesDoBotao("primario")}>
              <Icone nome="mais" tamanho={16} />
              <span>Novo membro</span>
            </Link>
          )
        }
      />

      <BarraDeFiltros>
        <div className="max-w-[420px] flex-[1_1_320px]">
          <Input
            rotulo="Buscar"
            rotuloOculto
            icone="busca"
            placeholder="Buscar por nome ou CPF"
            type="search"
            autoComplete="off"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
          />
        </div>
        <FiltroChips
          rotulo="Situação"
          opcoes={OPCOES_SITUACAO}
          valor={situacao}
          todosNoFim
          onMudar={(valor) =>
            setFiltro({
              ...filtro,
              ativo: valor === undefined ? undefined : valor === "ativos",
              page: 1,
            })
          }
        />
      </BarraDeFiltros>

      <TabelaPaginada
        pagina={pagina}
        erro={erro}
        colunas={colunasDaLista(podeEditar)}
        chaveDaLinha={(m) => m.id}
        rotuloItens="membros"
        vazio={<EmptyState titulo="Nenhum membro encontrado" />}
        onMudarPagina={(page) => setFiltro({ ...filtro, page })}
      />

      <p className="text-[13px] text-suave">
        Membros não são excluídos: desativar preserva treinos, pagamentos e histórico.
      </p>
    </div>
  );
}
