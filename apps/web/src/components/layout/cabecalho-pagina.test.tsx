import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CabecalhoPagina, dataPorExtenso } from "./cabecalho-pagina";

describe("dataPorExtenso", () => {
  it("usa o dia da semana curto e o fuso da academia", () => {
    // 16/11/2026 02:00 UTC ainda é domingo, 15, em São Paulo.
    expect(dataPorExtenso(new Date("2026-11-16T02:00:00Z"))).toBe(
      "Domingo, 15 de novembro de 2026",
    );
    expect(dataPorExtenso(new Date("2026-11-16T15:00:00Z"))).toBe(
      "Segunda, 16 de novembro de 2026",
    );
  });
});

describe("CabecalhoPagina", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("mostra a data de hoje, o título, a descrição e as ações", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-18T12:00:00Z"));

    render(
      <CabecalhoPagina
        titulo="Membros"
        descricao="Cadastro dos alunos."
        acoes={<button>Novo membro</button>}
      />,
    );

    expect(screen.getByRole("heading", { level: 1, name: "Membros" })).toBeInTheDocument();
    expect(screen.getByText("Quarta, 18 de novembro de 2026")).toBeInTheDocument();
    expect(screen.getByText("Cadastro dos alunos.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Novo membro" })).toBeInTheDocument();
  });

  it("funciona sem descrição e sem ações", () => {
    render(<CabecalhoPagina titulo="Dashboard" />);

    expect(screen.getByRole("heading", { level: 1, name: "Dashboard" })).toBeInTheDocument();
    expect(screen.queryByRole("button")).toBeNull();
  });
});
