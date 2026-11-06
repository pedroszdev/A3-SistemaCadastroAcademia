import { repassarParaApi } from "@/lib/repasse-api";

async function repassar(req: Request, ctx: RouteContext<"/api/[...caminho]">) {
  const { caminho } = await ctx.params;
  return repassarParaApi(req, caminho);
}

export {
  repassar as GET,
  repassar as POST,
  repassar as PUT,
  repassar as PATCH,
  repassar as DELETE,
};
