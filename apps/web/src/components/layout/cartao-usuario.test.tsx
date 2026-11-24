import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CartaoUsuario } from "./cartao-usuario";

describe("CartaoUsuario", () => {
  it.each([
    ["ADMIN", "Administrador", "AD"],
    ["RECEPCIONISTA", "Recepcionista", "RE"],
    ["INSTRUTOR", "Instrutor", "IN"],
  ] as const)("mostra o cargo %s por extenso, o código e a ação", (cargo, nome, sigla) => {
    render(<CartaoUsuario cargo={cargo} acao={<button>Sair</button>} />);

    expect(screen.getByText(nome)).toBeInTheDocument();
    expect(screen.getByText(cargo)).toBeInTheDocument();
    expect(screen.getByText(sigla)).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByRole("button", { name: "Sair" })).toBeInTheDocument();
  });

  it("o nome leva para Meus dados", () => {
    render(<CartaoUsuario cargo="ADMIN" acao={null} />);

    expect(screen.getByRole("link", { name: "Administrador" })).toHaveAttribute("href", "/perfil");
  });
});
