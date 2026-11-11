import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Pagina } from "@/lib/use-lista-paginada";
import { TabelaPaginada } from "./tabela-paginada";
import type { Coluna } from "./table";

type Linha = { id: string; nome: string };

const colunas: Coluna<Linha>[] = [{ chave: "nome", titulo: "Nome", celula: (l) => l.nome }];

function pagina(data: Linha[], extra: Partial<Pagina<Linha>> = {}): Pagina<Linha> {
  return { data, total: data.length, page: 1, pageSize: 20, ...extra };
}

function renderizar(props: { pagina: Pagina<Linha> | null; erro?: string | null }) {
  const onMudarPagina = vi.fn();
  render(
    <TabelaPaginada
      pagina={props.pagina}
      erro={props.erro ?? null}
      colunas={colunas}
      chaveDaLinha={(l) => l.id}
      vazio={<p>Nada por aqui</p>}
      onMudarPagina={onMudarPagina}
    />,
  );
  return onMudarPagina;
}

describe("TabelaPaginada", () => {
  it("mostra Carregando… enquanto não há página nem erro", () => {
    renderizar({ pagina: null });

    expect(screen.getByText("Carregando…")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("mostra o erro em role=alert e não mostra Carregando…", () => {
    renderizar({ pagina: null, erro: "Falha ao listar" });

    expect(screen.getByRole("alert")).toHaveTextContent("Falha ao listar");
    expect(screen.queryByText("Carregando…")).toBeNull();
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("mostra as linhas e a paginação", () => {
    renderizar({ pagina: pagina([{ id: "1", nome: "Fulano Silva" }]) });

    expect(screen.getByRole("columnheader", { name: "Nome" })).toBeInTheDocument();
    expect(screen.getByText("Fulano Silva")).toBeInTheDocument();
    expect(screen.getByText("Página 1 de 1")).toBeInTheDocument();
  });

  it("mostra o conteúdo de vazio quando não há linhas", () => {
    renderizar({ pagina: pagina([]) });

    expect(screen.getByText("Nada por aqui")).toBeInTheDocument();
  });

  it("chama onMudarPagina ao trocar de página", async () => {
    const onMudarPagina = renderizar({
      pagina: pagina([{ id: "1", nome: "Fulano Silva" }], { total: 40 }),
    });

    await userEvent.click(screen.getByRole("button", { name: "Próxima" }));

    expect(onMudarPagina).toHaveBeenCalledWith(2);
  });
});
