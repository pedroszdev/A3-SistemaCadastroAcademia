import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { IsDataCalendario } from './is-data-calendario.decorator';
import { NaoFutura, naoFutura } from './nao-futura.decorator';

class Alvo {
  @IsDataCalendario()
  @NaoFutura()
  data!: Date;
}

async function validar(corpo: Record<string, unknown>) {
  const dto = plainToInstance(Alvo, corpo);
  const erros = await validate(dto);
  return erros.flatMap((e) => Object.values(e.constraints ?? {}));
}

describe('NaoFutura', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  describe('ao meio-dia em SP', () => {
    beforeEach(() => {
      jest.useFakeTimers().setSystemTime(new Date('2026-10-16T15:00:00.000Z'));
    });

    it.each([['2026-10-16'], ['2026-10-15'], ['2025-01-01']])(
      '%s é aceita',
      async (data) => {
        expect(await validar({ data })).toEqual([]);
      },
    );

    it('rejeita amanhã', async () => {
      expect(await validar({ data: '2026-10-17' })).toEqual([
        'data não pode ser uma data futura',
      ]);
    });
  });

  it('às 22h em SP (UTC já virou o dia), o dia seguinte ainda é futuro', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-17T01:00:00.000Z'));

    expect(await validar({ data: '2026-10-16' })).toEqual([]);
    expect(await validar({ data: '2026-10-17' })).toEqual([
      'data não pode ser uma data futura',
    ]);
  });

  describe('naoFutura', () => {
    it.each([['texto'], [new Date('x')], [undefined], [20261110]])(
      'devolve true para %o, que é problema do IsDataCalendario',
      (valor) => {
        expect(naoFutura(valor)).toBe(true);
      },
    );
  });
});
