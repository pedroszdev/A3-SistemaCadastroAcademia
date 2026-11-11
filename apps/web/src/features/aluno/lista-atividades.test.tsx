import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { AtividadeDoAluno } from "./historico";
import { ListaAtividades } from "./lista-atividades";

function atividade(extra: Partial<AtividadeDoAluno> = {}): AtividadeDoAluno {
  return {
    id: "a1",
    treinoId: "t1",
    atividade: "Esteira",
    data: "2026-11-05T00:00:00.000Z",
    tempoExecucao: 45,
    funcionario: { nome: "Carlos Lima" },
    treino: { id: "t1", tipo: "Treino A" },
    ...extra,
  };
}

describe("ListaAtividades", () => {
  it("mostra data, atividade, tempo e o treino vinculado", () => {
    render(<ListaAtividades atividades={[atividade()]} />);

    const item = screen.getByRole("listitem");
    expect(within(item).getByText("Esteira")).toBeInTheDocument();
    expect(within(item).getByText("05/11/2026")).toBeInTheDocument();
    expect(within(item).getByText("45 min")).toBeInTheDocument();
    expect(within(item).getByText("Treino A")).toBeInTheDocument();
  });

  it("avisa quando a atividade não tem treino vinculado", () => {
    render(<ListaAtividades atividades={[atividade({ treinoId: null, treino: null })]} />);

    expect(screen.getByText("Sem treino vinculado")).toBeInTheDocument();
  });

  it("mantém a ordem recebida", () => {
    render(
      <ListaAtividades
        atividades={[
          atividade({ id: "a2", atividade: "Bicicleta" }),
          atividade({ id: "a1", atividade: "Esteira" }),
        ]}
      />,
    );

    const itens = screen.getAllByRole("listitem");
    expect(itens[0]).toHaveTextContent("Bicicleta");
    expect(itens[1]).toHaveTextContent("Esteira");
  });

  it("mostra o estado vazio quando não há atividades", () => {
    render(<ListaAtividades atividades={[]} />);

    expect(screen.getByText("Nenhuma atividade no período")).toBeInTheDocument();
    expect(screen.queryByRole("list")).toBeNull();
  });
});
