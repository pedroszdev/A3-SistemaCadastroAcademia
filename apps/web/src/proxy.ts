import { type NextRequest, NextResponse } from "next/server";
import { decidirAcesso } from "@/lib/protecao-rotas";
import { COOKIE_TOKEN } from "@/lib/sessao";

export function proxy(req: NextRequest) {
  const { redirecionarPara, apagarCookie } = decidirAcesso(
    req.nextUrl.pathname,
    req.cookies.get(COOKIE_TOKEN)?.value,
    Math.floor(Date.now() / 1000),
  );

  const res = redirecionarPara
    ? NextResponse.redirect(new URL(redirecionarPara, req.url))
    : NextResponse.next();
  if (apagarCookie) res.cookies.delete(COOKIE_TOKEN);
  return res;
}

// Fora: o repasse /api (a API responde 401 por conta própria), os arquivos do Next
// e os estáticos por extensão. Rota com ponto, como /membros/joao.silva, passa.
export const config = {
  matcher: [
    "/((?!api/|_next/static|_next/image|.*\\.(?:ico|png|jpe?g|gif|svg|webp|avif|txt|xml|webmanifest|css|js|map|woff2?)$).*)",
  ],
};
