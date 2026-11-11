"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { TabelaPaginada } from "@/components/ui/tabela-paginada";
import { type Coluna } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { useUsuario } from "@/features/auth/usuario";
import type { MembroBusca } from "@/features/pagamentos/api";
import { BuscaMembro } from "@/features/pagamentos/busca-membro";
import { formatarData } from "@/lib/format";
import { useFormEmDialog, useListaPaginada } from "@/lib/use-lista-paginada";
import {
  type Atividade,
  type FiltroAtividades,
  listarAtividades,
  listarAtividadesDoMembro,
  listarFuncionariosParaFiltro,
  podeFiltrarPorFuncionario,
  podeRegistrarAtividade,
} from "./api";
import { FormAtividade } from "./form-atividade";

type OpcaoFuncionario = { id: string; nome: string };

const COLUNA_MEMBRO: Coluna<Atividade> = {
  chave: "membro",
  titulo: "Membro",
  celula: (a) => a.membro.nome,
};

const COLUNAS: Coluna<Atividade>[] = [
  { chave: "data", titulo: "Data", celula: (a) => formatarData(a.data) },
  COLUNA_MEMBRO,
  { chave: "atividade", titulo: "Atividade", celula: (a) => a.atividade },
  { chave: "tempo", titulo: "Tempo", celula: (a) => `${a.tempoExecucao} min` },
  { chave: "treino", titulo: "Treino", celula: (a) => a.treino?.tipo ?? "—" },
  { chave: "funcionario", titulo: "Funcionário", celula: (a) => a.funcionario.nome },
];

// Na ficha do membro a coluna Membro repetiria o mesmo nome em toda linha.
const COLUNAS_DO_MEMBRO = COLUNAS.filter((c) => c !== COLUNA_MEMBRO);

type TelaHistoricoProps = {
  // Na ficha do membro (WEB-Y4) a lista e o formulário ficam presos a esse membro.
  membroId?: string;
  // Membro inativo não registra atividade (a API responde 422).
  membroInativo?: boolean;
  // Chamado depois de registrar, para a ficha atualizar o resumo.
  onAlterado?: () => void;
};

export function TelaHistorico({ membroId, membroInativo = false, onAlterado }: TelaHistoricoProps) {
  const usuario = useUsuario();
  const filtraPorFuncionario = podeFiltrarPorFuncionario(usuario);
  const [funcionarios, setFuncionarios] = useState<OpcaoFuncionario[]>([]);

  useEffect(() => {
    if (!filtraPorFuncionario) return;

    let cancelado = false;
    listarFuncionariosParaFiltro()
      .then((resultado) => {
        if (!cancelado) setFuncionarios(resultado);
      })
      .catch(() => {
        if (!cancelado) setFuncionarios([]);
      });
    return () => {
      cancelado = true;
    };
  }, [filtraPorFuncionario]);

  // "" conta como sem membro, igual a undefined.
  const membroFixo = membroId || undefined;

  // A key zera filtros, página e formulário ao trocar de membro. Os funcionários
  // ficam aqui fora e não são buscados de novo.
  return (
    <ListaHistorico
      key={membroFixo}
      membroFixo={membroFixo}
      membroInativo={membroInativo}
      onAlterado={onAlterado}
      funcionarios={filtraPorFuncionario ? funcionarios : null}
    />
  );
}

type ListaHistoricoProps = {
  membroFixo: string | undefined;
  membroInativo: boolean;
  onAlterado?: () => void;
  // null: o usuário não filtra por funcionário.
  funcionarios: OpcaoFuncionario[] | null;
};

function ListaHistorico({
  membroFixo,
  membroInativo,
  onAlterado,
  funcionarios,
}: ListaHistoricoProps) {
  const usuario = useUsuario();
  const { mostrar } = useToast();
  // O membro fixo entra no carregamento, não no filtro: nenhum setFiltro consegue perdê-lo.
  const carregar = useCallback(
    (filtro: FiltroAtividades) =>
      membroFixo ? listarAtividadesDoMembro(membroFixo, filtro) : listarAtividades(filtro),
    [membroFixo],
  );
  const lista = useListaPaginada(carregar, { page: 1 });
  const { filtro, setFiltro } = lista;
  const formulario = useFormEmDialog();
  const [membroFiltro, setMembroFiltro] = useState<MembroBusca | null>(null);

  function aoSalvar() {
    const { chave } = formulario.form;
    mostrar("Atividade registrada.");
    formulario.fecharSeAinda(chave);
    lista.recarregar();
    onAlterado?.();
  }

  function aoEscolherMembro(membro: MembroBusca | null) {
    setMembroFiltro(membro);
    setFiltro({ ...filtro, membroId: membro?.id, page: 1 });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-4">
        {!membroFixo && (
          <BuscaMembro
            incluirInativos
            rotulo="Membro"
            selecionado={membroFiltro}
            onSelecionar={aoEscolherMembro}
          />
        )}
        {funcionarios && (
          <Select
            rotulo="Funcionário"
            placeholder="Todos"
            opcoes={funcionarios.map((f) => ({ valor: f.id, rotulo: f.nome }))}
            value={filtro.funcionarioId ?? ""}
            onChange={(e) =>
              setFiltro({ ...filtro, funcionarioId: e.target.value || undefined, page: 1 })
            }
          />
        )}
        <Input
          rotulo="Data de"
          type="date"
          value={filtro.dataDe ?? ""}
          max={filtro.dataAte}
          onChange={(e) => setFiltro({ ...filtro, dataDe: e.target.value || undefined, page: 1 })}
        />
        <Input
          rotulo="Data até"
          type="date"
          value={filtro.dataAte ?? ""}
          min={filtro.dataDe}
          onChange={(e) => setFiltro({ ...filtro, dataAte: e.target.value || undefined, page: 1 })}
        />
        {podeRegistrarAtividade(usuario) &&
          (membroInativo ? (
            <p className="ml-auto text-sm text-zinc-600">Membro inativo não registra atividade.</p>
          ) : (
            <Button className="ml-auto" onClick={formulario.abrir}>
              Registrar atividade
            </Button>
          ))}
      </div>

      <TabelaPaginada
        pagina={lista.pagina}
        erro={lista.erro}
        colunas={membroFixo ? COLUNAS_DO_MEMBRO : COLUNAS}
        chaveDaLinha={(a) => a.id}
        vazio={<EmptyState titulo="Nenhuma atividade encontrada" />}
        onMudarPagina={(page) => setFiltro({ ...filtro, page })}
      />

      <Dialog
        aberto={formulario.form.aberto}
        titulo="Registrar atividade"
        onFechar={formulario.fechar}
      >
        <FormAtividade
          key={formulario.form.chave}
          membroId={membroFixo}
          onSalvo={aoSalvar}
          onCancelar={formulario.fechar}
        />
      </Dialog>
    </div>
  );
}
