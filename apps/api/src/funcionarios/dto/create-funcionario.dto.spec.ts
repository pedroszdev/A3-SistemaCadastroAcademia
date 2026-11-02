import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateFuncionarioDto } from './create-funcionario.dto';

const valido = {
  nome: 'Maria Souza',
  cargo: 'RECEPCIONISTA',
  login: 'maria01',
  senha: 'senha1234',
};

async function validar(corpo: Record<string, unknown>) {
  const dto = plainToInstance(CreateFuncionarioDto, corpo);
  const erros = await validate(dto);
  const mensagens = erros.flatMap((e) => Object.values(e.constraints ?? {}));
  return { dto, mensagens };
}

describe('CreateFuncionarioDto', () => {
  it('aceita um funcionário válido', async () => {
    const { mensagens } = await validar(valido);

    expect(mensagens).toEqual([]);
  });

  it('remove espaços de nome e login', async () => {
    const { dto, mensagens } = await validar({
      ...valido,
      nome: '  Maria Souza  ',
      login: ' maria01 ',
    });

    expect(mensagens).toEqual([]);
    expect(dto.nome).toBe('Maria Souza');
    expect(dto.login).toBe('maria01');
  });

  it('aceita login e senha nos limites', async () => {
    const { mensagens } = await validar({
      ...valido,
      login: 'a'.repeat(30),
      senha: 'x'.repeat(72),
    });

    expect(mensagens).toEqual([]);
  });

  it.each([
    [{ nome: 'Ab' }, 'nome deve ter entre 3 e 100 caracteres'],
    [{ cargo: 'GERENTE' }, 'cargo deve ser ADMIN, RECEPCIONISTA ou INSTRUTOR'],
    [{ login: 'ab' }, 'login deve ter entre 3 e 30 caracteres'],
    [{ login: 'a'.repeat(31) }, 'login deve ter entre 3 e 30 caracteres'],
    [{ login: 'maria.souza' }, 'login deve ter apenas letras e números'],
    [{ senha: '1234567' }, 'senha deve ter no mínimo 8 caracteres'],
    [{ senha: 'x'.repeat(73) }, 'senha deve ter no máximo 72 bytes'],
    // 40 caracteres, mas 80 bytes em UTF-8
    [{ senha: 'ç'.repeat(40) }, 'senha deve ter no máximo 72 bytes'],
    [{ senha: 12345678 }, 'senha deve ser um texto'],
  ])('%o → "%s"', async (campos, mensagem) => {
    const { mensagens } = await validar({ ...valido, ...campos });

    expect(mensagens).toContain(mensagem);
  });
});
