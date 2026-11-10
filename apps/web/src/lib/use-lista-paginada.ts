import { useEffect, useRef, useState } from "react";

export type Pagina<T> = { data: T[]; total: number; page: number; pageSize: number };

// `carregar` precisa ser estável (função de módulo): ela entra nas dependências do efeito.
export function useListaPaginada<F extends { page: number }, T>(
  carregar: (filtro: F) => Promise<Pagina<T>>,
  filtroInicial: NoInfer<F>,
) {
  const [filtro, setFiltro] = useState<F>(filtroInicial);
  const [versao, setVersao] = useState(0);
  const [pagina, setPagina] = useState<Pagina<T> | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    carregar(filtro)
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
  }, [carregar, filtro, versao]);

  function recarregar() {
    setVersao((v) => v + 1);
  }

  return { filtro, setFiltro, pagina, erro, recarregar };
}

// A chave muda a cada abertura: um save que termina depois de o Dialog ter sido
// fechado e reaberto não fecha o formulário novo.
type EstadoForm = { aberto: boolean; chave: number };

export function useFormEmDialog() {
  const [form, setForm] = useState<EstadoForm>({ aberto: false, chave: 0 });
  const proximaChave = useRef(0);

  function abrir() {
    proximaChave.current += 1;
    setForm({ aberto: true, chave: proximaChave.current });
  }

  function fechar() {
    setForm((atual) => ({ ...atual, aberto: false }));
  }

  function fecharSeAinda(chave: number) {
    setForm((atual) => (atual.chave === chave ? { ...atual, aberto: false } : atual));
  }

  return { form, abrir, fechar, fecharSeAinda };
}
