import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AvisoInadimplencia } from "./aviso-inadimplencia";

describe("AvisoInadimplencia", () => {
  it("destaca o título em role=alert", () => {
    render(<AvisoInadimplencia />);

    const aviso = screen.getByRole("alert");
    expect(aviso).toHaveTextContent("Membro com pagamento em atraso");
    expect(aviso).toHaveTextContent(
      "A atividade não pode ser registrada até a recepção regularizar o pagamento.",
    );
  });

  it("mostra os dias do maior atraso quando informados", () => {
    render(<AvisoInadimplencia maiorAtrasoDias={12} />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "regularizar o pagamento (maior atraso: 12 dias).",
    );
  });

  it("não mostra os dias quando não são informados", () => {
    render(<AvisoInadimplencia />);

    expect(screen.getByRole("alert")).not.toHaveTextContent("maior atraso");
  });
});
