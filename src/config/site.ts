// Stable, non-editorial site configuration.
// Editorial content lives in WordPress; only publication-level constants belong here.

const rawSiteUrl =
  (import.meta.env.PUBLIC_SITE_URL as string | undefined) ?? 'https://thelastdvd.com';

// Strip trailing slash for consistent concatenation.
const siteUrl = rawSiteUrl.replace(/\/+$/, '');

export interface NavItem {
  label: string;
  href: string;
}

export interface Socials {
  x: string;
  instagram: string;
  letterboxd: string;
}

export const siteConfig = {
  name: 'The Last DVD',
  url: siteUrl,
  description:
    'The Last DVD is an independent magazine on cinema and adjacent arts — music, dance, theatre, culture — based in India, publishing internationally.',
  email: 'editor@thelastdvd.com',
  beehiivEmbedUrl:
    (import.meta.env.PUBLIC_BEEHIIV_EMBED_URL as string | undefined) ?? '',
  nav: [
    { label: 'About us', href: '/about-us/' },
    { label: 'Contact', href: '/contact-us/' },
    { label: 'All Issues', href: '/all-issues/' },
    { label: 'Write for Us', href: '/submission-guidelines/' },
    { label: 'Subscribe', href: '/subscribe/' },
  ] as NavItem[],
  socials: {
    // Verified from the WordPress Yoast schema graph (sameAs).
    x: 'https://x.com/thelastdvd',
    instagram: 'https://www.instagram.com/last_dvd/',
    letterboxd: 'https://letterboxd.com/thelastdvd/',
  } as Socials,
} as const;

export type SiteConfig = typeof siteConfig;

export function canonicalFor(pathname: string): string {
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const withSlash = path.endsWith('/') ? path : `${path}/`;
  return `${siteConfig.url}${withSlash}`;
}
