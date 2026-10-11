import he from 'he';

/** Decode HTML entities into plain text (for <title>, OG tags, etc). */
export function decodeEntities(input: string | undefined | null): string {
  if (!input) return '';
  return he.decode(input);
}

/** Remove HTML tags and collapse whitespace. Good enough for excerpts, not for security. */
export function stripHtml(input: string | undefined | null): string {
  if (!input) return '';
  return decodeEntities(
    input
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
  );
}

/**
 * Rewrite absolute links pointing at the WordPress origin to root-relative paths
 * so preview/dev environments stay on-site instead of jumping to production.
 * Only rewrites href/src of navigational pages, not media assets under /wp-content/.
 */
export function rewriteInternalLinks(html: string | undefined | null, origins: string[]): string {
  if (!html) return '';
  let out = html;
  for (const origin of origins) {
    const escaped = origin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // href="https://origin/path" → href="/path" — but skip /wp-content/, /wp-json/, /wp-admin/, files.
    const re = new RegExp(`href="${escaped}(/[^"#?]*?)([?#][^"]*)?"`, 'gi');
    out = out.replace(re, (m, path: string, qs?: string) => {
      if (/^\/(wp-content|wp-json|wp-admin|wp-includes)\b/i.test(path)) return m;
      if (/\.[a-z0-9]{2,5}$/i.test(path)) return m; // .pdf, .jpg, etc.
      return `href="${path}${qs ?? ''}"`;
    });
  }
  return out;
}

/**
 * WordPress can rewrite email domains during a hostname change (e.g.
 * `editor@thelastdvd.com` becomes `editor@cms.thelastdvd.com` after the DB
 * search-replace). Strip the CMS subdomain back out so bylines and body text
 * always show the editorial address.
 *
 * `cmsHost` = the WP hostname (e.g. `cms.thelastdvd.com`)
 * `publicHost` = the public hostname (e.g. `thelastdvd.com`)
 * Only rewrites when cmsHost is a subdomain of publicHost.
 */
export function normaliseEmailDomain(
  html: string | undefined | null,
  cmsHost: string,
  publicHost: string,
): string {
  if (!html) return '';
  if (!cmsHost || !publicHost || cmsHost === publicHost) return html;
  if (!cmsHost.endsWith(`.${publicHost}`)) return html;
  const escaped = cmsHost.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Match `@cms.thelastdvd.com` anywhere (mailto: link, visible text, meta).
  return html.replace(new RegExp(`@${escaped}\\b`, 'gi'), `@${publicHost}`);
}

/** Tag the Kadence masthead column containing Niveditha so CSS can place it first. */
export function promoteMastheadEditor(html: string | undefined | null): string {
  if (!html) return '';
  return html
    .split(/(?=<div class="wp-block-kadence-column\b)/)
    .map((chunk) =>
      /Niveditha K Prasad/.test(chunk)
        ? chunk.replace('<div class="wp-block-kadence-column', '<div class="wp-block-kadence-column masthead-first')
        : chunk,
    )
    .join('');
}

/**
 * Group WordPress "flat" editor cards on the About page.
 *   <figure><img></figure><h5>Name</h5><p>Bio</p>
 * becomes
 *   <div class="masthead-card"> … </div>
 * so we can lay them out as a proper grid.
 */
export function groupMastheadCards(html: string | undefined | null): string {
  if (!html) return '';
  // Wrap each <figure>+<h4-6>+<p> triplet as a card.
  let out = html.replace(
    /(<figure\b[^>]*>[\s\S]*?<\/figure>)\s*(<h[4-6]\b[^>]*>[\s\S]*?<\/h[4-6]>)\s*(<p\b[^>]*>[\s\S]*?<\/p>)/gi,
    '<div class="masthead-card">$1$2$3</div>',
  );
  // Group consecutive .masthead-card siblings into one .masthead-grid so only
  // the cards get grid-column layout — the rest of the page stays as prose.
  out = out.replace(
    /(?:<div class="masthead-card">[\s\S]*?<\/div>\s*){2,}/g,
    (block) => `<div class="masthead-grid">${block}</div>`,
  );
  return out;
}

/**
 * Restrict a bio HTML fragment to a tiny allowlist so we can safely render it
 * via set:html. Keeps anchor tags with http(s)/mailto hrefs, plus a few inline
 * formatting tags. Everything else is stripped.
 */
export function sanitizeBio(html: string | undefined | null): string {
  if (!html) return '';
  let out = html;
  // Drop <script> / <style> outright.
  out = out.replace(/<(script|style)[\s\S]*?<\/\1>/gi, '');
  // Allow only these tags; strip anything else while keeping inner text.
  const allow = /^(a|em|strong|b|i|br|span)$/i;
  out = out.replace(/<\/?([a-z0-9]+)([^>]*)>/gi, (m, tag: string, rest: string) => {
    if (!allow.test(tag)) return '';
    if (tag.toLowerCase() === 'a') {
      if (m.startsWith('</')) return '</a>';
      const href = rest.match(/\bhref\s*=\s*"([^"]+)"/i)?.[1] ?? rest.match(/\bhref\s*=\s*'([^']+)'/i)?.[1] ?? '';
      if (!/^(https?:|mailto:|\/)/i.test(href)) return '';
      const external = /^https?:/i.test(href);
      const attrs = external ? ` href="${href}" target="_blank" rel="noopener nofollow"` : ` href="${href}"`;
      return `<a${attrs}>`;
    }
    return m.startsWith('</') ? `</${tag.toLowerCase()}>` : `<${tag.toLowerCase()}>`;
  });
  return out;
}

export function safeExcerpt(html: string | undefined | null, maxLen = 240): string {
  const text = stripHtml(html);
  if (text.length <= maxLen) return text;
  const cut = text.slice(0, maxLen);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > 100 ? lastSpace : maxLen).trim()}…`;
}
