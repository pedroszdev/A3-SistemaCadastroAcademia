import { QueryAtividadeDto } from './dto/query-atividade.dto';
import { HistoricoController } from './historico.controller';
import { HistoricoService } from './historico.service';

const ID = '0199f0a2-7b3c-7d4e-8f00-123456789abc';
const MEMBRO_ID = '0199f0a2-7b3c-7d4e-8f00-123456789def';

describe('HistoricoController', () => {
  let service: {
    findAll: jest.Mock;
    findOne: jest.Mock;
  };
  let controller: HistoricoController;

  beforeEach(() => {
    service = {
      findAll: jest.fn(),
      findOne: jest.fn(),
    };
    controller = new HistoricoController(
      service as unknown as HistoricoService,
    );
  });

  it('findAll delega a query ao service', async () => {
    const query = {
      page: 1,
      pageSize: 20,
      membroId: MEMBRO_ID,
    } as QueryAtividadeDto;
    const pagina = { data: [], total: 0, page: 1, pageSize: 20 };
    service.findAll.mockResolvedValue(pagina);

    await expect(controller.findAll(query)).resolves.toBe(pagina);
    expect(service.findAll).toHaveBeenCalledWith(query);
  });

  it('findOne delega só o id ao service', async () => {
    const atividade = { id: ID };
    service.findOne.mockResolvedValue(atividade);

    await expect(controller.findOne(ID)).resolves.toBe(atividade);
    expect(service.findOne).toHaveBeenCalledWith(ID);
  });
});
