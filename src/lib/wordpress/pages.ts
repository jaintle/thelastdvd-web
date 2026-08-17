import { apiUrl, fetchWp } from './client';
import type { PageContent, WPPage } from './types';
import { decodeEntities, rewriteInternalLinks } from '../html';
import { siteConfig } from '../../config/site';

const WP_ORIGIN = (import.meta.env.WORDPRESS_BASE_URL as string | undefined)?.replace(/\/+$/, '') ?? '';
const PUBLIC_ORIGIN = siteConfig.url;
const REWRITE_ORIGINS = Array.from(new Set([WP_ORIGIN, PUBLIC_ORIGIN, 'https://thelastdvd.com'].filter(Boolean)));

export async function getPageBySlug(slug: string): Promise<PageContent | null> {
  try {
    const res = await fetchWp<WPPage[]>(apiUrl('/pages', { slug, per_page: 1 }));
    const page = res.body[0];
    if (!page) return null;
    return {
      id: page.id,
      slug: page.slug,
      title: decodeEntities(page.title.rendered),
      contentHtml: rewriteInternalLinks(page.content.rendered, REWRITE_ORIGINS),
    };
  } catch {
    return null;
  }
}
