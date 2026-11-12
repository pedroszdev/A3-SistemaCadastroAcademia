import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import FichaMembroPage from "./page";

vi.mock("@/features/membros/ficha-membro", () => ({
  FichaMembro: ({ membroId }: { membroId: string }) => <p>ficha {membroId}</p>,
}));

describe("FichaMembroPage", () => {
  it("mostra o título e a ficha do membro da rota", async () => {
    const pagina = await FichaMembroPage({
      params: Promise.resolve({ id: "m1" }),
    } as Parameters<typeof FichaMembroPage>[0]);
    render(pagina);

    expect(screen.getByRole("heading", { level: 1, name: "Ficha do membro" })).toBeInTheDocument();
    expect(screen.getByText("ficha m1")).toBeInTheDocument();
  });
});
