import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TreinosPage from "./page";

vi.mock("@/features/treinos/tela-treinos", () => ({
  TelaTreinos: () => <p>tela</p>,
}));

describe("TreinosPage", () => {
  it("mostra o título e a tela", () => {
    render(<TreinosPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Treinos" })).toBeInTheDocument();
    expect(screen.getByText("tela")).toBeInTheDocument();
  });
});
