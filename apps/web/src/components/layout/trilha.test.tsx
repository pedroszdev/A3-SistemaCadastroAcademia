import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Trilha } from "./trilha";

describe("Trilha", () => {
  it("liga os passos anteriores e marca o último como a página atual", () => {
    render(
      <Trilha
        passos={[
          { rotulo: "Membros", href: "/membros" },
          { rotulo: "Sem link" },
          { rotulo: "Novo membro", href: "/membros/novo" },
        ]}
      />,
    );

    expect(screen.getByRole("navigation", { name: "Trilha" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Membros" })).toHaveAttribute("href", "/membros");
    expect(screen.queryByRole("link", { name: "Sem link" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Novo membro" })).toBeNull();
    expect(screen.getByText("Novo membro")).toHaveAttribute("aria-current", "page");
  });
});
