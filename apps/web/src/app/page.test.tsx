import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "./page";

describe("Home", () => {
  it("mostra o título do sistema", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Sistema de Cadastro de Academia",
      }),
    ).toBeInTheDocument();
  });
});
