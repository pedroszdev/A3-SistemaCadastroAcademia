import { paraBooleano } from './para-booleano';

describe('paraBooleano', () => {
  it("converte 'true' em true", () => {
    expect(paraBooleano({ value: 'true' })).toBe(true);
  });

  it("converte 'false' em false", () => {
    expect(paraBooleano({ value: 'false' })).toBe(false);
  });

  it.each([['sim'], ['TRUE'], [1], [null], [undefined]])(
    'devolve %p sem alterar',
    (value) => {
      expect(paraBooleano({ value })).toBe(value);
    },
  );
});
