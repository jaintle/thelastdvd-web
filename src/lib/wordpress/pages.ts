import { apiUrl, fetchWp } from './client';
import type { PageContent, WPPage } from './types';
import { decodeEntities, normaliseEmailDomain, rewriteInternalLinks } from '../html';
import { siteConfig } from '../../config/site';

const WP_ORIGIN = (import.meta.env.WORDPRESS_BASE_URL as string | undefined)?.replace(/\/+$/, '') ?? '';
const PUBLIC_ORIGIN = siteConfig.url;
const REWRITE_ORIGINS = Array.from(new Set([WP_ORIGIN, PUBLIC_ORIGIN, 'https://thelastdvd.com'].filter(Boolean)));

function hostOf(u: string): string {
  try { return new URL(u).host; } catch { return ''; }
}
const CMS_HOST = hostOf(WP_ORIGIN);
const PUBLIC_HOST = hostOf(PUBLIC_ORIGIN) || 'thelastdvd.com';

export function transformWpContent(html: string): string {
  return normaliseEmailDomain(
    rewriteInternalLinks(html, REWRITE_ORIGINS),
    CMS_HOST,
    PUBLIC_HOST,
  );
}

export async function getPageBySlug(slug: string): Promise<PageContent | null> {
  try {
    const res = await fetchWp<WPPage[]>(apiUrl('/pages', { slug, per_page: 1 }));
    const page = res.body[0];
    if (!page) return null;
    return {
      id: page.id,
      slug: page.slug,
      title: decodeEntities(page.title.rendered),
      contentHtml: transformWpContent(page.content.rendered),
    };
  } catch {
    return null;
  }
}
