import { MembrosSituacaoController } from './membros-situacao.controller';
import { PagamentosService } from './pagamentos.service';

const ID = '0199f0a2-7b3c-7d4e-8f00-123456789abc';

describe('MembrosSituacaoController', () => {
  let service: { situacaoMembro: jest.Mock };
  let controller: MembrosSituacaoController;

  beforeEach(() => {
    service = { situacaoMembro: jest.fn() };
    controller = new MembrosSituacaoController(
      service as unknown as PagamentosService,
    );
  });

  it('situacao delega o id ao service', async () => {
    const situacao = {
      situacao: 'INADIMPLENTE',
      pagamentosAtrasados: 2,
      maiorAtrasoDias: 15,
    };
    service.situacaoMembro.mockResolvedValue(situacao);

    await expect(controller.situacao(ID)).resolves.toBe(situacao);
    expect(service.situacaoMembro).toHaveBeenCalledWith(ID);
  });
});
