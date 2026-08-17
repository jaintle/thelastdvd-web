import type { APIContext } from 'astro';
import { siteConfig } from '../config/site';

export async function GET(_context: APIContext): Promise<Response> {
  const body = [
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${siteConfig.url}/sitemap-index.xml`,
    '',
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
