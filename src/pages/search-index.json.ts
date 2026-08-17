import type { APIRoute } from 'astro';
import { getAllPosts } from '../lib/wordpress/posts';
import { getAllPPMAAuthors } from '../lib/wordpress/taxonomies';
import { getPPMAProfile } from '../lib/wordpress/ppma-profiles';
import { decodeEntities, stripHtml } from '../lib/html';

interface SearchEntry {
  kind: 'article' | 'author';
  title: string;
  url: string;
  excerpt?: string;
  categories?: string[];
  tags?: string[];
  author?: string;
  date?: string;
}

export const GET: APIRoute = async () => {
  const [posts, authors] = await Promise.all([
    getAllPosts().catch(() => []),
    getAllPPMAAuthors().catch(() => []),
  ]);

  const entries: SearchEntry[] = [];

  for (const p of posts) {
    entries.push({
      kind: 'article',
      title: p.title,
      url: `/${p.slug}/`,
      excerpt: p.excerptText,
      categories: p.categories.map((c) => c.name),
      tags: p.tags.map((t) => t.name),
      author: p.authorName,
      date: p.date,
    });
  }

  // Only include authors that have a public archive page (i.e. attributed posts).
  const publishedAuthorSlugs = new Set(posts.map((p) => p.authorSlug).filter(Boolean));

  for (const a of authors) {
    if (!a.slug || !a.name || !publishedAuthorSlugs.has(a.slug)) continue;
    // Bio is best-effort; scraped cache is populated during posts fetch.
    const profile = await getPPMAProfile(a.slug).catch(() => null);
    entries.push({
      kind: 'author',
      title: decodeEntities(a.name),
      url: `/author/${a.slug}/`,
      excerpt: stripHtml(a.description ?? '') || profile?.bio || '',
    });
  }

  return new Response(JSON.stringify(entries), {
    headers: { 'Content-Type': 'application/json' },
  });
};
