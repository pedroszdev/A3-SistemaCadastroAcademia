import { QueryTreinoMembroDto } from './dto/query-treino.dto';
import { MembrosTreinosController } from './membros-treinos.controller';
import { TreinosService } from './treinos.service';

const ID = '0199f0a2-7b3c-7d4e-8f00-123456789abc';

// Rotas, pipes e o 400 de id inválido ficam no treinos.http.spec.ts.
describe('MembrosTreinosController', () => {
  let service: { findAllDoMembro: jest.Mock };
  let controller: MembrosTreinosController;

  beforeEach(() => {
    service = { findAllDoMembro: jest.fn() };
    controller = new MembrosTreinosController(
      service as unknown as TreinosService,
    );
  });

  it('findAll delega o id e a query ao service', async () => {
    const query = { page: 1, pageSize: 20 } as QueryTreinoMembroDto;
    const pagina = { data: [], total: 0, page: 1, pageSize: 20 };
    service.findAllDoMembro.mockResolvedValue(pagina);

    await expect(controller.findAll(ID, query)).resolves.toBe(pagina);
    expect(service.findAllDoMembro).toHaveBeenCalledWith(ID, query);
  });
});
