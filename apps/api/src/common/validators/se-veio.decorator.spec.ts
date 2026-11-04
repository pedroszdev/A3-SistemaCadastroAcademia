import { plainToInstance } from 'class-transformer';
import { IsString, validate } from 'class-validator';
import { SeVeio } from './se-veio.decorator';

class Alvo {
  @SeVeio()
  @IsString({ message: 'campo deve ser um texto' })
  campo?: unknown;
}

async function mensagensDe(corpo: Record<string, unknown>) {
  const erros = await validate(plainToInstance(Alvo, corpo));
  return erros.flatMap((e) => Object.values(e.constraints ?? {}));
}

describe('SeVeio', () => {
  it.each([[{}], [{ campo: 'x' }]])('%o → aceita', async (corpo) => {
    expect(await mensagensDe(corpo)).toEqual([]);
  });

  it.each([[{ campo: null }], [{ campo: 123 }]])(
    '%o → rejeita',
    async (corpo) => {
      expect(await mensagensDe(corpo)).toEqual(['campo deve ser um texto']);
    },
  );
});
