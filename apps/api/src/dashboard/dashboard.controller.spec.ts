import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

describe('DashboardController', () => {
  let service: { resumo: jest.Mock };
  let controller: DashboardController;

  beforeEach(() => {
    service = { resumo: jest.fn() };
    controller = new DashboardController(
      service as unknown as DashboardService,
    );
  });

  it('resumo delega ao service e devolve o resultado', async () => {
    const resumo = {
      membrosAtivos: 2,
      membrosInadimplentes: 1,
      pagamentosAtrasados: 2,
      receitaMes: 100,
      atividadesHoje: 1,
    };
    service.resumo.mockResolvedValue(resumo);

    await expect(controller.resumo()).resolves.toBe(resumo);
    expect(service.resumo).toHaveBeenCalledTimes(1);
  });
});
