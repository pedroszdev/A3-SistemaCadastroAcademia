import { CreateMembroDto } from './dto/create-membro.dto';
import { QueryMembroDto } from './dto/query-membro.dto';
import { UpdateMembroDto } from './dto/update-membro.dto';
import { MembrosController } from './membros.controller';
import { MembrosService } from './membros.service';

const ID = '0199f0a2-7b3c-7d4e-8f00-123456789abc';

describe('MembrosController', () => {
  let service: {
    findAll: jest.Mock;
    create: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    desativar: jest.Mock;
    reativar: jest.Mock;
  };
  let controller: MembrosController;

  beforeEach(() => {
    service = {
      findAll: jest.fn(),
      create: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      desativar: jest.fn(),
      reativar: jest.fn(),
    };
    controller = new MembrosController(service as unknown as MembrosService);
  });

  it('findAll delega a query ao service', async () => {
    const query: QueryMembroDto = { page: 1, pageSize: 20 };
    const pagina = { data: [], total: 0, page: 1, pageSize: 20 };
    service.findAll.mockResolvedValue(pagina);

    await expect(controller.findAll(query)).resolves.toBe(pagina);
    expect(service.findAll).toHaveBeenCalledWith(query);
  });

  it('create delega o dto ao service', async () => {
    const dto: CreateMembroDto = {
      nome: 'Ana Pereira',
      cpf: '52998224725',
      telefone: '48999991234',
      endereco: 'Rua das Flores, 100',
    };
    const criado = { id: ID };
    service.create.mockResolvedValue(criado);

    await expect(controller.create(dto)).resolves.toBe(criado);
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('findOne delega o id ao service', async () => {
    const membro = { id: ID };
    service.findOne.mockResolvedValue(membro);

    await expect(controller.findOne(ID)).resolves.toBe(membro);
    expect(service.findOne).toHaveBeenCalledWith(ID);
  });

  it('update delega id e dto ao service', async () => {
    const dto = { nome: 'Novo Nome' } as UpdateMembroDto;
    const atualizado = { id: ID };
    service.update.mockResolvedValue(atualizado);

    await expect(controller.update(ID, dto)).resolves.toBe(atualizado);
    expect(service.update).toHaveBeenCalledWith(ID, dto);
  });

  it.each(['desativar', 'reativar'] as const)(
    '%s delega só o id ao service',
    async (metodo) => {
      const retorno = { id: ID };
      service[metodo].mockResolvedValue(retorno);

      await expect(controller[metodo](ID)).resolves.toBe(retorno);
      expect(service[metodo]).toHaveBeenCalledWith(ID);
    },
  );
});
