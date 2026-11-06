import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { type Coluna, Table } from "./table";

type Membro = { id: string; nome: string };

const COLUNAS: Coluna<Membro>[] = [
  { chave: "nome", titulo: "Nome", celula: (m) => m.nome },
];
const LINHAS: Membro[] = [
  { id: "1", nome: "Ana" },
  { id: "2", nome: "Bruno" },
];

function renderizar(page: number, onMudarPagina = vi.fn()) {
  render(
    <Table
      colunas={COLUNAS}
      linhas={LINHAS}
      chaveDaLinha={(m) => m.id}
      paginacao={{ page, pageSize: 2, total: 6, onMudarPagina }}
    />,
  );
  return onMudarPagina;
}

describe("Table", () => {
  it("mostra cabeçalhos e células", () => {
    render(<Table colunas={COLUNAS} linhas={LINHAS} chaveDaLinha={(m) => m.id} />);

    expect(screen.getByRole("columnheader", { name: "Nome" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Ana" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Bruno" })).toBeInTheDocument();
    expect(screen.queryByText(/Página/)).toBeNull();
  });

  it("mostra o estado vazio padrão sem linhas", () => {
    render(<Table colunas={COLUNAS} linhas={[]} chaveDaLinha={(m) => m.id} />);

    expect(screen.getByText("Nenhum registro encontrado")).toBeInTheDocument();
  });

  it("mostra o vazio customizado", () => {
    render(
      <Table
        colunas={COLUNAS}
        linhas={[]}
        chaveDaLinha={(m) => m.id}
        vazio={<p>Sem membros</p>}
      />,
    );

    expect(screen.getByText("Sem membros")).toBeInTheDocument();
  });

  it("mostra a página atual e o total", () => {
    renderizar(2);

    expect(screen.getByText("Página 2 de 3")).toBeInTheDocument();
  });

  it("Próxima chama onMudarPagina com page + 1", async () => {
    const onMudarPagina = renderizar(2);

    await userEvent.click(screen.getByRole("button", { name: "Próxima" }));

    expect(onMudarPagina).toHaveBeenCalledWith(3);
  });

  it("Anterior chama onMudarPagina com page - 1", async () => {
    const onMudarPagina = renderizar(2);

    await userEvent.click(screen.getByRole("button", { name: "Anterior" }));

    expect(onMudarPagina).toHaveBeenCalledWith(1);
  });

  it("desabilita Anterior na primeira página", () => {
    renderizar(1);

    expect(screen.getByRole("button", { name: "Anterior" })).toBeDisabled();
  });

  it("desabilita Próxima na última página", () => {
    renderizar(3);

    expect(screen.getByRole("button", { name: "Próxima" })).toBeDisabled();
  });
});
