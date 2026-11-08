import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DashboardPage from "./page";

vi.mock("@/features/dashboard/painel-dashboard", () => ({
  PainelDashboard: () => <p>painel</p>,
}));

describe("DashboardPage", () => {
  it("mostra o título", () => {
    render(<DashboardPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Dashboard" })).toBeInTheDocument();
  });

  it("renderiza o painel", () => {
    render(<DashboardPage />);

    expect(screen.getByText("painel")).toBeInTheDocument();
  });
});
