import { CreatePagamentoDto } from './dto/create-pagamento.dto';
import { QueryPagamentoDto } from './dto/query-pagamento.dto';
import { PagamentosController } from './pagamentos.controller';
import { PagamentosService } from './pagamentos.service';

const ID = '0199f0a2-7b3c-7d4e-8f00-123456789abc';

describe('PagamentosController', () => {
  let service: {
    findAll: jest.Mock;
    create: jest.Mock;
    findOne: jest.Mock;
  };
  let controller: PagamentosController;

  beforeEach(() => {
    service = {
      findAll: jest.fn(),
      create: jest.fn(),
      findOne: jest.fn(),
    };
    controller = new PagamentosController(
      service as unknown as PagamentosService,
    );
  });

  it('findAll delega a query ao service', async () => {
    const query = {
      page: 1,
      pageSize: 20,
      status: 'ATRASADO',
    } as QueryPagamentoDto;
    const pagina = { data: [], total: 0, page: 1, pageSize: 20 };
    service.findAll.mockResolvedValue(pagina);

    await expect(controller.findAll(query)).resolves.toBe(pagina);
    expect(service.findAll).toHaveBeenCalledWith(query);
  });

  it('create delega o dto ao service', async () => {
    const dto: CreatePagamentoDto = {
      membroId: ID,
      valor: 120.5,
      dataVencimento: new Date('2026-11-10T00:00:00.000Z'),
    };
    const criado = { id: ID };
    service.create.mockResolvedValue(criado);

    await expect(controller.create(dto)).resolves.toBe(criado);
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('findOne delega o id ao service', async () => {
    const pagamento = { id: ID };
    service.findOne.mockResolvedValue(pagamento);

    await expect(controller.findOne(ID)).resolves.toBe(pagamento);
    expect(service.findOne).toHaveBeenCalledWith(ID);
  });
});
