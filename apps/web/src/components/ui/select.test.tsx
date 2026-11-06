import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Select } from "./select";

const OPCOES = [
  { valor: "ADMIN", rotulo: "Administrador" },
  { valor: "INSTRUTOR", rotulo: "Instrutor" },
];

describe("Select", () => {
  it("lista as opções e o placeholder", () => {
    render(<Select rotulo="Cargo" opcoes={OPCOES} placeholder="Selecione" />);

    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual([
      "Selecione",
      "Administrador",
      "Instrutor",
    ]);
  });

  it("permite escolher uma opção", async () => {
    render(<Select rotulo="Cargo" opcoes={OPCOES} />);

    await userEvent.selectOptions(screen.getByLabelText("Cargo"), "INSTRUTOR");

    expect(screen.getByLabelText("Cargo")).toHaveValue("INSTRUTOR");
  });

  it("mostra o erro e o liga ao campo", () => {
    render(<Select rotulo="Cargo" opcoes={OPCOES} erro="Obrigatório" />);

    const campo = screen.getByLabelText("Cargo");
    expect(campo).toHaveAttribute("aria-invalid", "true");
    expect(campo).toHaveAccessibleDescription("Obrigatório");
  });
});
