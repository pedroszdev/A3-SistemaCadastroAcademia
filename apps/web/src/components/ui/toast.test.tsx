import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider, useToast } from "./toast";

function Gatilho({ tipo }: { tipo?: "sucesso" | "erro" }) {
  const { mostrar } = useToast();
  return <button onClick={() => mostrar("Salvo!", tipo)}>Disparar</button>;
}

function renderizar(tipo?: "sucesso" | "erro") {
  const { unmount } = render(
    <ToastProvider>
      <Gatilho tipo={tipo} />
    </ToastProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Disparar" }));
  return unmount;
}

describe("Toast", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("mostra a mensagem", () => {
    renderizar();

    expect(screen.getByRole("status")).toHaveTextContent("Salvo!");
  });

  it("some após 4000 ms", () => {
    renderizar();

    act(() => {
      vi.advanceTimersByTime(3999);
    });
    expect(screen.getByText("Salvo!")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.queryByText("Salvo!")).toBeNull();
  });

  it("some ao clicar em Fechar", () => {
    renderizar();

    fireEvent.click(screen.getByRole("button", { name: "Fechar" }));

    expect(screen.queryByText("Salvo!")).toBeNull();
  });

  it("usa a cor do tipo erro", () => {
    renderizar("erro");

    expect(screen.getByText("Salvo!").parentElement).toHaveClass("bg-red-600");
  });

  it("limpa os timers ao desmontar", () => {
    const clear = vi.spyOn(globalThis, "clearTimeout");
    const unmount = renderizar();
    clear.mockClear();

    unmount();

    expect(clear).toHaveBeenCalledTimes(1);
  });

  it("lança erro fora do provider", () => {
    const erro = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(<Gatilho />)).toThrow(
      "useToast precisa estar dentro de um ToastProvider",
    );
    erro.mockRestore();
  });
});
