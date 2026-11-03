import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  DentroDosUltimosDias,
  dentroDosUltimosDias,
} from './dentro-dos-ultimos-dias.decorator';
import { IsDataCalendario } from './is-data-calendario.decorator';

class Alvo {
  @IsDataCalendario()
  @DentroDosUltimosDias(90)
  data!: Date;
}

async function validar(corpo: Record<string, unknown>) {
  const dto = plainToInstance(Alvo, corpo);
  const erros = await validate(dto);
  return erros.flatMap((e) => Object.values(e.constraints ?? {}));
}

describe('DentroDosUltimosDias', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-16T15:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it.each([['2026-10-16'], ['2026-07-18'], ['2027-01-01']])(
    '%s é aceita (hoje, limite de 90 dias ou futura)',
    async (data) => {
      expect(await validar({ data })).toEqual([]);
    },
  );

  it.each([['2026-07-17'], ['2025-10-16'], ['1900-01-01']])(
    'rejeita %s',
    async (data) => {
      expect(await validar({ data })).toEqual([
        'data não pode ter mais de 90 dias no passado',
      ]);
    },
  );

  describe('dentroDosUltimosDias', () => {
    it.each([['texto'], [new Date('x')], [undefined], [20261110]])(
      'devolve true para %o, que é problema do IsDataCalendario',
      (valor) => {
        expect(dentroDosUltimosDias(valor, 90)).toBe(true);
      },
    );
  });
});
