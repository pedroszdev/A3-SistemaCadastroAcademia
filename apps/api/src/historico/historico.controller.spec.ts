import { Cargo } from '../generated/prisma/enums';
import type { UsuarioAutenticado } from '../auth/usuario-autenticado';
import { CreateAtividadeDto } from './dto/create-atividade.dto';
import { QueryAtividadeDto } from './dto/query-atividade.dto';
import { HistoricoController } from './historico.controller';
import { HistoricoService } from './historico.service';

const ID = '0199f0a2-7b3c-7d4e-8f00-123456789abc';
const MEMBRO_ID = '0199f0a2-7b3c-7d4e-8f00-123456789def';
const FUNCIONARIO_ID = '0199f0a2-7b3c-7d4e-8f00-123456789a01';

describe('HistoricoController', () => {
  let service: {
    findAll: jest.Mock;
    registrar: jest.Mock;
    findOne: jest.Mock;
  };
  let controller: HistoricoController;

  beforeEach(() => {
    service = {
      findAll: jest.fn(),
      registrar: jest.fn(),
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

  it('registrar delega o dto e o id do usuário logado ao service (RN11)', async () => {
    const dto: CreateAtividadeDto = {
      membroId: MEMBRO_ID,
      atividade: 'Supino reto',
      data: new Date('2026-10-15T00:00:00.000Z'),
      tempoExecucao: 45,
    };
    const usuario: UsuarioAutenticado = {
      id: FUNCIONARIO_ID,
      tipo: 'FUNCIONARIO',
      cargo: Cargo.INSTRUTOR,
    };
    const criada = { id: ID };
    service.registrar.mockResolvedValue(criada);

    await expect(controller.registrar(dto, usuario)).resolves.toBe(criada);
    expect(service.registrar).toHaveBeenCalledWith(dto, FUNCIONARIO_ID);
  });

  it('findOne delega só o id ao service', async () => {
    const atividade = { id: ID };
    service.findOne.mockResolvedValue(atividade);

    await expect(controller.findOne(ID)).resolves.toBe(atividade);
    expect(service.findOne).toHaveBeenCalledWith(ID);
  });
});
