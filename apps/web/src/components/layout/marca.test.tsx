import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Marca } from "./marca";

describe("Marca", () => {
  it("mostra o nome da academia nos dois tamanhos", () => {
    const { rerender } = render(<Marca />);
    expect(screen.getByText("Academia Forma")).toHaveClass("text-xl");

    rerender(<Marca tamanho="grande" />);
    expect(screen.getByText("Academia Forma")).toHaveClass("text-[22px]");
  });
});
