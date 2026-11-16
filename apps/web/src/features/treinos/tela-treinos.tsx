"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { TabelaPaginada } from "@/components/ui/tabela-paginada";
import type { Coluna } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { useUsuario } from "@/features/auth/usuario";
import type { MembroBusca } from "@/features/pagamentos/api";
import { BuscaMembro } from "@/features/pagamentos/busca-membro";
import { formatarData } from "@/lib/format";
import { useFormDialog } from "@/lib/use-form-dialog";
import { useListaPaginada } from "@/lib/use-lista-paginada";
import {
  excluirTreino,
  type FiltroTreinos,
  listarTreinos,
  podeEditarTreino,
  type Treino,
} from "./api";
import { FormTreino } from "./form-treino";
import { OPCOES_TIPO_TREINO, type TipoTreino } from "./tipos";

// O nome do membro sozinho não distingue os botões: o mesmo membro pode ter vários treinos.
function descricaoDoTreino(t: Treino): string {
  return `${t.tipo} de ${t.membro.nome} com início em ${formatarData(t.dataInicio)}`;
}

export function TelaTreinos() {
  const usuario = useUsuario();
  const podeEditar = podeEditarTreino(usuario);
  const { mostrar } = useToast();
  const { filtro, setFiltro, pagina, erro, recarregar } = useListaPaginada<FiltroTreinos, Treino>(
    listarTreinos,
    { page: 1 },
  );
  const [membroFiltro, setMembroFiltro] = useState<MembroBusca | null>(null);
  const dialogForm = useFormDialog<Treino>();
  const { form } = dialogForm;
  const [confirmar, setConfirmar] = useState<Treino | null>(null);
  const [processando, setProcessando] = useState(false);

  function aoSalvar() {
    mostrar(form.dados ? "Treino atualizado." : "Treino cadastrado.");
    dialogForm.concluir();
    recarregar();
  }

  function aoSelecionarMembro(membro: MembroBusca | null) {
    setMembroFiltro(membro);
    setFiltro({ ...filtro, membroId: membro?.id, page: 1 });
  }

  async function aoConfirmar() {
    if (!confirmar) return;
    const alvo = confirmar;
    setProcessando(true);
    try {
      await excluirTreino(alvo.id);
      mostrar("Treino excluído.");
      recarregar();
    } catch (e) {
      mostrar((e as Error).message, "erro");
      // O treino pode já ter sido excluído por outra pessoa.
      recarregar();
    } finally {
      setProcessando(false);
      // Só fecha se a confirmação aberta ainda é a deste pedido.
      setConfirmar((atual) => (atual === alvo ? null : atual));
    }
  }

  const colunas: Coluna<Treino>[] = [
    { chave: "membro", titulo: "Membro", celula: (t) => t.membro.nome },
    { chave: "tipo", titulo: "Tipo", celula: (t) => t.tipo },
    { chave: "duracao", titulo: "Duração", celula: (t) => `${t.duracao} min` },
    { chave: "inicio", titulo: "Início", celula: (t) => formatarData(t.dataInicio) },
    // RECEPCIONISTA só consulta: sem os botões, a coluna não tem o que mostrar.
    ...(podeEditar
      ? [
          {
            chave: "acoes",
            titulo: "Ações",
            celula: (t: Treino) => (
              <div className="flex gap-2">
                <Button
                  variante="secundario"
                  aria-label={`Editar treino ${descricaoDoTreino(t)}`}
                  onClick={() => dialogForm.abrir(t)}
                >
                  Editar
                </Button>
                <Button
                  variante="perigo"
                  aria-label={`Excluir treino ${descricaoDoTreino(t)}`}
                  onClick={() => setConfirmar(t)}
                >
                  Excluir
                </Button>
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-4">
        <Select
          rotulo="Tipo"
          placeholder="Todos os tipos"
          opcoes={OPCOES_TIPO_TREINO}
          value={filtro.tipo ?? ""}
          onChange={(e) =>
            setFiltro({
              ...filtro,
              tipo: (e.target.value || undefined) as TipoTreino | undefined,
              page: 1,
            })
          }
        />
        <BuscaMembro selecionado={membroFiltro} onSelecionar={aoSelecionarMembro} incluirInativos />
        {podeEditar && (
          <Button className="ml-auto" onClick={() => dialogForm.abrir()}>
            Novo treino
          </Button>
        )}
      </div>

      <TabelaPaginada
        pagina={pagina}
        erro={erro}
        colunas={colunas}
        chaveDaLinha={(t) => t.id}
        vazio={<EmptyState titulo="Nenhum treino encontrado" />}
        onMudarPagina={(page) => setFiltro({ ...filtro, page })}
      />

      <Dialog
        aberto={form.aberto}
        titulo={form.dados ? "Editar treino" : "Novo treino"}
        onFechar={dialogForm.fechar}
      >
        <FormTreino
          key={form.chave}
          treino={form.dados}
          onSalvo={aoSalvar}
          onCancelar={dialogForm.fechar}
          onEnviando={dialogForm.setOcupado}
        />
      </Dialog>

      <Dialog
        aberto={confirmar !== null}
        titulo="Excluir treino"
        onFechar={() => setConfirmar(null)}
        acoes={
          <>
            <Button variante="secundario" onClick={() => setConfirmar(null)}>
              Cancelar
            </Button>
            <Button variante="perigo" disabled={processando} onClick={aoConfirmar}>
              Confirmar
            </Button>
          </>
        }
      >
        {confirmar && (
          <p>
            Excluir o treino {descricaoDoTreino(confirmar)}? As atividades já registradas nele
            continuam no histórico, sem o vínculo com o treino.
          </p>
        )}
      </Dialog>
    </div>
  );
}
