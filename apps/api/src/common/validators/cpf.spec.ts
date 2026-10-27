import { isCpfValido, normalizarCpf } from './cpf';

// CPFs fictícios, gerados com o próprio algoritmo dos dígitos verificadores.

describe('cpf', () => {
  describe('normalizarCpf', () => {
    it.each([
      ['com máscara', '123.456.789-09', '12345678909'],
      ['sem máscara', '12345678909', '12345678909'],
      ['máscara parcial', '123456789-09', '12345678909'],
      ['espaços nas pontas', '  123.456.789-09 ', '12345678909'],
      ['mantém letras', '123.abc.789-09', '123abc78909'],
      ['vazio', '', ''],
    ])('%s: %o → %o', (_caso, valor, esperado) => {
      expect(normalizarCpf(valor)).toBe(esperado);
    });
  });

  describe('isCpfValido', () => {
    it.each([
      ['sem máscara', '11144477735'],
      ['com máscara', '111.444.777-35'],
      ['espaços nas pontas', ' 111.444.777-35 '],
      ['1º dígito com resto 10', '123.456.789-09'],
      ['2º dígito com resto 10', '987.654.321-00'],
      ['começando com zeros', '000.000.001-91'],
    ])('%s: %o → válido', (_caso, cpf) => {
      expect(isCpfValido(cpf)).toBe(true);
    });

    it.each([
      ['1º dígito errado', '111.444.777-45'],
      ['2º dígito errado', '111.444.777-36'],
      ['dígitos trocados', '111.444.777-53'],
      ['10 dígitos', '1114447773'],
      ['12 dígitos', '111444777350'],
      ['zeros', '000.000.000-00'],
      ['todos iguais', '111.111.111-11'],
      ['letras', '111.444.777-3a'],
      ['espaço no meio', '111 444 777 35'],
      ['vazio', ''],
    ])('%s: %o → inválido', (_caso, cpf) => {
      expect(isCpfValido(cpf)).toBe(false);
    });

    it.each([[11144477735], [null], [undefined], [{}]])(
      '%o (não é texto) → inválido',
      (valor) => {
        expect(isCpfValido(valor)).toBe(false);
      },
    );
  });
});
