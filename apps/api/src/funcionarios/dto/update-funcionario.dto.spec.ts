import { ValidationPipe } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateFuncionarioDto } from './update-funcionario.dto';

async function validar(corpo: Record<string, unknown>) {
  const dto = plainToInstance(UpdateFuncionarioDto, corpo);
  const erros = await validate(dto);
  const mensagens = erros.flatMap((e) => Object.values(e.constraints ?? {}));
  return { dto, mensagens };
}

describe('UpdateFuncionarioDto', () => {
  it('aceita corpo vazio', async () => {
    const { mensagens } = await validar({});

    expect(mensagens).toEqual([]);
  });

  it('aceita todos os campos e apara o nome', async () => {
    const { dto, mensagens } = await validar({
      nome: '  Maria Souza ',
      cargo: 'INSTRUTOR',
      senha: 'novaSenha123',
    });

    expect(mensagens).toEqual([]);
    expect(dto.nome).toBe('Maria Souza');
  });

  it.each([
    [{ nome: 'Ab' }, 'nome deve ter entre 3 e 100 caracteres'],
    [{ cargo: 'GERENTE' }, 'cargo deve ser ADMIN, RECEPCIONISTA ou INSTRUTOR'],
    [{ senha: '1234567' }, 'senha deve ter no mínimo 8 caracteres'],
    [{ senha: 'x'.repeat(73) }, 'senha deve ter no máximo 72 bytes'],
    // 40 caracteres, mas 80 bytes em UTF-8
    [{ senha: 'ç'.repeat(40) }, 'senha deve ter no máximo 72 bytes'],
  ])('%o → "%s"', async (campos, mensagem) => {
    const { mensagens } = await validar(campos);

    expect(mensagens).toContain(mensagem);
  });

  it('rejeita login com a whitelist do ValidationPipe', async () => {
    const pipe = new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    });

    await expect(
      pipe.transform(
        { login: 'outro' },
        { type: 'body', metatype: UpdateFuncionarioDto },
      ),
    ).rejects.toMatchObject({
      response: { message: ['property login should not exist'] },
    });
  });
});
