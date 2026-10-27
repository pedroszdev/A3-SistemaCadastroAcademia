import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { IsCpf } from './is-cpf.decorator';

class Alvo {
  @IsCpf()
  cpf!: string;
}

class AlvoComMensagem {
  @IsCpf({ message: 'CPF inválido' })
  cpf!: string;
}

async function mensagensDe<T extends object>(
  classe: new () => T,
  corpo: Record<string, unknown>,
) {
  const erros = await validate(plainToInstance(classe, corpo));
  return erros.flatMap((e) => Object.values(e.constraints ?? {}));
}

describe('IsCpf', () => {
  it.each([['111.444.777-35'], ['11144477735']])('%o → aceita', async (cpf) => {
    expect(await mensagensDe(Alvo, { cpf })).toEqual([]);
  });

  it.each([['111.444.777-35'], [' 111.444.777-35 '], ['11144477735']])(
    '%o → guarda só os números',
    (cpf) => {
      expect(plainToInstance(Alvo, { cpf }).cpf).toBe('11144477735');
    },
  );

  it.each([
    ['111.444.777-36'],
    ['111.111.111-11'],
    [11144477735],
    [undefined],
    [null],
    [{}],
    [['111.444.777-35']],
  ])('%o → rejeita', async (cpf) => {
    expect(await mensagensDe(Alvo, { cpf })).toEqual([
      'cpf deve ser um CPF válido',
    ]);
  });

  it('aceita uma mensagem própria', async () => {
    expect(await mensagensDe(AlvoComMensagem, { cpf: '123' })).toEqual([
      'CPF inválido',
    ]);
  });
});
