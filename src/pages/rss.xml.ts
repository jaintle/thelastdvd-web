import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getAllPosts } from '../lib/wordpress/posts';
import { siteConfig } from '../config/site';

export async function GET(context: APIContext) {
  const posts = await getAllPosts().catch(() => []);
  return rss({
    title: siteConfig.name,
    description: siteConfig.description,
    site: context.site ?? siteConfig.url,
    items: posts.map((p) => ({
      title: p.title,
      link: p.canonicalUrl,
      pubDate: new Date(p.date),
      description: p.excerptText,
      ...(p.authorName ? { author: p.authorName } : {}),
    })),
  });
}
