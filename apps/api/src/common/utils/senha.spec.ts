import { compare, getRounds } from 'bcryptjs';
import { hashSenha, SALT_ROUNDS } from './senha';

describe('hashSenha', () => {
  it('gera um hash bcrypt com o SALT_ROUNDS que confere com a senha', async () => {
    const hash = await hashSenha('senha1234');

    expect(getRounds(hash)).toBe(SALT_ROUNDS);
    expect(await compare('senha1234', hash)).toBe(true);
    expect(await compare('outra', hash)).toBe(false);
  });
});
