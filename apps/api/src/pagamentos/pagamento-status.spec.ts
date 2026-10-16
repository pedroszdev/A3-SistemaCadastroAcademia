import type { StatusPagamento } from '../generated/prisma/enums';
import {
  calcularStatus,
  diasEmAtraso,
  type PagamentoParaStatus,
  type StatusCalculado,
} from './pagamento-status';

const HOJE = new Date('2026-10-10');

function pagamento(
  overrides: Partial<PagamentoParaStatus> = {},
): PagamentoParaStatus {
  return {
    status: 'PENDENTE',
    dataVencimento: new Date('2026-10-10'),
    dataPagamento: null,
    ...overrides,
  };
}

describe('pagamento-status', () => {
  describe('calcularStatus', () => {
    it.each<[string, StatusPagamento, string, string | null, StatusCalculado]>([
      ['cancelado não vencido', 'CANCELADO', '2026-10-15', null, 'CANCELADO'],
      [
        'cancelado vencido há 20 dias',
        'CANCELADO',
        '2026-09-20',
        null,
        'CANCELADO',
      ],
      [
        'cancelado com data de pagamento',
        'CANCELADO',
        '2026-09-20',
        '2026-09-25',
        'CANCELADO',
      ],
      [
        'pago antes do vencimento',
        'PENDENTE',
        '2026-10-15',
        '2026-10-05',
        'PAGO',
      ],
      [
        'pago depois do vencimento',
        'PENDENTE',
        '2026-09-20',
        '2026-10-05',
        'PAGO',
      ],
      ['vence hoje', 'PENDENTE', '2026-10-10', null, 'PENDENTE'],
      ['vence amanhã', 'PENDENTE', '2026-10-11', null, 'PENDENTE'],
      ['venceu ontem', 'PENDENTE', '2026-10-09', null, 'ATRASADO'],
      [
        'venceu há 10 dias (limite da RN09)',
        'PENDENTE',
        '2026-09-30',
        null,
        'ATRASADO',
      ],
      ['venceu há 11 dias', 'PENDENTE', '2026-09-29', null, 'ATRASADO'],
    ])('%s → %s', (_caso, status, dataVencimento, dataPagamento, esperado) => {
      const resultado = calcularStatus(
        pagamento({
          status,
          dataVencimento: new Date(dataVencimento),
          dataPagamento: dataPagamento ? new Date(dataPagamento) : null,
        }),
        HOJE,
      );

      expect(resultado).toBe(esperado);
    });
  });

  describe('diasEmAtraso', () => {
    it.each<[string, StatusPagamento, string, string | null, number]>([
      ['venceu ontem', 'PENDENTE', '2026-10-09', null, 1],
      [
        'venceu há 10 dias (limite da RN09)',
        'PENDENTE',
        '2026-09-30',
        null,
        10,
      ],
      ['venceu há 11 dias', 'PENDENTE', '2026-09-29', null, 11],
      ['vence hoje', 'PENDENTE', '2026-10-10', null, 0],
      ['vence no futuro', 'PENDENTE', '2026-10-20', null, 0],
      ['pago com atraso', 'PENDENTE', '2026-09-20', '2026-10-05', 0],
      ['cancelado vencido', 'CANCELADO', '2026-09-20', null, 0],
    ])('%s → %i', (_caso, status, dataVencimento, dataPagamento, esperado) => {
      const resultado = diasEmAtraso(
        pagamento({
          status,
          dataVencimento: new Date(dataVencimento),
          dataPagamento: dataPagamento ? new Date(dataPagamento) : null,
        }),
        HOJE,
      );

      expect(resultado).toBe(esperado);
    });
  });

  describe('data de referência padrão', () => {
    afterEach(() => {
      jest.useRealTimers();
    });

    it('calcularStatus usa o dia de hoje na academia', () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-10-10T15:00:00.000Z'));

      expect(
        calcularStatus(pagamento({ dataVencimento: new Date('2026-10-09') })),
      ).toBe('ATRASADO');
    });

    it('diasEmAtraso usa o dia de hoje na academia', () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-10-10T15:00:00.000Z'));

      expect(
        diasEmAtraso(pagamento({ dataVencimento: new Date('2026-10-09') })),
      ).toBe(1);
    });
  });
});
