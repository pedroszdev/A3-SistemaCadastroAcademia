import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateMembroDto } from './create-membro.dto';

// CPF gerado para testes, não pertence a ninguém.
const valido = {
  nome: 'Ana Pereira',
  cpf: '529.982.247-25',
  telefone: '(48) 99999-1234',
  endereco: 'Rua das Flores, 100',
};

async function validar(corpo: Record<string, unknown>) {
  const dto = plainToInstance(CreateMembroDto, corpo);
  const erros = await validate(dto);
  const mensagens = erros.flatMap((e) => Object.values(e.constraints ?? {}));
  return { dto, mensagens };
}

describe('CreateMembroDto', () => {
  it('aceita um membro válido e normaliza CPF e telefone', async () => {
    const { dto, mensagens } = await validar(valido);

    expect(mensagens).toEqual([]);
    expect(dto.cpf).toBe('52998224725');
    expect(dto.telefone).toBe('48999991234');
  });

  it('remove espaços de nome e endereço', async () => {
    const { dto, mensagens } = await validar({
      ...valido,
      nome: '  Ana Pereira ',
      endereco: ' Rua das Flores, 100  ',
    });

    expect(mensagens).toEqual([]);
    expect(dto.nome).toBe('Ana Pereira');
    expect(dto.endereco).toBe('Rua das Flores, 100');
  });

  it('aceita telefone fixo com 10 dígitos e campos nos limites', async () => {
    const { mensagens } = await validar({
      ...valido,
      nome: 'a'.repeat(120),
      telefone: '4833334444',
      endereco: 'b'.repeat(200),
    });

    expect(mensagens).toEqual([]);
  });

  it.each([
    [{ nome: 'Ab' }, 'nome deve ter entre 3 e 120 caracteres'],
    [{ nome: 'a'.repeat(121) }, 'nome deve ter entre 3 e 120 caracteres'],
    [{ nome: 123 }, 'nome deve ser um texto'],
    [{ cpf: '529.982.247-26' }, 'cpf deve ser um CPF válido'],
    [{ cpf: '111.111.111-11' }, 'cpf deve ser um CPF válido'],
    [{ cpf: undefined }, 'cpf deve ser um CPF válido'],
    [
      { telefone: '999991234' },
      'telefone deve ter 10 ou 11 dígitos, com o DDD',
    ],
    [
      { telefone: '489999912345' },
      'telefone deve ter 10 ou 11 dígitos, com o DDD',
    ],
    [
      { telefone: '48 9999a1234' },
      'telefone deve ter 10 ou 11 dígitos, com o DDD',
    ],
    [{ telefone: 48999991234 }, 'telefone deve ser um texto'],
    [{ endereco: 'Rua' }, 'endereco deve ter entre 5 e 200 caracteres'],
    [
      { endereco: 'b'.repeat(201) },
      'endereco deve ter entre 5 e 200 caracteres',
    ],
    [{ endereco: null }, 'endereco deve ser um texto'],
  ])('%o → "%s"', async (campos, mensagem) => {
    const { mensagens } = await validar({ ...valido, ...campos });

    expect(mensagens).toContain(mensagem);
  });
});
