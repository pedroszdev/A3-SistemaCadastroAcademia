import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import FichaMembroPage from "./page";

vi.mock("@/features/membros/ficha-membro", () => ({
  FichaMembro: ({ id }: { id: string }) => <p>ficha {id}</p>,
}));

describe("FichaMembroPage", () => {
  it("mostra o título e repassa o id da rota", async () => {
    render(await FichaMembroPage({ params: Promise.resolve({ id: "m1" }) }));

    expect(screen.getByRole("heading", { level: 1, name: "Ficha do membro" })).toBeInTheDocument();
    expect(screen.getByText("ficha m1")).toBeInTheDocument();
  });
});
