"use client";

import { useEffect, useState } from "react";
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
import { useFormDialog } from "@/lib/use-form-dialog";
import { useListaPaginada } from "@/lib/use-lista-paginada";
import {
  type Atividade,
  listarAtividades,
  listarFuncionariosParaFiltro,
  podeFiltrarPorFuncionario,
  podeRegistrarAtividade,
} from "./api";
import { FormAtividade } from "./form-atividade";

type OpcaoFuncionario = { id: string; nome: string };

const COLUNAS: Coluna<Atividade>[] = [
  { chave: "data", titulo: "Data", celula: (a) => formatarData(a.data) },
  { chave: "membro", titulo: "Membro", celula: (a) => a.membro.nome },
  { chave: "atividade", titulo: "Atividade", celula: (a) => a.atividade },
  { chave: "tempo", titulo: "Tempo", celula: (a) => `${a.tempoExecucao} min` },
  { chave: "treino", titulo: "Treino", celula: (a) => a.treino?.tipo ?? "—" },
  { chave: "funcionario", titulo: "Funcionário", celula: (a) => a.funcionario.nome },
];

export function TelaHistorico() {
  const usuario = useUsuario();
  const { mostrar } = useToast();
  const filtraPorFuncionario = podeFiltrarPorFuncionario(usuario);
  const lista = useListaPaginada(listarAtividades, { page: 1 });
  const { filtro, setFiltro } = lista;
  const formulario = useFormDialog();
  const [membroFiltro, setMembroFiltro] = useState<MembroBusca | null>(null);
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

  function aoSalvar() {
    mostrar("Atividade registrada.");
    formulario.concluir();
    lista.recarregar();
  }

  function aoEscolherMembro(membro: MembroBusca | null) {
    setMembroFiltro(membro);
    setFiltro({ ...filtro, membroId: membro?.id, page: 1 });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-4">
        <BuscaMembro
          incluirInativos
          rotulo="Membro"
          selecionado={membroFiltro}
          onSelecionar={aoEscolherMembro}
        />
        {filtraPorFuncionario && (
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
        {podeRegistrarAtividade(usuario) && (
          <Button className="ml-auto" onClick={() => formulario.abrir()}>
            Registrar atividade
          </Button>
        )}
      </div>

      <TabelaPaginada
        pagina={lista.pagina}
        erro={lista.erro}
        colunas={COLUNAS}
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
          onSalvo={aoSalvar}
          onCancelar={formulario.fechar}
          onEnviando={formulario.setOcupado}
        />
      </Dialog>
    </div>
  );
}
