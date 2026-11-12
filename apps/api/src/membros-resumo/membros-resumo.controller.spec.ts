import type { UsuarioAutenticado } from '../auth/usuario-autenticado';
import { Cargo } from '../generated/prisma/enums';
import { MembrosResumoController } from './membros-resumo.controller';
import { MembrosResumoService } from './membros-resumo.service';

const ID = '0199f0a2-7b3c-7d4e-8f00-123456789abc';
const FUNCIONARIO_ID = '0199f0a2-7b3c-7d4e-8f00-123456789a01';

// Rotas, pipes e o 400 de id inválido ficam no membros-resumo.http.spec.ts.
describe('MembrosResumoController', () => {
  let service: { resumo: jest.Mock };
  let controller: MembrosResumoController;

  beforeEach(() => {
    service = { resumo: jest.fn() };
    controller = new MembrosResumoController(
      service as unknown as MembrosResumoService,
    );
  });

  it('findOne delega o id e o cargo do usuário ao service', async () => {
    const usuario: UsuarioAutenticado = {
      id: FUNCIONARIO_ID,
      tipo: 'FUNCIONARIO',
      cargo: Cargo.RECEPCIONISTA,
    };
    const resumo = { membro: { id: ID } };
    service.resumo.mockResolvedValue(resumo);

    await expect(controller.findOne(ID, usuario)).resolves.toBe(resumo);
    expect(service.resumo).toHaveBeenCalledWith(ID, Cargo.RECEPCIONISTA);
  });

  it('não repassa cargo para quem não é funcionário', async () => {
    await controller.findOne(ID, { id: FUNCIONARIO_ID, tipo: 'ALUNO' });

    expect(service.resumo).toHaveBeenCalledWith(ID, undefined);
  });
});
