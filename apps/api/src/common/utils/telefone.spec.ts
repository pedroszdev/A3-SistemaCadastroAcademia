import { normalizarTelefone } from './telefone';

describe('normalizarTelefone', () => {
  it.each([
    ['(48) 99999-1234', '48999991234'],
    ['+55 48 3333-4444', '554833334444'],
    [' 48 3333.4444 ', '4833334444'],
  ])('%o → %o', (value, esperado) => {
    expect(normalizarTelefone({ value })).toBe(esperado);
  });

  it.each([[48999991234], [null], [undefined]])(
    'devolve %p sem alterar',
    (value) => {
      expect(normalizarTelefone({ value })).toBe(value);
    },
  );
});
