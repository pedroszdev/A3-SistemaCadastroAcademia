import { paginacaoPrisma, paginate } from './paginate';

describe('paginate utils', () => {
  describe('paginacaoPrisma', () => {
    it.each([
      [1, 20, { skip: 0, take: 20 }],
      [3, 20, { skip: 40, take: 20 }],
      [2, 100, { skip: 100, take: 100 }],
    ])('page %i, pageSize %i → %o', (page, pageSize, esperado) => {
      expect(paginacaoPrisma({ page, pageSize })).toEqual(esperado);
    });
  });

  describe('paginate', () => {
    it('monta a resposta no formato padrão de listas', () => {
      expect(paginate(['a', 'b'], 42, { page: 3, pageSize: 2 })).toEqual({
        data: ['a', 'b'],
        total: 42,
        page: 3,
        pageSize: 2,
      });
    });
  });
});
