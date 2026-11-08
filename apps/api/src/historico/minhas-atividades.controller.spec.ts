import type { UsuarioAutenticado } from '../auth/usuario-autenticado';
import {
  PeriodoAtividadeDto,
  QueryMinhasAtividadesDto,
} from './dto/query-atividade.dto';
import { HistoricoService } from './historico.service';
import { MinhasAtividadesController } from './minhas-atividades.controller';

const ID = '0199f0a2-7b3c-7d4e-8f00-123456789abc';
const ALUNO_ID = '0199f0a2-7b3c-7d4e-8f00-123456789def';

const ALUNO: UsuarioAutenticado = { id: ALUNO_ID, tipo: 'ALUNO' };

// Rotas, pipes, whitelist e o 400 de id inválido ficam no minhas-atividades.http.spec.ts.
describe('MinhasAtividadesController', () => {
  let service: {
    findAllDoAluno: jest.Mock;
    resumoMembro: jest.Mock;
    findOneDoAluno: jest.Mock;
  };
  let controller: MinhasAtividadesController;

  beforeEach(() => {
    service = {
      findAllDoAluno: jest.fn(),
      resumoMembro: jest.fn(),
      findOneDoAluno: jest.fn(),
    };
    controller = new MinhasAtividadesController(
      service as unknown as HistoricoService,
    );
  });

  it('findAll delega o id do token e a query ao service', async () => {
    const query = { page: 1, pageSize: 20 } as QueryMinhasAtividadesDto;
    const pagina = { data: [], total: 0, page: 1, pageSize: 20 };
    service.findAllDoAluno.mockResolvedValue(pagina);

    await expect(controller.findAll(ALUNO, query)).resolves.toBe(pagina);
    expect(service.findAllDoAluno).toHaveBeenCalledWith(ALUNO_ID, query);
  });

  it('resumo delega o id do token e o período ao resumoMembro', async () => {
    const periodo = {
      dataDe: new Date('2026-10-01'),
      dataAte: new Date('2026-10-31'),
    } as PeriodoAtividadeDto;
    const resumo = { totalAtividades: 3, totalMinutos: 135 };
    service.resumoMembro.mockResolvedValue(resumo);

    await expect(controller.resumo(ALUNO, periodo)).resolves.toBe(resumo);
    expect(service.resumoMembro).toHaveBeenCalledWith(
      ALUNO_ID,
      periodo.dataDe,
      periodo.dataAte,
    );
  });

  it('findOne delega o id da atividade e o id do token ao service', async () => {
    const atividade = { id: ID };
    service.findOneDoAluno.mockResolvedValue(atividade);

    await expect(controller.findOne(ALUNO, ID)).resolves.toBe(atividade);
    expect(service.findOneDoAluno).toHaveBeenCalledWith(ID, ALUNO_ID);
  });
});
