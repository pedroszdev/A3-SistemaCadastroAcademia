import type { UsuarioAutenticado } from '../auth/usuario-autenticado';
import { QueryMeusPagamentosDto } from './dto/query-meus-pagamentos.dto';
import { MeusPagamentosController } from './meus-pagamentos.controller';
import { PagamentosService } from './pagamentos.service';

const ALUNO_ID = '0199f0a2-7b3c-7d4e-8f00-123456789def';
const ALUNO: UsuarioAutenticado = { id: ALUNO_ID, tipo: 'ALUNO' };

describe('MeusPagamentosController', () => {
  let service: { findAll: jest.Mock; resumoDoAluno: jest.Mock };
  let controller: MeusPagamentosController;

  beforeEach(() => {
    service = { findAll: jest.fn(), resumoDoAluno: jest.fn() };
    controller = new MeusPagamentosController(
      service as unknown as PagamentosService,
    );
  });

  it('findAll filtra pelo membro do token (RN16)', async () => {
    const query = {
      page: 1,
      pageSize: 20,
      status: 'PAGO',
    } as QueryMeusPagamentosDto;
    const pagina = { data: [], total: 0, page: 1, pageSize: 20 };
    service.findAll.mockResolvedValue(pagina);

    await expect(controller.findAll(ALUNO, query)).resolves.toBe(pagina);
    expect(service.findAll).toHaveBeenCalledWith({
      ...query,
      membroId: ALUNO_ID,
    });
  });

  it('resumo delega o id do token', async () => {
    const resumo = { situacao: 'EM_DIA' };
    service.resumoDoAluno.mockResolvedValue(resumo);

    await expect(controller.resumo(ALUNO)).resolves.toBe(resumo);
    expect(service.resumoDoAluno).toHaveBeenCalledWith(ALUNO_ID);
  });
});
