import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import MembrosPage from "./page";

vi.mock("@/features/membros/tela-membros", () => ({
  TelaMembros: () => <p>tela</p>,
}));

describe("MembrosPage", () => {
  it("mostra o título e a tela", () => {
    render(<MembrosPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Membros" })).toBeInTheDocument();
    expect(screen.getByText("tela")).toBeInTheDocument();
  });
});
