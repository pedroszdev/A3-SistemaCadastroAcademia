import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateMembroDto } from './update-membro.dto';

async function validar(corpo: Record<string, unknown>) {
  const dto = plainToInstance(UpdateMembroDto, corpo);
  const erros = await validate(dto);
  const mensagens = erros.flatMap((e) => Object.values(e.constraints ?? {}));
  return { dto, mensagens };
}

describe('UpdateMembroDto', () => {
  it('aceita body vazio', async () => {
    const { mensagens } = await validar({});

    expect(mensagens).toEqual([]);
  });

  it('aceita edição parcial e normaliza o telefone', async () => {
    const { dto, mensagens } = await validar({
      nome: ' Ana Paula ',
      telefone: '(48) 3333-4444',
    });

    expect(mensagens).toEqual([]);
    expect(dto.nome).toBe('Ana Paula');
    expect(dto.telefone).toBe('4833334444');
    expect(dto.endereco).toBeUndefined();
  });

  it.each([
    [{ cpf: '52998224725' }, 'cpf não pode ser alterado'],
    [{ cpf: '' }, 'cpf não pode ser alterado'],
    [{ cpf: null }, 'cpf não pode ser alterado'],
    [{ nome: null }, 'nome deve ser um texto'],
    [{ nome: 'Ab' }, 'nome deve ter entre 3 e 120 caracteres'],
    [{ telefone: null }, 'telefone deve ser um texto'],
    [{ telefone: '123' }, 'telefone deve ter 10 ou 11 dígitos, com o DDD'],
    [{ endereco: null }, 'endereco deve ser um texto'],
    [{ endereco: 'Rua' }, 'endereco deve ter entre 5 e 200 caracteres'],
  ])('%o → "%s"', async (campos, mensagem) => {
    const { mensagens } = await validar(campos);

    expect(mensagens).toContain(mensagem);
  });
});
