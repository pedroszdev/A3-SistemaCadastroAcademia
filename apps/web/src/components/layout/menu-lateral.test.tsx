import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MenuLateral } from "./menu-lateral";

vi.mock("next/navigation", () => ({ usePathname: () => "/membros/123" }));

describe("MenuLateral", () => {
  it("mostra só os itens do cargo", () => {
    render(<MenuLateral cargo="INSTRUTOR" />);

    expect(screen.getAllByRole("link").map((l) => l.textContent)).toEqual([
      "Dashboard",
      "Membros",
      "Treinos",
      "Histórico",
    ]);
    expect(screen.queryByRole("link", { name: "Pagamentos" })).toBeNull();
  });

  it("marca o item da rota atual", () => {
    render(<MenuLateral cargo="ADMIN" />);

    expect(screen.getByRole("link", { name: "Membros" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Treinos" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("não mostra itens sem cargo", () => {
    render(<MenuLateral cargo={null} />);

    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });
});
