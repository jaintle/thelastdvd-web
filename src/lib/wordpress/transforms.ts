import { canonicalFor, siteConfig } from '../../config/site';
import { decodeEntities, normaliseEmailDomain, rewriteInternalLinks, safeExcerpt, sanitizeBio, stripHtml } from '../html';
import type { Article, WPMedia, WPPost, WPTerm, WPUser } from './types';

const WP_ORIGIN = (import.meta.env.WORDPRESS_BASE_URL as string | undefined)?.replace(/\/+$/, '') ?? '';
const REWRITE_ORIGINS = Array.from(
  new Set([WP_ORIGIN, siteConfig.url, 'https://thelastdvd.com'].filter(Boolean)),
);
function hostOf(u: string): string {
  try { return new URL(u).host; } catch { return ''; }
}
const CMS_HOST = hostOf(WP_ORIGIN);
const PUBLIC_HOST = hostOf(siteConfig.url) || 'thelastdvd.com';

interface HydrateInput {
  media: WPMedia | null;
  author: WPUser | null;
  ppmaAuthor: { id: number; name: string; slug: string; description?: string } | null;
  ppmaAvatar: string | null;
  ppmaBio: string;
  ppmaBioHtml: string;
  categories: WPTerm[];
  tags: WPTerm[];
}

/** Deterministic gravatar-style URL derived from the author name.
 * Not a real gravatar (we don't have email); this returns null so callers can
 * fall back to an initials bubble.
 */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0] ?? '').join('').toUpperCase();
}

function pickTerms(all: WPTerm[], ids: number[]): Array<{ id: number; slug: string; name: string }> {
  return ids
    .map((id) => all.find((t) => t.id === id))
    .filter((t): t is WPTerm => Boolean(t))
    .map((t) => ({ id: t.id, slug: t.slug, name: decodeEntities(t.name) }));
}

export function toArticle(post: WPPost, ctx: HydrateInput): Article {
  const titleHtml = post.title.rendered;
  const title = decodeEntities(titleHtml).replace(/\s+/g, ' ').trim();
  const excerptHtml = post.excerpt?.rendered ?? '';
  const excerptText = safeExcerpt(excerptHtml || post.content.rendered, 240);

  const media = ctx.media;
  const featured = media
    ? {
        url: media.source_url,
        alt: media.alt_text || '',
        caption: stripHtml(media.caption?.rendered ?? ''),
        width: media.media_details?.width ?? null,
        height: media.media_details?.height ?? null,
      }
    : null;

  // Prefer PublishPress author term (matches editorial byline) over the WP user record.
  const ppma = ctx.ppmaAuthor;
  const author = ctx.author;
  const authorName = ppma?.name
    ? decodeEntities(ppma.name)
    : author?.name
      ? decodeEntities(author.name)
      : '';
  // Only link to /author/<slug>/ when we have a PublishPress author term (which
  // means we'll actually build that archive page). WP admin/editor accounts
  // without a ppma record don't get linked or generated as archives.
  const authorSlug = ppma?.slug ?? '';
  const authorBio =
    (ppma?.description && stripHtml(ppma.description)) ||
    ctx.ppmaBio ||
    (author?.description && stripHtml(author.description)) ||
    '';
  const authorBioHtml =
    sanitizeBio(ctx.ppmaBioHtml) ||
    (ppma?.description ? sanitizeBio(ppma.description) : '') ||
    (author?.description ? sanitizeBio(author.description) : '') ||
    authorBio;
  const avatarMap = author?.avatar_urls ?? undefined;
  const gravatar = avatarMap
    ? avatarMap['96'] || avatarMap['48'] || avatarMap['24'] || Object.values(avatarMap)[0] || null
    : null;
  // Prefer the PublishPress-uploaded avatar (scraped from the author archive
  // page) over gravatar, which is often blank for editorial guest authors.
  const authorAvatar = ctx.ppmaAvatar ?? gravatar;
  const authorInitials = authorName ? initials(authorName) : '';

  return {
    id: post.id,
    slug: post.slug,
    title,
    titleHtml,
    excerptHtml,
    excerptText,
    contentHtml: normaliseEmailDomain(
      rewriteInternalLinks(post.content.rendered, REWRITE_ORIGINS),
      CMS_HOST,
      PUBLIC_HOST,
    ),
    date: post.date,
    modified: post.modified,
    authorId: post.author,
    authorName,
    authorSlug,
    authorBio,
    authorBioHtml,
    authorAvatar,
    authorInitials,
    featured,
    categories: pickTerms(ctx.categories, post.categories ?? []),
    tags: pickTerms(ctx.tags, post.tags ?? []),
    canonicalUrl: canonicalFor(`/${post.slug}/`),
  };
}
