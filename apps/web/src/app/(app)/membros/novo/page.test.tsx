import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import NovoMembroPage from "./page";

vi.mock("@/features/membros/cadastro-membro", () => ({
  NovoMembro: () => <p>formulário</p>,
}));

describe("NovoMembroPage", () => {
  it("mostra o título e o formulário", () => {
    render(<NovoMembroPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Novo membro" })).toBeInTheDocument();
    expect(screen.getByText("formulário")).toBeInTheDocument();
  });
});
