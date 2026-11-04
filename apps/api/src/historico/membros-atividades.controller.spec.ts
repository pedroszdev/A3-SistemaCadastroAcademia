import { QueryAtividadeMembroDto } from './dto/query-atividade.dto';
import { HistoricoService } from './historico.service';
import { MembrosAtividadesController } from './membros-atividades.controller';

const ID = '0199f0a2-7b3c-7d4e-8f00-123456789abc';

// Rotas, pipes e o 400 de id inválido ficam no historico.http.spec.ts.
describe('MembrosAtividadesController', () => {
  let service: { findAllDoMembro: jest.Mock };
  let controller: MembrosAtividadesController;

  beforeEach(() => {
    service = { findAllDoMembro: jest.fn() };
    controller = new MembrosAtividadesController(
      service as unknown as HistoricoService,
    );
  });

  it('findAll delega o id e a query ao service', async () => {
    const query = { page: 1, pageSize: 20 } as QueryAtividadeMembroDto;
    const pagina = { data: [], total: 0, page: 1, pageSize: 20 };
    service.findAllDoMembro.mockResolvedValue(pagina);

    await expect(controller.findAll(ID, query)).resolves.toBe(pagina);
    expect(service.findAllDoMembro).toHaveBeenCalledWith(ID, query);
  });
});
