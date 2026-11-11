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

type Periodo = { dataDe: string; dataAte: string };

// Mesma mensagem da API (query-atividade.dto.ts).
const MENSAGEM_PERIODO_INVERTIDO = "dataAte não pode ser anterior a dataDe";

function estaInvertido({ dataDe, dataAte }: Periodo): boolean {
  return dataDe !== "" && dataAte !== "" && dataDe > dataAte;
}

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
  // O período digitado só vira filtro quando é válido: invertido, a API responderia 400 e a
  // tabela sumiria.
  const [periodo, setPeriodo] = useState<Periodo>({ dataDe: "", dataAte: "" });

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

  function aoMudarPeriodo(campo: keyof Periodo, valor: string) {
    const novo = { ...periodo, [campo]: valor };
    setPeriodo(novo);
    if (estaInvertido(novo)) return;
    setFiltro({
      ...filtro,
      dataDe: novo.dataDe || undefined,
      dataAte: novo.dataAte || undefined,
      page: 1,
    });
  }

  function aoEscolherMembro(membro: MembroBusca | null) {
    setMembroFiltro(membro);
    setFiltro({ ...filtro, membroId: membro?.id, page: 1 });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-4">
        <BuscaMembro incluirInativos selecionado={membroFiltro} onSelecionar={aoEscolherMembro} />
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
          value={periodo.dataDe}
          max={periodo.dataAte || undefined}
          onChange={(e) => aoMudarPeriodo("dataDe", e.target.value)}
        />
        <Input
          rotulo="Data até"
          type="date"
          value={periodo.dataAte}
          min={periodo.dataDe || undefined}
          onChange={(e) => aoMudarPeriodo("dataAte", e.target.value)}
          erro={estaInvertido(periodo) ? MENSAGEM_PERIODO_INVERTIDO : undefined}
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
