import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Icone } from "./icone";

describe("Icone", () => {
  it("é um SVG escondido do leitor de tela, no tamanho pedido", () => {
    const { container } = render(<Icone nome="check" tamanho={16} />);
    const svg = container.querySelector("svg");

    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveAttribute("width", "16");
  });
});
