import { plainToInstance } from 'class-transformer';
import { IsOptional, validate } from 'class-validator';
import { IsDataCalendario } from './is-data-calendario.decorator';
import { NaoAnteriorA, naoAnteriorA } from './nao-anterior-a.decorator';

class Alvo {
  @IsOptional()
  @IsDataCalendario()
  de?: Date;

  @IsOptional()
  @IsDataCalendario()
  @NaoAnteriorA('de')
  ate?: Date;
}

async function validar(corpo: Record<string, unknown>) {
  const dto = plainToInstance(Alvo, corpo);
  const erros = await validate(dto);
  return erros.flatMap((e) => Object.values(e.constraints ?? {}));
}

describe('NaoAnteriorA', () => {
  it.each([
    [{ de: '2026-10-01', ate: '2026-10-31' }],
    [{ de: '2026-10-01', ate: '2026-10-01' }],
    [{ de: '2026-10-01' }],
    [{ ate: '2026-10-01' }],
    [{}],
  ])('aceita %o', async (corpo) => {
    expect(await validar(corpo)).toEqual([]);
  });

  it('rejeita um fim anterior ao início', async () => {
    expect(await validar({ de: '2026-12-01', ate: '2026-01-01' })).toEqual([
      'ate não pode ser anterior a de',
    ]);
  });

  describe('naoAnteriorA', () => {
    const data = new Date('2026-10-01T00:00:00.000Z');

    it.each([
      ['texto', data],
      [new Date('x'), data],
      [data, undefined],
      [data, 'texto'],
    ])(
      'devolve true para (%o, %o), que é problema de outro validador',
      (valor, referencia) => {
        expect(naoAnteriorA(valor, referencia)).toBe(true);
      },
    );
  });
});
