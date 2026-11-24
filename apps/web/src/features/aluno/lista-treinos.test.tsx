import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ListaTreinos } from "./lista-treinos";
import type { TreinoDoAluno } from "./treinos";

const treino: TreinoDoAluno = {
  id: "t1",
  tipo: "Cardio",
  descricao: "Esteira e bicicleta",
  duracao: 45,
  dataInicio: "2026-11-20T12:00:00.000Z",
};

describe("ListaTreinos", () => {
  it("mostra tipo, descrição, duração e início de cada treino", () => {
    render(<ListaTreinos treinos={[treino]} onAbrir={vi.fn()} />);

    expect(screen.getByText("Cardio")).toBeInTheDocument();
    expect(screen.getByText("Esteira e bicicleta")).toBeInTheDocument();
    expect(screen.getByText("45 min")).toBeInTheDocument();
    expect(screen.getByText("Desde 20/11/2026")).toBeInTheDocument();
  });

  it("mostra o estado vazio sem treinos", () => {
    render(<ListaTreinos treinos={[]} onAbrir={vi.fn()} />);

    expect(screen.getByText("Nenhum treino encontrado")).toBeInTheDocument();
  });

  it("avisa qual treino foi clicado", async () => {
    const onAbrir = vi.fn();
    render(<ListaTreinos treinos={[treino]} onAbrir={onAbrir} />);

    await userEvent.click(screen.getByRole("button", { name: /^Cardio.*45 min.*Esteira e bicicleta.*Desde/ }));

    expect(onAbrir).toHaveBeenCalledWith(treino);
  });
});
