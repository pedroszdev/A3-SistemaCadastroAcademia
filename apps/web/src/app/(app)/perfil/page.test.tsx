import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import PerfilPage from "./page";

vi.mock("@/features/perfil/meus-dados", () => ({ MeusDados: () => <p>dados</p> }));

describe("PerfilPage", () => {
  it("mostra o título e os dados", () => {
    render(<PerfilPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Meus dados" })).toBeInTheDocument();
    expect(screen.getByText("dados")).toBeInTheDocument();
  });
});
