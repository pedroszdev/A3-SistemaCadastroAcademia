import { useRef, useState } from "react";

// A chave muda a cada abertura e vai como `key` do formulário: um save que termina
// depois de o Dialog ter sido fechado e reaberto não fecha o formulário novo.
export type EstadoFormDialog<T> = { aberto: boolean; chave: number; dados?: T };

export function useFormDialog<T = undefined>() {
  const [form, setForm] = useState<EstadoFormDialog<T>>({ aberto: false, chave: 0 });
  // Enquanto o formulário envia, o Dialog não fecha: o erro da API não se perde
  // e o usuário não reabre para lançar de novo o que ainda está sendo salvo.
  const [ocupado, setOcupado] = useState(false);
  const proximaChave = useRef(0);

  function abrir(dados?: T) {
    proximaChave.current += 1;
    setOcupado(false);
    setForm({ aberto: true, chave: proximaChave.current, dados });
  }

  function fechar() {
    if (ocupado) return;
    setForm((atual) => ({ ...atual, aberto: false }));
  }

  // Chamado quando o save termina: fecha só se o Dialog aberto ainda é o deste save.
  function concluir() {
    const { chave } = form;
    setOcupado(false);
    setForm((atual) => (atual.chave === chave ? { ...atual, aberto: false } : atual));
  }

  return { form, abrir, fechar, concluir, setOcupado };
}
