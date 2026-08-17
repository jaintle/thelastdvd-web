import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';

// Cache root — relative to the project root. Committed to `.gitignore`.
const CACHE_ROOT = resolve(process.cwd(), '.cache/wp');

function baseUrl(): string {
  const raw = import.meta.env.WORDPRESS_BASE_URL as string | undefined;
  if (!raw || typeof raw !== 'string' || !raw.startsWith('http')) {
    throw new Error(
      '[wp] WORDPRESS_BASE_URL is not configured. Set it in .env (e.g. https://cms.thelastdvd.com).',
    );
  }
  return raw.replace(/\/+$/, '');
}

/**
 * Build a REST API URL from a path (relative to /wp-json/wp/v2) and query params.
 * Uses URL + URLSearchParams for safe encoding.
 */
export function apiUrl(path: string, params: Record<string, string | number | boolean> = {}): URL {
  const cleaned = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${baseUrl()}/wp-json/wp/v2${cleaned}`);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, String(v));
  }
  return url;
}

function cacheKey(url: URL): string {
  // Stable, path-safe hash of the URL, excluding host so cached files travel between environments.
  const canonical = `${url.pathname}?${url.searchParams.toString()}`;
  const h = createHash('sha1').update(canonical).digest('hex').slice(0, 16);
  const safeName = url.pathname.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '');
  return join(CACHE_ROOT, `${safeName}_${h}.json`);
}

async function readCache<T>(key: string): Promise<T | null> {
  if (!existsSync(key)) return null;
  try {
    const raw = await readFile(key, 'utf8');
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function writeCache(key: string, body: unknown, headers?: Record<string, string>): Promise<void> {
  try {
    await mkdir(dirname(key), { recursive: true });
    await writeFile(key, JSON.stringify({ body, headers: headers ?? {} }, null, 2), 'utf8');
  } catch (err) {
    // Never fail a build because we couldn't write cache.
    // eslint-disable-next-line no-console
    console.warn('[wp] cache write failed', (err as Error).message);
  }
}

export interface FetchResult<T> {
  body: T;
  totalPages: number;
  total: number;
}

const useCacheOnly = Boolean(import.meta.env.TLD_USE_CACHE);

// Dedupe "live fetch failed, using cache" warnings across module reloads in dev.
const g = globalThis as unknown as { __tldWarned?: Set<string> };
const warned: Set<string> = (g.__tldWarned ??= new Set());

/**
 * Fetch JSON from the WP REST API with an on-disk fallback cache.
 * - Reads live if network is available and TLD_USE_CACHE is unset.
 * - Falls back to cached JSON when the request fails (offline builds).
 * - Persists successful responses to `.cache/wp/`.
 */
export async function fetchWp<T>(url: URL): Promise<FetchResult<T>> {
  const key = cacheKey(url);

  const readFromCache = async (): Promise<FetchResult<T> | null> => {
    const cached = await readCache<{ body: T; headers: Record<string, string> }>(key);
    if (!cached) return null;
    return {
      body: cached.body,
      totalPages: Number(cached.headers['x-wp-totalpages'] ?? '1') || 1,
      total: Number(cached.headers['x-wp-total'] ?? '0') || 0,
    };
  };

  if (useCacheOnly) {
    const cached = await readFromCache();
    if (cached) return cached;
    throw new Error(`[wp] TLD_USE_CACHE set but no cache for ${url.pathname}`);
  }

  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) {
      throw new Error(`[wp] ${res.status} ${res.statusText} for ${url.pathname}${url.search}`);
    }
    const totalPages = Number(res.headers.get('x-wp-totalpages') ?? '1') || 1;
    const total = Number(res.headers.get('x-wp-total') ?? '0') || 0;
    const body = (await res.json()) as T;
    await writeCache(key, body, {
      'x-wp-total': String(total),
      'x-wp-totalpages': String(totalPages),
    });
    return { body, totalPages, total };
  } catch (err) {
    const cached = await readFromCache();
    if (cached) {
      const wkey = `${url.pathname}?${url.searchParams.toString()}`;
      if (!warned.has(wkey)) {
        warned.add(wkey);
        // eslint-disable-next-line no-console
        console.warn(`[wp] live fetch failed, using cache: ${url.pathname} — ${(err as Error).message}`);
      }
      return cached;
    }
    throw err;
  }
}
