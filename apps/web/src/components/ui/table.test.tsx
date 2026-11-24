import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AcoesDaLinha, type Coluna, Table } from "./table";

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

  it("mantém a paginação numa página vazia depois da primeira", async () => {
    const onMudarPagina = vi.fn();
    render(
      <Table
        colunas={COLUNAS}
        linhas={[]}
        chaveDaLinha={(m) => m.id}
        paginacao={{ page: 3, pageSize: 2, total: 4, onMudarPagina }}
      />,
    );

    expect(screen.getByText("Nenhum registro encontrado")).toBeInTheDocument();
    const anterior = screen.getByRole("button", { name: "Anterior" });
    expect(anterior).toBeEnabled();

    await userEvent.click(anterior);

    expect(onMudarPagina).toHaveBeenCalledWith(2);
  });

  it("não mostra paginação vazia na primeira página", () => {
    render(
      <Table
        colunas={COLUNAS}
        linhas={[]}
        chaveDaLinha={(m) => m.id}
        paginacao={{ page: 1, pageSize: 2, total: 0, onMudarPagina: vi.fn() }}
      />,
    );

    expect(screen.getByText("Nenhum registro encontrado")).toBeInTheDocument();
    expect(screen.queryByText(/Página/)).toBeNull();
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

describe("Table no visual do design", () => {
  it("mostra o intervalo da página com o nome dos itens", () => {
    render(
      <Table
        colunas={COLUNAS}
        linhas={LINHAS}
        chaveDaLinha={(m) => m.id}
        rotuloItens="membros"
        paginacao={{ page: 2, pageSize: 2, total: 6, onMudarPagina: vi.fn() }}
      />,
    );

    expect(screen.getByText("Mostrando 3–4 de 6 membros")).toBeInTheDocument();
  });

  it("numa página vazia avisa o total", () => {
    render(
      <Table
        colunas={COLUNAS}
        linhas={[]}
        chaveDaLinha={(m) => m.id}
        paginacao={{ page: 3, pageSize: 2, total: 4, onMudarPagina: vi.fn() }}
      />,
    );

    expect(screen.getByText("Nenhum item nesta página (4 registros no total)")).toBeInTheDocument();
  });

  it("a coluna de ações tem título só para leitor de tela e alinha à direita", () => {
    render(
      <Table
        colunas={[
          ...COLUNAS,
          { chave: "acoes", titulo: "Ações", acoes: true, celula: () => <button>Editar</button> },
        ]}
        linhas={LINHAS}
        chaveDaLinha={(m) => m.id}
      />,
    );

    const cabecalho = screen.getByRole("columnheader", { name: "Ações" });
    expect(cabecalho).toHaveClass("text-right");
    expect(within(cabecalho).getByText("Ações")).toHaveClass("sr-only");
  });

  it("sem moldura não desenha o cartão em volta", () => {
    const { container } = render(
      <Table colunas={COLUNAS} linhas={LINHAS} chaveDaLinha={(m) => m.id} moldura={false} />,
    );

    expect(container.firstChild).not.toHaveClass("rounded-2xl");
  });
});

describe("AcoesDaLinha", () => {
  it("agrupa os botões", () => {
    render(
      <AcoesDaLinha>
        <button>Editar</button>
      </AcoesDaLinha>,
    );

    expect(screen.getByRole("button", { name: "Editar" })).toBeInTheDocument();
  });
});

describe("Table com coluna centralizada", () => {
  it("centraliza o título e as células", () => {
    render(
      <Table
        colunas={[{ chave: "nome", titulo: "Nome", centralizar: true, celula: (m) => m.nome }]}
        linhas={LINHAS}
        chaveDaLinha={(m) => m.id}
      />,
    );

    expect(screen.getByRole("columnheader", { name: "Nome" })).toHaveClass("text-center");
    expect(screen.getByRole("cell", { name: "Ana" })).toHaveClass("text-center");
  });
});
