import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import MeusDadosPage from "./page";

vi.mock("@/features/perfil/meus-dados", () => ({ MeusDados: () => <p>dados</p> }));

describe("MeusDadosPage (aluno)", () => {
  it("mostra o título e os dados", () => {
    render(<MeusDadosPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Meus dados" })).toBeInTheDocument();
    expect(screen.getByText("dados")).toBeInTheDocument();
  });
});
