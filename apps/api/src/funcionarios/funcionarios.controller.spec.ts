import { Cargo } from '../generated/prisma/enums';
import { CreateFuncionarioDto } from './dto/create-funcionario.dto';
import { QueryFuncionarioDto } from './dto/query-funcionario.dto';
import { UpdateFuncionarioDto } from './dto/update-funcionario.dto';
import { FuncionariosController } from './funcionarios.controller';
import { FuncionariosService } from './funcionarios.service';

const ID = '0199f0a2-7b3c-7d4e-8f00-123456789abc';

describe('FuncionariosController', () => {
  let service: {
    findAll: jest.Mock;
    create: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    desativar: jest.Mock;
    reativar: jest.Mock;
  };
  let controller: FuncionariosController;

  beforeEach(() => {
    service = {
      findAll: jest.fn(),
      create: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      desativar: jest.fn(),
      reativar: jest.fn(),
    };
    controller = new FuncionariosController(
      service as unknown as FuncionariosService,
    );
  });

  it('findAll delega a query ao service', async () => {
    const query = { page: 1, pageSize: 20 } as QueryFuncionarioDto;
    const pagina = { data: [], total: 0, page: 1, pageSize: 20 };
    service.findAll.mockResolvedValue(pagina);

    await expect(controller.findAll(query)).resolves.toBe(pagina);
    expect(service.findAll).toHaveBeenCalledWith(query);
  });

  it('create delega o dto ao service', async () => {
    const dto = {
      nome: 'Maria Souza',
      cargo: Cargo.INSTRUTOR,
      login: 'maria01',
      senha: 'senha1234',
    } as CreateFuncionarioDto;
    const criado = { id: ID };
    service.create.mockResolvedValue(criado);

    await expect(controller.create(dto)).resolves.toBe(criado);
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('findOne delega o id ao service', async () => {
    const funcionario = { id: ID };
    service.findOne.mockResolvedValue(funcionario);

    await expect(controller.findOne(ID)).resolves.toBe(funcionario);
    expect(service.findOne).toHaveBeenCalledWith(ID);
  });

  it('update delega id e dto ao service', async () => {
    const dto = { nome: 'Novo Nome' } as UpdateFuncionarioDto;
    const atualizado = { id: ID };
    service.update.mockResolvedValue(atualizado);

    await expect(controller.update(ID, dto)).resolves.toBe(atualizado);
    expect(service.update).toHaveBeenCalledWith(ID, dto);
  });

  it('desativar delega só o id ao service', async () => {
    const desativado = { id: ID, ativo: false };
    service.desativar.mockResolvedValue(desativado);

    await expect(controller.desativar(ID)).resolves.toBe(desativado);
    expect(service.desativar).toHaveBeenCalledWith(ID);
  });

  it('reativar delega o id ao service', async () => {
    const reativado = { id: ID, ativo: true };
    service.reativar.mockResolvedValue(reativado);

    await expect(controller.reativar(ID)).resolves.toBe(reativado);
    expect(service.reativar).toHaveBeenCalledWith(ID);
  });
});
