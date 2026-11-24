"use client";

import { useState } from "react";
import { CabecalhoPagina } from "@/components/layout/cabecalho-pagina";
import { useUsuario } from "@/features/auth/usuario";
import { Pessoa } from "@/components/ui/avatar";
import { BotaoIcone } from "@/components/ui/botao-icone";
import { Button } from "@/components/ui/button";
import { Cartao, DuasColunas } from "@/components/ui/cartao";
import { Dialog, PainelLateral } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Icone } from "@/components/ui/icone";
import { Select } from "@/components/ui/select";
import { Badge, StatusBadge, type TomBadge } from "@/components/ui/status-badge";
import { TabelaPaginada } from "@/components/ui/tabela-paginada";
import { AcoesDaLinha, type Coluna, Table } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import type { Cargo } from "@/lib/sessao";
import { useFormDialog } from "@/lib/use-form-dialog";
import { useListaPaginada } from "@/lib/use-lista-paginada";
import {
  desativarFuncionario,
  type Funcionario,
  listarFuncionarios,
  reativarFuncionario,
} from "./api";
import { OPCOES_CARGO, ROTULO_CARGO } from "./cargos";
import { FormFuncionario } from "./form-funcionario";

const OPCOES_SITUACAO = [
  { valor: "true", rotulo: "Ativos" },
  { valor: "false", rotulo: "Inativos" },
];

const TOM_DO_CARGO: Record<Cargo, TomBadge> = {
  ADMIN: "escuro",
  RECEPCIONISTA: "info",
  INSTRUTOR: "lima",
};

const TITULO = "Funcionários";
const DESCRICAO = "Equipe com acesso ao sistema. Só o administrador gerencia.";

// Espelha a matriz 4.2 do backlog, só para consulta.
type Permissao = { nome: string; admin: boolean; recepcao: boolean; instrutor: boolean };

const PERMISSOES: Permissao[] = [
  { nome: "Membros: cadastrar e editar", admin: true, recepcao: true, instrutor: false },
  { nome: "Treinos e atividades", admin: true, recepcao: false, instrutor: true },
  { nome: "Pagamentos", admin: true, recepcao: true, instrutor: false },
  { nome: "Funcionários", admin: true, recepcao: false, instrutor: false },
];

function Marca({ pode }: { pode: boolean }) {
  return pode ? (
    <span className="inline-flex justify-center text-sucesso">
      <Icone nome="check" espessura={2.2} />
      <span className="sr-only">Sim</span>
    </span>
  ) : (
    <span className="text-suave">
      <span aria-hidden="true">—</span>
      <span className="sr-only">Não</span>
    </span>
  );
}

function MatrizDePermissoes() {
  const colunas: Coluna<Permissao>[] = [
    { chave: "nome", titulo: "Permissão", celula: (p) => p.nome },
    { chave: "admin", centralizar: true, titulo: "Admin", celula: (p) => <Marca pode={p.admin} /> },
    { chave: "recepcao", centralizar: true, titulo: "Recepção", celula: (p) => <Marca pode={p.recepcao} /> },
    { chave: "instrutor", centralizar: true, titulo: "Instrutor", celula: (p) => <Marca pode={p.instrutor} /> },
  ];
  return (
    <Cartao titulo="O que cada cargo pode fazer" espaco="compacto">
      <Table colunas={colunas} linhas={PERMISSOES} chaveDaLinha={(p) => p.nome} moldura={false} />
    </Cartao>
  );
}

export function TelaFuncionarios() {
  const usuario = useUsuario();

  if (usuario.tipo !== "FUNCIONARIO" || usuario.cargo !== "ADMIN") {
    return (
      <div className="flex flex-col gap-6">
        <CabecalhoPagina titulo={TITULO} descricao={DESCRICAO} />
        <EmptyState
          titulo="Acesso restrito"
          descricao="Só o administrador gerencia funcionários."
        />
      </div>
    );
  }

  return <GestaoFuncionarios />;
}

function GestaoFuncionarios() {
  const { mostrar } = useToast();
  const { filtro, setFiltro, pagina, erro, recarregar } = useListaPaginada(listarFuncionarios, {
    page: 1,
  });
  const dialogForm = useFormDialog<Funcionario>();
  const { form } = dialogForm;
  const [confirmar, setConfirmar] = useState<Funcionario | null>(null);
  const [processando, setProcessando] = useState(false);

  function aoSalvar() {
    mostrar(form.dados ? "Funcionário atualizado." : "Funcionário cadastrado.");
    dialogForm.concluir();
    recarregar();
  }

  async function aoConfirmar() {
    if (!confirmar) return;
    const alvo = confirmar;
    const desativando = alvo.ativo;
    setProcessando(true);
    try {
      if (desativando) {
        await desativarFuncionario(alvo.id);
      } else {
        await reativarFuncionario(alvo.id);
      }
      mostrar(desativando ? "Funcionário desativado." : "Funcionário reativado.");
      recarregar();
    } catch (e) {
      mostrar((e as Error).message, "erro");
    } finally {
      setProcessando(false);
      // Só fecha se a confirmação aberta ainda é a deste pedido.
      setConfirmar((atual) => (atual === alvo ? null : atual));
    }
  }

  const colunas: Coluna<Funcionario>[] = [
    { chave: "nome", titulo: "Funcionário", celula: (f) => <Pessoa nome={f.nome} /> },
    {
      chave: "login",
      titulo: "Login",
      celula: (f) => <code className="rounded-md bg-fundo-2 px-2 py-0.5 text-[13px]">{f.login}</code>,
    },
    {
      chave: "cargo",
      titulo: "Cargo",
      celula: (f) => (
        <span title={ROTULO_CARGO[f.cargo]}>
          <Badge tom={TOM_DO_CARGO[f.cargo]}>{f.cargo}</Badge>
        </span>
      ),
    },
    {
      chave: "situacao",
      titulo: "Status",
      celula: (f) => <StatusBadge status={f.ativo ? "ATIVO" : "INATIVO"} />,
    },
    {
      chave: "acoes",
      titulo: "Ações",
      acoes: true,
      celula: (f) => (
        <AcoesDaLinha>
          <BotaoIcone icone="editar" rotulo={`Editar ${f.nome}`} onClick={() => dialogForm.abrir(f)} />
          <BotaoIcone
            icone="energia"
            tom={f.ativo ? "alerta" : "sucesso"}
            rotulo={`${f.ativo ? "Desativar" : "Reativar"} ${f.nome}`}
            onClick={() => setConfirmar(f)}
          />
        </AcoesDaLinha>
      ),
    },
  ];

  const acaoConfirmada = confirmar?.ativo ? "desativar" : "reativar";

  return (
    <div className="flex flex-col gap-6">
      <CabecalhoPagina
        titulo={TITULO}
        descricao={DESCRICAO}
        acoes={
          <Button onClick={() => dialogForm.abrir()}>
            <Icone nome="mais" tamanho={16} />
            Novo funcionário
          </Button>
        }
      />

      <div className="flex flex-wrap items-end gap-4">
        <Select
          rotulo="Cargo"
          placeholder="Todos os cargos"
          opcoes={OPCOES_CARGO}
          value={filtro.cargo ?? ""}
          onChange={(e) =>
            setFiltro({ ...filtro, cargo: (e.target.value || undefined) as Cargo | undefined, page: 1 })
          }
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
      </div>

      <DuasColunas
        principal={
          <div className="flex flex-col gap-5">
            <TabelaPaginada
              pagina={pagina}
              erro={erro}
              colunas={colunas}
              chaveDaLinha={(f) => f.id}
              rotuloItens="funcionários"
              vazio={<EmptyState titulo="Nenhum funcionário encontrado" />}
              onMudarPagina={(page) => setFiltro({ ...filtro, page })}
            />
            <MatrizDePermissoes />
          </div>
        }
        lateral={
          form.aberto && (
            <PainelLateral
              aberto
              titulo={form.dados ? "Editar funcionário" : "Novo funcionário"}
              onFechar={dialogForm.fechar}
            >
              <FormFuncionario
                key={form.chave}
                funcionario={form.dados}
                onSalvo={aoSalvar}
                onCancelar={dialogForm.fechar}
                onEnviando={dialogForm.setOcupado}
              />
            </PainelLateral>
          )
        }
      />

      <Dialog
        aberto={confirmar !== null}
        titulo={confirmar?.ativo ? "Desativar funcionário" : "Reativar funcionário"}
        onFechar={() => setConfirmar(null)}
        acoes={
          <>
            <Button variante="secundario" onClick={() => setConfirmar(null)}>
              Cancelar
            </Button>
            <Button
              variante={confirmar?.ativo ? "perigo" : "primario"}
              disabled={processando}
              onClick={aoConfirmar}
            >
              Confirmar
            </Button>
          </>
        }
      >
        <p>
          Deseja {acaoConfirmada} {confirmar?.nome}?
        </p>
      </Dialog>
    </div>
  );
}
