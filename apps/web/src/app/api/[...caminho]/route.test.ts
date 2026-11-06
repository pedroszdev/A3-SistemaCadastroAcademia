import { beforeEach, describe, expect, it, vi } from "vitest";
import { repassarParaApi } from "@/lib/repasse-api";
import * as rota from "./route";

vi.mock("@/lib/repasse-api", () => ({
  repassarParaApi: vi.fn(async () => new Response(null, { status: 204 })),
}));

describe("route /api/[...caminho]", () => {
  beforeEach(() => {
    vi.mocked(repassarParaApi).mockClear();
  });

  it.each(["GET", "POST", "PUT", "PATCH", "DELETE"] as const)(
    "%s repassa o caminho dos params",
    async (metodo) => {
      const req = new Request("http://localhost:3001/api/membros/1", {
        method: metodo,
      });
      const ctx = {
        params: Promise.resolve({ caminho: ["membros", "1"] }),
      } as Parameters<typeof rota.GET>[1];

      await rota[metodo](req, ctx);

      expect(repassarParaApi).toHaveBeenCalledWith(req, ["membros", "1"]);
    },
  );
});
