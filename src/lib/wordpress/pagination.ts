import { apiUrl, fetchWp } from './client';

/**
 * Fetch every page of a collection endpoint, reading X-WP-TotalPages from page 1
 * and then fanning out the remaining pages with a small concurrency cap.
 */
export async function fetchAll<T>(
  path: string,
  params: Record<string, string | number | boolean> = {},
  perPage = 100,
  concurrency = 4,
): Promise<T[]> {
  const first = await fetchWp<T[]>(apiUrl(path, { ...params, per_page: perPage, page: 1 }));
  const out: T[] = [...first.body];
  const totalPages = Math.max(1, first.totalPages);
  if (totalPages <= 1) return out;

  const remaining = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
  let cursor = 0;

  async function worker(): Promise<void> {
    while (cursor < remaining.length) {
      const page = remaining[cursor++]!;
      const res = await fetchWp<T[]>(apiUrl(path, { ...params, per_page: perPage, page }));
      out.push(...res.body);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, remaining.length) }, () => worker());
  await Promise.all(workers);
  return out;
}
