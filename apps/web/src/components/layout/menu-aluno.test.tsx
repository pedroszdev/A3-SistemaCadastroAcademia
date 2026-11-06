import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MenuAluno } from "./menu-aluno";

vi.mock("next/navigation", () => ({ usePathname: () => "/aluno/treinos" }));

describe("MenuAluno", () => {
  it("mostra os itens do portal na ordem, com os links certos", () => {
    render(<MenuAluno />);

    const links = screen.getAllByRole("link");
    expect(links.map((l) => l.textContent)).toEqual(["Meus treinos", "Meu histórico"]);
    expect(links.map((l) => l.getAttribute("href"))).toEqual([
      "/aluno/treinos",
      "/aluno/historico",
    ]);
  });

  it("marca só o item da rota atual", () => {
    render(<MenuAluno />);

    expect(screen.getByRole("link", { name: "Meus treinos" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Meu histórico" })).not.toHaveAttribute(
      "aria-current",
    );
  });
});
