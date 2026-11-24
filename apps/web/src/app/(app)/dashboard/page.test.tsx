import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DashboardPage from "./page";

vi.mock("@/features/dashboard/painel-dashboard", () => ({
  PainelDashboard: () => <p>painel</p>,
}));

describe("DashboardPage", () => {
  // O título fica dentro da tela, junto do botão de ação que depende do cargo.
  it("renderiza o painel", () => {
    render(<DashboardPage />);

    expect(screen.getByText("painel")).toBeInTheDocument();
  });
});
