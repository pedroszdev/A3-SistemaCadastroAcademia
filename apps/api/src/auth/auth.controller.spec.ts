import { FuncionariosService } from '../funcionarios/funcionarios.service';
import { Cargo } from '../generated/prisma/enums';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

const ID = '0199f0a2-7b3c-7d4e-8f00-123456789abc';

describe('AuthController', () => {
  let auth: { login: jest.Mock };
  let funcionarios: { findOne: jest.Mock };
  let controller: AuthController;

  beforeEach(() => {
    auth = { login: jest.fn() };
    funcionarios = { findOne: jest.fn() };
    controller = new AuthController(
      auth as unknown as AuthService,
      funcionarios as unknown as FuncionariosService,
    );
  });

  it('login delega o dto ao service', async () => {
    const dto: LoginDto = { login: 'maria01', senha: 'senha1234' };
    const resposta = { accessToken: 'token' };
    auth.login.mockResolvedValue(resposta);

    await expect(controller.login(dto)).resolves.toBe(resposta);
    expect(auth.login).toHaveBeenCalledWith(dto);
  });

  it('me busca o funcionário logado pelo id do token', async () => {
    const funcionario = { id: ID };
    funcionarios.findOne.mockResolvedValue(funcionario);

    await expect(
      controller.me({ id: ID, tipo: 'FUNCIONARIO', cargo: Cargo.ADMIN }),
    ).resolves.toBe(funcionario);
    expect(funcionarios.findOne).toHaveBeenCalledWith(ID);
  });
});
