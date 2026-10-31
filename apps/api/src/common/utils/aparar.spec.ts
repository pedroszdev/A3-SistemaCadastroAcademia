import { aparar } from './aparar';

describe('aparar', () => {
  it('remove os espaços das pontas de um texto', () => {
    expect(aparar({ value: '  Maria Souza ' })).toBe('Maria Souza');
  });

  it.each([[123], [null], [undefined]])('devolve %p sem alterar', (value) => {
    expect(aparar({ value })).toBe(value);
  });
});
