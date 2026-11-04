import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { LoginDto } from './login.dto';

const valido = { login: 'maria01', senha: 'senha1234' };

async function validar(corpo: Record<string, unknown>) {
  const dto = plainToInstance(LoginDto, corpo);
  const erros = await validate(dto);
  const mensagens = erros.flatMap((e) => Object.values(e.constraints ?? {}));
  return { dto, mensagens };
}

describe('LoginDto', () => {
  it('aceita um corpo válido', async () => {
    const { mensagens } = await validar(valido);

    expect(mensagens).toEqual([]);
  });

  it('remove espaços do login e preserva os da senha', async () => {
    const { dto, mensagens } = await validar({
      login: ' maria01 ',
      senha: ' senha ',
    });

    expect(mensagens).toEqual([]);
    expect(dto.login).toBe('maria01');
    expect(dto.senha).toBe(' senha ');
  });

  it('aceita login curto e senha curta (viram 401 no service)', async () => {
    const { mensagens } = await validar({ login: 'a', senha: '1' });

    expect(mensagens).toEqual([]);
  });

  it('não limita o tamanho das credenciais (viram 401 no service)', async () => {
    const { mensagens } = await validar({
      login: 'a'.repeat(31),
      senha: 'x'.repeat(73),
    });

    expect(mensagens).toEqual([]);
  });

  it('não quebra com surrogate solto na senha', async () => {
    const { mensagens } = await validar({ ...valido, senha: '\ud800' });

    expect(mensagens).toEqual([]);
  });

  it.each([
    [{ login: undefined }, 'login é obrigatório'],
    [{ login: '   ' }, 'login é obrigatório'],
    [{ login: 123 }, 'login deve ser um texto'],
    [{ senha: undefined }, 'senha é obrigatória'],
    [{ senha: 12345678 }, 'senha deve ser um texto'],
  ])('%o → "%s"', async (campos, mensagem) => {
    const { mensagens } = await validar({ ...valido, ...campos });

    expect(mensagens).toContain(mensagem);
  });
});
