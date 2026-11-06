"use client";

import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

const DURACAO_TOAST_MS = 4000;

type TipoToast = "sucesso" | "erro";
type ItemToast = { id: number; mensagem: string; tipo: TipoToast };
type ContextoToast = { mostrar: (mensagem: string, tipo?: TipoToast) => void };

const ToastContext = createContext<ContextoToast | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ItemToast[]>([]);
  const proximoId = useRef(0);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const fechar = useCallback((id: number) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts((atuais) => atuais.filter((toast) => toast.id !== id));
  }, []);

  const mostrar = useCallback(
    (mensagem: string, tipo: TipoToast = "sucesso") => {
      const id = proximoId.current++;
      setToasts((atuais) => [...atuais, { id, mensagem, tipo }]);
      timers.current.set(
        id,
        setTimeout(() => fechar(id), DURACAO_TOAST_MS),
      );
    },
    [fechar],
  );

  useEffect(() => {
    const ativos = timers.current;
    return () => ativos.forEach((timer) => clearTimeout(timer));
  }, []);

  return (
    <ToastContext.Provider value={{ mostrar }}>
      {children}
      <div
        role="status"
        className="fixed right-4 bottom-4 z-50 flex flex-col gap-2"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 rounded px-4 py-3 text-sm text-white ${
              toast.tipo === "erro" ? "bg-red-600" : "bg-green-600"
            }`}
          >
            <span>{toast.mensagem}</span>
            <button type="button" onClick={() => fechar(toast.id)}>
              Fechar
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ContextoToast {
  const contexto = useContext(ToastContext);
  if (!contexto) {
    throw new Error("useToast precisa estar dentro de um ToastProvider");
  }
  return contexto;
}
