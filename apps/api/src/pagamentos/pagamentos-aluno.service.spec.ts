import { Prisma } from '../generated/prisma/client';
import { StatusPagamento } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { PagamentosService } from './pagamentos.service';

const ID = '0199f0a2-7b3c-7d4e-8f00-123456789abc';
const MEMBRO_ID = '0199f0a2-7b3c-7d4e-8f00-123456789def';

// Tela de pagamentos do aluno: situação, próxima cobrança e plano (RN09, RN18).
describe('PagamentosService.resumoDoAluno', () => {
  let prisma: {
    pagamento: { aggregate: jest.Mock; findFirst: jest.Mock };
    membro: { findUnique: jest.Mock };
  };
  let service: PagamentosService;

  beforeEach(() => {
    // hoje = 2026-11-24 em São Paulo
    jest.useFakeTimers().setSystemTime(new Date('2026-11-24T15:00:00Z'));
    prisma = {
      pagamento: { aggregate: jest.fn(), findFirst: jest.fn() },
      membro: { findUnique: jest.fn() },
    };
    service = new PagamentosService(prisma as unknown as PrismaService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('junta a situação, a próxima cobrança em aberto e o plano', async () => {
    prisma.membro.findUnique
      .mockResolvedValueOnce({ id: MEMBRO_ID })
      .mockResolvedValueOnce({
        valorMensalidade: new Prisma.Decimal('120.00'),
        diaVencimento: 10,
      });
    prisma.pagamento.aggregate.mockResolvedValue({
      _count: { _all: 0 },
      _min: { dataVencimento: null },
    });
    prisma.pagamento.findFirst.mockResolvedValue({
      id: ID,
      membroId: MEMBRO_ID,
      valor: new Prisma.Decimal('120.00'),
      dataVencimento: new Date('2026-12-10'),
      dataPagamento: null,
      status: StatusPagamento.PENDENTE,
      membro: { id: MEMBRO_ID, nome: 'Ana Souza' },
    });

    await expect(service.resumoDoAluno(MEMBRO_ID)).resolves.toEqual({
      situacao: 'EM_DIA',
      pagamentosAtrasados: 0,
      maiorAtrasoDias: 0,
      proximoPagamento: expect.objectContaining({
        id: ID,
        valor: 120,
        status: 'PENDENTE',
      }) as unknown,
      valorMensalidade: 120,
      diaVencimento: 10,
    });
    const [[consulta]] = prisma.pagamento.findFirst.mock.calls as [
      [{ where: Record<string, unknown> }],
    ];
    expect(consulta.where).toMatchObject({
      membroId: MEMBRO_ID,
      dataPagamento: null,
    });
  });

  it('sem cobrança em aberto nem plano, devolve nulos', async () => {
    prisma.membro.findUnique
      .mockResolvedValueOnce({ id: MEMBRO_ID })
      .mockResolvedValueOnce({ valorMensalidade: null, diaVencimento: null });
    prisma.pagamento.aggregate.mockResolvedValue({
      _count: { _all: 1 },
      _min: { dataVencimento: new Date('2026-11-01') },
    });
    prisma.pagamento.findFirst.mockResolvedValue(null);

    await expect(service.resumoDoAluno(MEMBRO_ID)).resolves.toEqual({
      situacao: 'INADIMPLENTE',
      pagamentosAtrasados: 1,
      maiorAtrasoDias: 23,
      proximoPagamento: null,
      valorMensalidade: null,
      diaVencimento: null,
    });
  });
});
