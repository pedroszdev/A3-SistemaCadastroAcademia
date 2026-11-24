import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { TrocarSenhaDto } from './trocar-senha.dto';

async function mensagens(corpo: Record<string, unknown>) {
  const erros = await validate(plainToInstance(TrocarSenhaDto, corpo));
  return erros.flatMap((e) => Object.values(e.constraints ?? {}));
}

describe('TrocarSenhaDto (RN20)', () => {
  it('aceita a senha atual e a nova com 8 caracteres', async () => {
    await expect(
      mensagens({ senhaAtual: 'x', novaSenha: '12345678' }),
    ).resolves.toEqual([]);
  });

  it.each([
    [{ senhaAtual: '', novaSenha: '12345678' }, 'senhaAtual é obrigatória'],
    [
      { senhaAtual: 'x', novaSenha: '1234567' },
      'novaSenha deve ter no mínimo 8 caracteres',
    ],
    [
      { senhaAtual: 'x', novaSenha: 'ç'.repeat(37) },
      'novaSenha deve ter no máximo 72 bytes',
    ],
  ])('recusa %o', async (corpo, mensagem) => {
    await expect(mensagens(corpo)).resolves.toContain(mensagem);
  });
});
