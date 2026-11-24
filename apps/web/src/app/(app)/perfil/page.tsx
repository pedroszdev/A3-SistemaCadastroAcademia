import { CabecalhoPagina } from "@/components/layout/cabecalho-pagina";
import { MeusDados } from "@/features/perfil/meus-dados";

export const metadata = { title: "Meus dados · Academia" };

export default function PerfilPage() {
  return (
    <>
      <CabecalhoPagina titulo="Meus dados" descricao="Seus dados de acesso ao sistema." />
      <MeusDados />
    </>
  );
}
