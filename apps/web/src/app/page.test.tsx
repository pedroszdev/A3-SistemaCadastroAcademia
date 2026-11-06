import { redirect } from "next/navigation";
import { describe, expect, it, vi } from "vitest";
import Home from "./page";

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

describe("Home", () => {
  it("manda para o dashboard", () => {
    Home();

    expect(redirect).toHaveBeenCalledWith("/dashboard");
  });
});
