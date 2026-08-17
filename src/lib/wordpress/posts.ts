import { apiUrl, fetchWp } from './client';
import { fetchAll } from './pagination';
import type { Article, WPMedia, WPPost, WPTerm } from './types';
import { toArticle } from './transforms';
import { getAllCategories, getAllTags } from './taxonomies';
import { getUserById } from './authors';
import { getPPMAProfile } from './ppma-profiles';

async function getMedia(id: number): Promise<WPMedia | null> {
  if (!id) return null;
  try {
    const res = await fetchWp<WPMedia>(apiUrl(`/media/${id}`));
    return res.body;
  } catch {
    return null;
  }
}

async function hydrate(post: WPPost, terms: { categories: WPTerm[]; tags: WPTerm[] }): Promise<Article> {
  // Prefer embedded data when present (avoids extra requests and works when
  // /wp-json/wp/v2/users is locked down against enumeration).
  const embeddedMedia = post._embedded?.['wp:featuredmedia']?.[0] ?? null;
  const embeddedAuthor = post._embedded?.author?.[0] ?? null;

  // PublishPress Authors appear as ppma_author taxonomy terms inside _embedded['wp:term'].
  const embeddedTermGroups = post._embedded?.['wp:term'] ?? [];
  const ppmaAuthorTerm = embeddedTermGroups
    .flat()
    .find((t) => t && (t.taxonomy === 'author' || t.taxonomy === 'ppma_author')) ?? null;
  const ppmaAuthor = ppmaAuthorTerm
    ? {
        id: ppmaAuthorTerm.id,
        name: ppmaAuthorTerm.name,
        slug: ppmaAuthorTerm.slug,
        description: ppmaAuthorTerm.description,
      }
    : null;

  const [media, author, ppmaProfile] = await Promise.all([
    embeddedMedia ? Promise.resolve(embeddedMedia) : getMedia(post.featured_media),
    embeddedAuthor ? Promise.resolve(embeddedAuthor) : getUserById(post.author),
    ppmaAuthor ? getPPMAProfile(ppmaAuthor.slug) : Promise.resolve(null),
  ]);
  return toArticle(post, {
    media,
    author,
    ppmaAuthor,
    ppmaAvatar: ppmaProfile?.avatar ?? null,
    ppmaBio: ppmaProfile?.bio ?? '',
    ppmaBioHtml: ppmaProfile?.bioHtml ?? '',
    categories: terms.categories,
    tags: terms.tags,
  });
}

let allPostsCache: Article[] | null = null;

export async function getAllPosts(): Promise<Article[]> {
  if (allPostsCache) return allPostsCache;

  const [posts, categories, tags] = await Promise.all([
    fetchAll<WPPost>('/posts', { status: 'publish', orderby: 'date', order: 'desc', _embed: 1 }),
    getAllCategories(),
    getAllTags(),
  ]);

  const hydrated = await Promise.all(posts.map((p) => hydrate(p, { categories, tags })));
  // Ensure newest first regardless of API ordering.
  hydrated.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  allPostsCache = hydrated;
  return hydrated;
}

export async function getPostBySlug(slug: string): Promise<Article | null> {
  const posts = await getAllPosts();
  return posts.find((p) => p.slug === slug) ?? null;
}

export async function getPostsByCategoryId(id: number): Promise<Article[]> {
  const posts = await getAllPosts();
  return posts.filter((p) => p.categories.some((c) => c.id === id));
}

export async function getPostsByTagId(id: number): Promise<Article[]> {
  const posts = await getAllPosts();
  return posts.filter((p) => p.tags.some((t) => t.id === id));
}

export async function getPostsByAuthorSlug(slug: string): Promise<Article[]> {
  const posts = await getAllPosts();
  return posts.filter((p) => p.authorSlug === slug);
}

/** Force-reset the module cache. Useful in tests; not called during builds. */
export function _resetCache(): void {
  allPostsCache = null;
}

/** Fetch a single user by id — helper kept for author archive route. */
export { getUserById } from './authors';
export { getUserBySlug } from './authors';
