import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { LiberarAcessoDto } from './liberar-acesso.dto';

async function validar(corpo: Record<string, unknown>) {
  const dto = plainToInstance(LiberarAcessoDto, corpo);
  const erros = await validate(dto);
  return erros.flatMap((e) => Object.values(e.constraints ?? {}));
}

describe('LiberarAcessoDto', () => {
  it('aceita uma senha válida', async () => {
    await expect(validar({ senha: 'senha1234' })).resolves.toEqual([]);
  });

  it.each(['12345678', 'x'.repeat(72)])(
    'aceita a senha nos limites (%s)',
    async (senha) => {
      await expect(validar({ senha })).resolves.toEqual([]);
    },
  );

  it.each([
    [{ senha: '1234567' }, 'senha deve ter no mínimo 8 caracteres'],
    [{ senha: 'x'.repeat(73) }, 'senha deve ter no máximo 72 bytes'],
    [{ senha: 'ç'.repeat(40) }, 'senha deve ter no máximo 72 bytes'],
    [{ senha: 12345678 }, 'senha deve ser um texto'],
    [{}, 'senha deve ser um texto'],
  ])('recusa %j', async (corpo, mensagem) => {
    await expect(validar(corpo)).resolves.toContain(mensagem);
  });
});
