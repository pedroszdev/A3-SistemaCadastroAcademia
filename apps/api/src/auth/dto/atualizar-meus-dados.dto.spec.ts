import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AtualizarMeusDadosDto } from './atualizar-meus-dados.dto';

async function validar(corpo: Record<string, unknown>) {
  const dto = plainToInstance(AtualizarMeusDadosDto, corpo);
  const erros = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return {
    dto,
    mensagens: erros.flatMap((e) => Object.values(e.constraints ?? {})),
  };
}

describe('AtualizarMeusDadosDto (RN20)', () => {
  it('normaliza o telefone e apara nome e endereço', async () => {
    const { dto, mensagens } = await validar({
      nome: '  Marina  ',
      telefone: '(48) 99999-0000',
      endereco: ' Rua Nova, 10 ',
    });

    expect(mensagens).toEqual([]);
    expect(dto).toMatchObject({
      nome: 'Marina',
      telefone: '48999990000',
      endereco: 'Rua Nova, 10',
    });
  });

  it('aceita o corpo vazio', async () => {
    await expect(validar({})).resolves.toMatchObject({ mensagens: [] });
  });

  it.each([
    [{ nome: 'ab' }, 'nome deve ter entre 3 e 100 caracteres'],
    [{ endereco: 'Rua' }, 'endereco deve ter entre 5 e 200 caracteres'],
  ])('recusa %o', async (corpo, mensagem) => {
    const { mensagens } = await validar(corpo);

    expect(mensagens).toContain(mensagem);
  });

  it.each(['cpf', 'login', 'cargo'])('recusa o campo %s', async (campo) => {
    const { mensagens } = await validar({ [campo]: 'x' });

    expect(mensagens).toHaveLength(1);
  });
});
