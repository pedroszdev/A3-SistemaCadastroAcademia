"use client";

import { useState } from "react";
import { useUsuario } from "@/features/auth/usuario";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { TabelaPaginada } from "@/components/ui/tabela-paginada";
import type { Coluna } from "@/components/ui/table";
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

export function TelaFuncionarios() {
  const usuario = useUsuario();

  if (usuario.tipo !== "FUNCIONARIO" || usuario.cargo !== "ADMIN") {
    return (
      <EmptyState
        titulo="Acesso restrito"
        descricao="Só o administrador gerencia funcionários."
      />
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
    { chave: "nome", titulo: "Nome", celula: (f) => f.nome },
    { chave: "login", titulo: "Login", celula: (f) => f.login },
    { chave: "cargo", titulo: "Cargo", celula: (f) => ROTULO_CARGO[f.cargo] },
    {
      chave: "situacao",
      titulo: "Situação",
      celula: (f) => <StatusBadge status={f.ativo ? "ATIVO" : "INATIVO"} />,
    },
    {
      chave: "acoes",
      titulo: "Ações",
      celula: (f) => (
        <div className="flex gap-2">
          <Button
            variante="secundario"
            aria-label={`Editar ${f.nome}`}
            onClick={() => dialogForm.abrir(f)}
          >
            Editar
          </Button>
          <Button
            variante={f.ativo ? "perigo" : "secundario"}
            aria-label={`${f.ativo ? "Desativar" : "Reativar"} ${f.nome}`}
            onClick={() => setConfirmar(f)}
          >
            {f.ativo ? "Desativar" : "Reativar"}
          </Button>
        </div>
      ),
    },
  ];

  const acaoConfirmada = confirmar?.ativo ? "desativar" : "reativar";

  return (
    <div className="flex flex-col gap-4">
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
        <Button className="ml-auto" onClick={() => dialogForm.abrir()}>
          Novo funcionário
        </Button>
      </div>

      <TabelaPaginada
        pagina={pagina}
        erro={erro}
        colunas={colunas}
        chaveDaLinha={(f) => f.id}
        vazio={<EmptyState titulo="Nenhum funcionário encontrado" />}
        onMudarPagina={(page) => setFiltro({ ...filtro, page })}
      />

      <Dialog
        aberto={form.aberto}
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
      </Dialog>

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
