import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import MembrosPage from "./page";

vi.mock("@/features/membros/tela-membros", () => ({
  TelaMembros: () => <p>tela</p>,
}));

describe("MembrosPage", () => {
  // O título fica dentro da tela, junto do botão de ação que depende do cargo.
  it("renderiza a tela", () => {
    render(<MembrosPage />);

    expect(screen.getByText("tela")).toBeInTheDocument();
  });
});
