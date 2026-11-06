import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { LoginAlunoDto } from './login-aluno.dto';

const valido = { cpf: '52998224725', senha: 'senha1234' };

async function validar(corpo: Record<string, unknown>) {
  const dto = plainToInstance(LoginAlunoDto, corpo);
  const erros = await validate(dto);
  const mensagens = erros.flatMap((e) => Object.values(e.constraints ?? {}));
  return { dto, mensagens };
}

describe('LoginAlunoDto', () => {
  it('aceita um corpo válido', async () => {
    const { mensagens } = await validar(valido);

    expect(mensagens).toEqual([]);
  });

  it('normaliza o CPF com máscara para só números e preserva a senha', async () => {
    const { dto, mensagens } = await validar({
      cpf: ' 529.982.247-25 ',
      senha: ' senha ',
    });

    expect(mensagens).toEqual([]);
    expect(dto.cpf).toBe('52998224725');
    expect(dto.senha).toBe(' senha ');
  });

  it('aceita CPF malformado (vira 401 no service)', async () => {
    const { mensagens } = await validar({ ...valido, cpf: '123' });

    expect(mensagens).toEqual([]);
  });

  it.each([
    [{ cpf: undefined }, 'cpf é obrigatório'],
    [{ cpf: '   ' }, 'cpf é obrigatório'],
    [{ cpf: 123 }, 'cpf deve ser um texto'],
    [{ senha: undefined }, 'senha é obrigatória'],
    [{ senha: 12345678 }, 'senha deve ser um texto'],
  ])('%o → "%s"', async (campos, mensagem) => {
    const { mensagens } = await validar({ ...valido, ...campos });

    expect(mensagens).toContain(mensagem);
  });
});
