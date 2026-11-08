import { Suspense } from "react";
import { ToastProvider } from "@/components/ui/toast";
import { PortalDoAluno } from "@/features/aluno/portal-do-aluno";

// Mesma estrutura da área do funcionário: o conteúdo espera a leitura do cookie
// dentro do Suspense (exigido pelo cacheComponents).
export default function AlunoLayout({ children }: LayoutProps<"/">) {
  return (
    <ToastProvider>
      <Suspense fallback={<p className="p-4 text-sm text-zinc-600">Carregando…</p>}>
        <PortalDoAluno>{children}</PortalDoAluno>
      </Suspense>
    </ToastProvider>
  );
}
