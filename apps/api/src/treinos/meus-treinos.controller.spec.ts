import type { UsuarioAutenticado } from '../auth/usuario-autenticado';
import { QueryTreinoMembroDto } from './dto/query-treino.dto';
import { MeusTreinosController } from './meus-treinos.controller';
import { TreinosService } from './treinos.service';

const ID = '0199f0a2-7b3c-7d4e-8f00-123456789abc';
const ALUNO_ID = '0199f0a2-7b3c-7d4e-8f00-123456789def';

const ALUNO: UsuarioAutenticado = { id: ALUNO_ID, tipo: 'ALUNO' };

// Rotas, pipes, whitelist e o 400 de id inválido ficam no meus-treinos.http.spec.ts.
describe('MeusTreinosController', () => {
  let service: { findDoMembro: jest.Mock; findOneDoMembro: jest.Mock };
  let controller: MeusTreinosController;

  beforeEach(() => {
    service = { findDoMembro: jest.fn(), findOneDoMembro: jest.fn() };
    controller = new MeusTreinosController(
      service as unknown as TreinosService,
    );
  });

  it('findAll delega o id do token e a query ao service', async () => {
    const query = { page: 1, pageSize: 20 } as QueryTreinoMembroDto;
    const pagina = { data: [], total: 0, page: 1, pageSize: 20 };
    service.findDoMembro.mockResolvedValue(pagina);

    await expect(controller.findAll(ALUNO, query)).resolves.toBe(pagina);
    expect(service.findDoMembro).toHaveBeenCalledWith(ALUNO_ID, query);
  });

  it('findOne delega o id do token e o id do treino ao service', async () => {
    const treino = { id: ID };
    service.findOneDoMembro.mockResolvedValue(treino);

    await expect(controller.findOne(ALUNO, ID)).resolves.toBe(treino);
    expect(service.findOneDoMembro).toHaveBeenCalledWith(ALUNO_ID, ID);
  });
});
