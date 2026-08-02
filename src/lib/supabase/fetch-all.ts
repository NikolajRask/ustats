/**
 * PostgREST silently caps each response (default 1000 rows), even when
 * `.limit(50_000)` is set. Paginate with `.range()` until exhausted.
 */
const DEFAULT_PAGE_SIZE = 1000;
const DEFAULT_MAX_ROWS = 50_000;

export async function fetchAllRows<T>(
  buildPage: (
    from: number,
    to: number,
  ) => PromiseLike<{ data: T[] | null; error: unknown }>,
  options?: { pageSize?: number; maxRows?: number },
): Promise<T[]> {
  const pageSize = options?.pageSize ?? DEFAULT_PAGE_SIZE;
  const maxRows = options?.maxRows ?? DEFAULT_MAX_ROWS;
  const rows: T[] = [];
  let from = 0;

  while (from < maxRows) {
    const to = Math.min(from + pageSize - 1, maxRows - 1);
    const { data, error } = await buildPage(from, to);
    if (error) throw error;
    const page = data ?? [];
    rows.push(...page);
    if (page.length < pageSize) break;
    from += pageSize;
  }

  return rows;
}
