/**
 * PublishPress Authors does not expose the uploaded profile image via the REST
 * taxonomy endpoint, so we scrape each author's public archive page at build
 * time and cache the result to disk.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

// Bump when the extraction logic changes so old caches are ignored.
const CACHE_VERSION = 4;
const CACHE_FILE = resolve(process.cwd(), `.cache/wp/ppma-profiles.v${CACHE_VERSION}.json`);

export interface PPMAProfile {
  slug: string;
  avatar: string | null;
  bio: string;
  bioHtml: string;
}

type Cache = Record<string, PPMAProfile>;

let memory: Cache | null = null;
const inflight = new Map<string, Promise<PPMAProfile>>();

async function loadCache(): Promise<Cache> {
  if (memory) return memory;
  if (!existsSync(CACHE_FILE)) return (memory = {});
  try {
    memory = JSON.parse(await readFile(CACHE_FILE, 'utf8')) as Cache;
  } catch {
    memory = {};
  }
  return memory;
}

async function saveCache(cache: Cache): Promise<void> {
  try {
    await mkdir(dirname(CACHE_FILE), { recursive: true });
    await writeFile(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf8');
  } catch {
    // best effort
  }
}

function wpBase(): string {
  const raw = (import.meta.env.WORDPRESS_BASE_URL as string | undefined) ?? '';
  return raw.replace(/\/+$/, '');
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&#039;/g, "'")
    .replace(/&#8217;/g, '’')
    .replace(/&#8216;/g, '‘')
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function isBrandingImage(src: string): boolean {
  const s = src.toLowerCase();
  return (
    /\b(logo|favicon|cropped-tld|cropped-|apple-touch-icon|site-icon|masthead)\b/.test(s) ||
    /\/wp-content\/plugins\//.test(s) ||
    /\/wp-content\/themes\//.test(s)
  );
}

/**
 * Given a `<img …>` opening tag, return src="…" if present.
 */
function imgSrc(tag: string): string | null {
  const m = tag.match(/\bsrc\s*=\s*"([^"]+)"/i) ?? tag.match(/\bsrc\s*=\s*'([^']+)'/i);
  return m?.[1] ?? null;
}
function imgClass(tag: string): string {
  return (tag.match(/\bclass\s*=\s*"([^"]+)"/i)?.[1] ?? '').toLowerCase();
}

function extractAvatar(html: string): string | null {
  // Cut off at the article listing so we never pick up an article's featured
  // image. WordPress marks the featured image with class="wp-post-image" or
  // "attachment-…"; the post loop uses <article>, entry-title, or a "post-N"
  // wrapper. Slice at the first of these.
  const cut =
    /<article\b|class="[^"]*(?:entry-title|entry-content|wp-post-image|attachment-post-thumbnail|post-\d+)/i.exec(
      html,
    );
  const before = cut ? html.slice(0, cut.index) : html;

  // First pass: any img with class "avatar" / "photo" / PP-specific wins.
  const imgTags = before.match(/<img\b[^>]*>/gi) ?? [];
  for (const tag of imgTags) {
    const src = imgSrc(tag);
    if (!src || isBrandingImage(src)) continue;
    if (/\bavatar\b|\bphoto\b|pp-multiple-authors-boxes-avatar/i.test(imgClass(tag))) {
      return decodeHtmlEntities(src);
    }
  }
  // Second pass: first non-branding /wp-content/uploads/ image.
  for (const tag of imgTags) {
    const src = imgSrc(tag);
    if (!src || isBrandingImage(src)) continue;
    if (/\/wp-content\/uploads\//i.test(src)) return decodeHtmlEntities(src);
  }
  return null;
}

function extractBio(html: string): { bio: string; bioHtml: string } {
  const pp =
    html.match(
      /<p[^>]*class="[^"]*pp-multiple-authors-boxes-description[^"]*"[^>]*>([\s\S]*?)<\/p>/i,
    ) ??
    html.match(
      /<div[^>]*class="[^"]*pp-multiple-authors-boxes-description[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    );
  if (pp?.[1]) {
    const bioHtml = decodeHtmlEntities(pp[1]).trim();
    const bio = stripTags(bioHtml);
    if (bio) return { bio, bioHtml };
  }
  const meta = html.match(/<meta[^>]+name="description"[^>]+content="([^"]+)"/i);
  if (meta?.[1]) {
    const bio = decodeHtmlEntities(meta[1]).trim();
    return { bio, bioHtml: bio };
  }
  return { bio: '', bioHtml: '' };
}

async function fetchProfile(slug: string): Promise<PPMAProfile> {
  const url = `${wpBase()}/author/${slug}/`;
  try {
    const res = await fetch(url, {
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'User-Agent': 'thelastdvd-astro-build/1.0 (+https://thelastdvd.com)',
      },
    });
    if (!res.ok) throw new Error(`${res.status}`);
    const html = await res.text();
    const { bio, bioHtml } = extractBio(html);
    return { slug, avatar: extractAvatar(html), bio, bioHtml };
  } catch {
    return { slug, avatar: null, bio: '', bioHtml: '' };
  }
}

export async function getPPMAProfile(slug: string): Promise<PPMAProfile> {
  const cache = await loadCache();
  if (cache[slug]) return cache[slug];

  let p = inflight.get(slug);
  if (!p) {
    p = fetchProfile(slug).then(async (profile) => {
      const c = await loadCache();
      c[slug] = profile;
      memory = c;
      await saveCache(c);
      return profile;
    });
    inflight.set(slug, p);
  }
  return p;
}
