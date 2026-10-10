import { diasEntre, hoje, inicioDoDia } from './date';

describe('date utils', () => {
  describe('hoje', () => {
    afterEach(() => {
      jest.useRealTimers();
    });

    it.each([
      ['meio-dia em SP', '2026-10-10T15:00:00.000Z', '2026-10-10'],
      [
        '22h em SP (UTC já virou o dia)',
        '2026-10-11T01:00:00.000Z',
        '2026-10-10',
      ],
      ['00h30 em SP', '2026-10-10T03:30:00.000Z', '2026-10-10'],
      ['23h59 em SP no fim do ano', '2027-01-01T02:59:00.000Z', '2026-12-31'],
    ])('%s → %s', (_caso, agora, esperado) => {
      jest.useFakeTimers().setSystemTime(new Date(agora));

      expect(hoje().toISOString()).toBe(`${esperado}T00:00:00.000Z`);
    });

    it('aceita a data atual por parâmetro', () => {
      expect(hoje(new Date('2026-10-11T01:00:00.000Z')).toISOString()).toBe(
        '2026-10-10T00:00:00.000Z',
      );
    });
  });

  describe('inicioDoDia', () => {
    it('remove o horário mantendo o dia em UTC', () => {
      expect(
        inicioDoDia(new Date('2026-10-10T18:45:12.345Z')).toISOString(),
      ).toBe('2026-10-10T00:00:00.000Z');
    });
  });

  describe('diasEntre', () => {
    it.each([
      ['mesmo dia', '2026-10-10', '2026-10-10', 0],
      ['ontem → hoje', '2026-10-09', '2026-10-10', 1],
      ['invertido', '2026-10-10', '2026-10-09', -1],
      ['10 dias (limite da RN09)', '2026-09-30', '2026-10-10', 10],
      ['11 dias', '2026-09-29', '2026-10-10', 11],
      ['virada de mês', '2026-10-31', '2026-11-01', 1],
      ['virada de ano', '2026-12-31', '2027-01-01', 1],
      ['ano bissexto', '2028-02-28', '2028-03-01', 2],
    ])('%s: %s → %s = %i', (_caso, a, b, esperado) => {
      expect(diasEntre(new Date(a), new Date(b))).toBe(esperado);
    });

    it('ignora o horário dentro do mesmo dia', () => {
      expect(
        diasEntre(
          new Date('2026-10-10T00:00:01.000Z'),
          new Date('2026-10-10T23:59:59.000Z'),
        ),
      ).toBe(0);
    });
  });
});
