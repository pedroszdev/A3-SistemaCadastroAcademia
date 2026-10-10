import { AppController } from './app.controller';
import { PrismaService } from './prisma/prisma.service';

describe('AppController', () => {
  let prisma: { $queryRaw: jest.Mock };
  let controller: AppController;

  beforeEach(() => {
    prisma = { $queryRaw: jest.fn() };
    controller = new AppController(prisma as unknown as PrismaService);
  });

  it('retorna ok quando o banco responde', async () => {
    prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

    await expect(controller.health()).resolves.toEqual({ status: 'ok' });
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
  });

  it('propaga o erro quando o banco está fora do ar', async () => {
    prisma.$queryRaw.mockRejectedValue(new Error('conexão recusada'));

    await expect(controller.health()).rejects.toThrow('conexão recusada');
  });
});
