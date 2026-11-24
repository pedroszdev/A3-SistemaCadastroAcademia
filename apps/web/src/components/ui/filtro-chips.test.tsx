import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BarraDeFiltros, FiltroChips } from "./filtro-chips";

describe("FiltroChips", () => {
  const OPCOES = [
    { valor: "a", rotulo: "Opção A" },
    { valor: "b", rotulo: "Opção B" },
  ] as const;

  it("marca a opção escolhida e avisa a troca", async () => {
    const onMudar = vi.fn();
    render(<FiltroChips rotulo="Filtro" opcoes={OPCOES} valor="a" onMudar={onMudar} />);

    const grupo = screen.getByRole("group", { name: "Filtro" });
    expect(within(grupo).getAllByRole("button").map((b) => b.textContent)).toEqual([
      "Todos",
      "Opção A",
      "Opção B",
    ]);
    expect(within(grupo).getByRole("button", { name: "Opção A" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await userEvent.click(within(grupo).getByRole("button", { name: "Opção B" }));
    expect(onMudar).toHaveBeenLastCalledWith("b");

    await userEvent.click(within(grupo).getByRole("button", { name: "Todos" }));
    expect(onMudar).toHaveBeenLastCalledWith(undefined);
  });

  it("põe Todos no fim, troca o texto ou tira a opção", () => {
    const { rerender } = render(
      <FiltroChips rotulo="F" opcoes={OPCOES} valor={undefined} onMudar={vi.fn()} todosNoFim />,
    );
    expect(screen.getAllByRole("button").at(-1)).toHaveTextContent("Todos");
    expect(screen.getByRole("button", { name: "Todos" })).toHaveAttribute("aria-pressed", "true");

    rerender(
      <FiltroChips rotulo="F" opcoes={OPCOES} valor={undefined} onMudar={vi.fn()} rotuloTodos="Tudo" />,
    );
    expect(screen.getByRole("button", { name: "Tudo" })).toBeInTheDocument();

    rerender(
      <FiltroChips rotulo="F" opcoes={OPCOES} valor={undefined} onMudar={vi.fn()} rotuloTodos={null} />,
    );
    expect(screen.getAllByRole("button")).toHaveLength(2);
  });

  it("BarraDeFiltros só agrupa o conteúdo", () => {
    render(
      <BarraDeFiltros>
        <span>busca</span>
      </BarraDeFiltros>,
    );

    expect(screen.getByText("busca")).toBeInTheDocument();
  });
});
