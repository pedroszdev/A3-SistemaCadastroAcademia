import { FuncionariosService } from '../funcionarios/funcionarios.service';
import { Cargo } from '../generated/prisma/enums';
import { MembrosService } from '../membros/membros.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginAlunoDto } from './dto/login-aluno.dto';
import { LoginDto } from './dto/login.dto';

const ID = '0199f0a2-7b3c-7d4e-8f00-123456789abc';

describe('AuthController', () => {
  let auth: { login: jest.Mock; loginAluno: jest.Mock };
  let funcionarios: { findOne: jest.Mock };
  let membros: { findOne: jest.Mock };
  let controller: AuthController;

  beforeEach(() => {
    auth = { login: jest.fn(), loginAluno: jest.fn() };
    funcionarios = { findOne: jest.fn() };
    membros = { findOne: jest.fn() };
    controller = new AuthController(
      auth as unknown as AuthService,
      funcionarios as unknown as FuncionariosService,
      membros as unknown as MembrosService,
    );
  });

  it('login delega o dto ao service', async () => {
    const dto: LoginDto = { login: 'maria01', senha: 'senha1234' };
    const resposta = { accessToken: 'token' };
    auth.login.mockResolvedValue(resposta);

    await expect(controller.login(dto)).resolves.toBe(resposta);
    expect(auth.login).toHaveBeenCalledWith(dto);
  });

  it('loginAluno delega o dto ao service', async () => {
    const dto: LoginAlunoDto = { cpf: '52998224725', senha: 'senha1234' };
    const resposta = { accessToken: 'token' };
    auth.loginAluno.mockResolvedValue(resposta);

    await expect(controller.loginAluno(dto)).resolves.toBe(resposta);
    expect(auth.loginAluno).toHaveBeenCalledWith(dto);
  });

  it('me busca o funcionário logado pelo id do token', async () => {
    const funcionario = { id: ID };
    funcionarios.findOne.mockResolvedValue(funcionario);

    await expect(
      controller.me({ id: ID, tipo: 'FUNCIONARIO', cargo: Cargo.ADMIN }),
    ).resolves.toBe(funcionario);
    expect(funcionarios.findOne).toHaveBeenCalledWith(ID);
  });

  it('me busca o aluno logado em MembrosService', async () => {
    const aluno = { id: ID };
    membros.findOne.mockResolvedValue(aluno);

    await expect(controller.me({ id: ID, tipo: 'ALUNO' })).resolves.toBe(aluno);
    expect(membros.findOne).toHaveBeenCalledWith(ID);
    expect(funcionarios.findOne).not.toHaveBeenCalled();
  });
});
