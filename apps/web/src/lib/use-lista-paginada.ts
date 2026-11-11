import { useEffect, useEffectEvent, useState } from "react";

export type Pagina<T> = { data: T[]; total: number; page: number; pageSize: number };

// `carregar` pode ser uma função nova a cada render (ex.: inline, fixando um membroId):
// ela não entra nas dependências, então a lista só recarrega quando o filtro muda ou
// quando alguém chama recarregar().
export function useListaPaginada<F extends { page: number }, T>(
  carregar: (filtro: F) => Promise<Pagina<T>>,
  filtroInicial: NoInfer<F>,
) {
  const [filtro, setFiltro] = useState<F>(filtroInicial);
  const [versao, setVersao] = useState(0);
  const [pagina, setPagina] = useState<Pagina<T> | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const buscar = useEffectEvent((atual: F) => carregar(atual));

  useEffect(() => {
    let cancelado = false;
    buscar(filtro)
      .then((recebida) => {
        if (cancelado) return;
        // A página ficou vazia (ex.: deu baixa no último da página com o filtro Pendente):
        // volta para a última página que ainda tem registros.
        const ultimaPagina = Math.max(1, Math.ceil(recebida.total / recebida.pageSize));
        if (recebida.data.length === 0 && filtro.page > ultimaPagina) {
          setFiltro((atual) => ({ ...atual, page: ultimaPagina }));
          return;
        }
        setPagina(recebida);
        setErro(null);
      })
      .catch((e: Error) => {
        if (cancelado) return;
        // Sem a página antiga, a tabela não mostra linhas que não batem com o filtro.
        setPagina(null);
        setErro(e.message);
      });
    return () => {
      cancelado = true;
    };
  }, [filtro, versao]);

  function recarregar() {
    setVersao((v) => v + 1);
  }

  return { filtro, setFiltro, pagina, erro, recarregar };
}
