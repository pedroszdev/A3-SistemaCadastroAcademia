import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  IsDataCalendario,
  paraDataCalendario,
} from './is-data-calendario.decorator';

class Alvo {
  @IsDataCalendario()
  data!: Date;
}

async function validar(corpo: Record<string, unknown>) {
  const dto = plainToInstance(Alvo, corpo);
  const erros = await validate(dto);
  const mensagens = erros.flatMap((e) => Object.values(e.constraints ?? {}));
  return { dto, mensagens };
}

describe('IsDataCalendario', () => {
  it('converte AAAA-MM-DD para meia-noite UTC do dia', async () => {
    const { dto, mensagens } = await validar({ data: '2026-11-10' });

    expect(mensagens).toEqual([]);
    expect(dto.data.toISOString()).toBe('2026-11-10T00:00:00.000Z');
  });

  it('aceita 29 de fevereiro em ano bissexto', async () => {
    const { dto, mensagens } = await validar({ data: '2028-02-29' });

    expect(mensagens).toEqual([]);
    expect(dto.data.toISOString()).toBe('2028-02-29T00:00:00.000Z');
  });

  it.each([
    ['2026-02-30'],
    ['2027-02-29'],
    ['2026-13-01'],
    ['10/11/2026'],
    ['2026-11-10T10:00:00Z'],
    [20261110],
    [undefined],
  ])('%o → rejeita', async (data) => {
    const { mensagens } = await validar({ data });

    expect(mensagens).toEqual([
      'data deve ser uma data válida no formato AAAA-MM-DD',
    ]);
  });

  describe('paraDataCalendario', () => {
    it.each([['2026-02-30'], ['10/11/2026'], [20261110], [undefined], [null]])(
      'devolve %o intocado quando inválido',
      (valor) => {
        expect(paraDataCalendario(valor)).toBe(valor);
      },
    );
  });
});
