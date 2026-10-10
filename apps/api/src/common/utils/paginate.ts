export interface Paginacao {
  page: number;
  pageSize: number;
}

export interface Paginado<T> extends Paginacao {
  data: T[];
  total: number;
}

export function paginacaoPrisma({ page, pageSize }: Paginacao) {
  return { skip: (page - 1) * pageSize, take: pageSize };
}

export function paginate<T>(
  data: T[],
  total: number,
  { page, pageSize }: Paginacao,
): Paginado<T> {
  return { data, total, page, pageSize };
}
