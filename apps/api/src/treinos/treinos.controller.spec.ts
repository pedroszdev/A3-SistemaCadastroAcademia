import { CreateTreinoDto } from './dto/create-treino.dto';
import { QueryTreinoDto } from './dto/query-treino.dto';
import { UpdateTreinoDto } from './dto/update-treino.dto';
import { TreinosController } from './treinos.controller';
import { TreinosService } from './treinos.service';

const ID = '0199f0a2-7b3c-7d4e-8f00-123456789abc';
const MEMBRO_ID = '0199f0a2-7b3c-7d4e-8f00-123456789def';

// Rotas, pipes, HttpCode e o 400 de id inválido ficam no treinos.http.spec.ts.
describe('TreinosController', () => {
  let service: {
    findAll: jest.Mock;
    create: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };
  let controller: TreinosController;

  beforeEach(() => {
    service = {
      findAll: jest.fn(),
      create: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };
    controller = new TreinosController(service as unknown as TreinosService);
  });

  it('findAll delega a query ao service', async () => {
    const query = {
      page: 1,
      pageSize: 20,
      membroId: MEMBRO_ID,
    } as QueryTreinoDto;
    const pagina = { data: [], total: 0, page: 1, pageSize: 20 };
    service.findAll.mockResolvedValue(pagina);

    await expect(controller.findAll(query)).resolves.toBe(pagina);
    expect(service.findAll).toHaveBeenCalledWith(query);
  });

  it('create delega o dto ao service', async () => {
    const dto: CreateTreinoDto = {
      membroId: MEMBRO_ID,
      tipo: 'Cardio',
      descricao: 'Corrida leve',
      duracao: 30,
      dataInicio: new Date('2026-11-11T00:00:00.000Z'),
    };
    const criado = { id: ID };
    service.create.mockResolvedValue(criado);

    await expect(controller.create(dto)).resolves.toBe(criado);
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('findOne delega o id ao service', async () => {
    const treino = { id: ID };
    service.findOne.mockResolvedValue(treino);

    await expect(controller.findOne(ID)).resolves.toBe(treino);
    expect(service.findOne).toHaveBeenCalledWith(ID);
  });

  it('update delega o id e o dto ao service', async () => {
    const dto: UpdateTreinoDto = { duracao: 50 };
    const editado = { id: ID };
    service.update.mockResolvedValue(editado);

    await expect(controller.update(ID, dto)).resolves.toBe(editado);
    expect(service.update).toHaveBeenCalledWith(ID, dto);
  });

  it('remove delega o id ao service', async () => {
    service.remove.mockResolvedValue(undefined);

    await expect(controller.remove(ID)).resolves.toBeUndefined();
    expect(service.remove).toHaveBeenCalledWith(ID);
  });
});
