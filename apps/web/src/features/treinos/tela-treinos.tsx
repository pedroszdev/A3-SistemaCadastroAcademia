"use client";

import { type ReactNode, useState } from "react";
import { CabecalhoPagina } from "@/components/layout/cabecalho-pagina";
import { Pessoa } from "@/components/ui/avatar";
import { BotaoIcone } from "@/components/ui/botao-icone";
import { Button } from "@/components/ui/button";
import { DuasColunas } from "@/components/ui/cartao";
import { Dialog, PainelLateral } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { BarraDeFiltros, FiltroChips } from "@/components/ui/filtro-chips";
import { Icone } from "@/components/ui/icone";
import { TabelaPaginada } from "@/components/ui/tabela-paginada";
import { AcoesDaLinha, type Coluna } from "@/components/ui/table";
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
import { BadgeTipoTreino } from "./badge-tipo";
import { FormTreino } from "./form-treino";
import { OPCOES_TIPO_TREINO } from "./tipos";

// O nome do membro sozinho não distingue os botões: o mesmo membro pode ter vários treinos.
function descricaoDoTreino(t: Treino): string {
  return `${t.tipo} de ${t.membro.nome} com início em ${formatarData(t.dataInicio)}`;
}

type TelaTreinosProps = {
  // Na página /treinos o cabeçalho (com o botão Novo treino) vem daqui.
  cabecalho?: { titulo: string; descricao?: string };
};

export function TelaTreinos({ cabecalho }: TelaTreinosProps = {}) {
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
    setProcessando(true);
    try {
      await excluirTreino(confirmar.id);
      mostrar("Treino excluído.");
      recarregar();
    } catch (e) {
      mostrar((e as Error).message, "erro");
      // O treino pode já ter sido excluído por outra pessoa.
      recarregar();
    } finally {
      setProcessando(false);
      setConfirmar(null);
    }
  }

  // Durante o DELETE a confirmação não fecha: senão dava para reabri-la e o fim do pedido
  // antigo fecharia a nova.
  function fecharConfirmacao() {
    if (!processando) setConfirmar(null);
  }

  const colunas: Coluna<Treino>[] = [
    { chave: "membro", titulo: "Membro", celula: (t) => <Pessoa nome={t.membro.nome} /> },
    { chave: "tipo", titulo: "Tipo", celula: (t) => <BadgeTipoTreino tipo={t.tipo} /> },
    // Única forma de a RECEPCIONISTA ler a descrição: ela não abre a edição. O texto longo
    // (até 500 caracteres) é cortado na tela e fica inteiro no title.
    {
      chave: "descricao",
      titulo: "Descrição",
      celula: (t) => (
        <span className="block max-w-xs truncate" title={t.descricao}>
          {t.descricao}
        </span>
      ),
    },
    { chave: "duracao", titulo: "Duração", celula: (t) => `${t.duracao} min` },
    { chave: "inicio", titulo: "Início", celula: (t) => formatarData(t.dataInicio) },
    // RECEPCIONISTA só consulta: sem os botões, a coluna não tem o que mostrar.
    ...(podeEditar
      ? [
          {
            chave: "acoes",
            titulo: "Ações",
            acoes: true,
            celula: (t: Treino) => (
              <AcoesDaLinha>
                <BotaoIcone
                  icone="editar"
                  rotulo={`Editar treino ${descricaoDoTreino(t)}`}
                  onClick={() => dialogForm.abrir(t)}
                />
                <BotaoIcone
                  icone="lixeira"
                  tom="alerta"
                  rotulo={`Excluir treino ${descricaoDoTreino(t)}`}
                  onClick={() => setConfirmar(t)}
                />
              </AcoesDaLinha>
            ),
          },
        ]
      : []),
  ];

  const botaoNovo: ReactNode = podeEditar && (
    <Button onClick={() => dialogForm.abrir()}>
      <Icone nome="mais" tamanho={16} />
      Novo treino
    </Button>
  );

  return (
    <div className="flex flex-col gap-6">
      {cabecalho && <CabecalhoPagina {...cabecalho} acoes={botaoNovo} />}

      <BarraDeFiltros>
        <div className="max-w-[420px] flex-[1_1_320px]">
          <BuscaMembro
            selecionado={membroFiltro}
            onSelecionar={aoSelecionarMembro}
            incluirInativos
            rotuloOculto
            placeholder="Buscar por membro"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <FiltroChips
            rotulo="Tipo"
            opcoes={OPCOES_TIPO_TREINO}
            valor={filtro.tipo}
            onMudar={(tipo) => setFiltro({ ...filtro, tipo, page: 1 })}
          />
          {!cabecalho && botaoNovo}
        </div>
      </BarraDeFiltros>

      <DuasColunas
        principal={
          <TabelaPaginada
            pagina={pagina}
            erro={erro}
            colunas={colunas}
            chaveDaLinha={(t) => t.id}
            rotuloItens="treinos"
            vazio={<EmptyState titulo="Nenhum treino encontrado" />}
            onMudarPagina={(page) => setFiltro({ ...filtro, page })}
          />
        }
        lateral={
          form.aberto && (
            <PainelLateral
              aberto
              titulo={form.dados ? "Editar treino" : "Novo treino"}
              descricao={
                form.dados
                  ? `Ficha de ${form.dados.membro.nome}.`
                  : "Ficha planejada para um membro ativo."
              }
              onFechar={dialogForm.fechar}
            >
              <FormTreino
                key={form.chave}
                treino={form.dados}
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
        titulo="Excluir treino"
        onFechar={fecharConfirmacao}
        acoes={
          <>
            <Button variante="secundario" disabled={processando} onClick={fecharConfirmacao}>
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
