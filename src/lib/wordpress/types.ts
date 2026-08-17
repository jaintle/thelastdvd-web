// Minimal but accurate WordPress REST API types.
// Only the fields we actually consume are typed; unknown extras are permitted.

export interface WPRendered {
  rendered: string;
  protected?: boolean;
}

export interface WPPost {
  id: number;
  date: string;
  date_gmt: string;
  modified: string;
  modified_gmt: string;
  slug: string;
  status: string;
  type: string;
  link: string;
  title: WPRendered;
  content: WPRendered;
  excerpt: WPRendered;
  author: number;
  featured_media: number;
  categories: number[];
  tags: number[];
  _embedded?: {
    author?: WPUser[];
    'wp:featuredmedia'?: WPMedia[];
    'wp:term'?: WPTerm[][];
  };
}

export interface WPPage {
  id: number;
  date: string;
  modified: string;
  slug: string;
  status: string;
  type: string;
  link: string;
  title: WPRendered;
  content: WPRendered;
  excerpt?: WPRendered;
  parent?: number;
  menu_order?: number;
}

export interface WPTerm {
  id: number;
  count: number;
  description: string;
  link: string;
  name: string;
  slug: string;
  taxonomy: string;
  parent?: number;
}

export interface WPUser {
  id: number;
  name: string;
  url?: string;
  description: string;
  link: string;
  slug: string;
  avatar_urls?: Record<string, string>;
}

/**
 * PublishPress Authors term (taxonomy: author, rest_base: ppma_author).
 * Standard WP taxonomy fields; PublishPress-specific avatar/email meta is not
 * exposed via the REST endpoint, so avatars fall back to gravatar-by-name.
 */
export interface WPPPMAAuthor {
  id: number;
  count?: number;
  description: string;
  link: string;
  name: string;
  slug: string;
  taxonomy?: string;
}

export interface WPMedia {
  id: number;
  date: string;
  slug: string;
  type: string;
  link: string;
  title: WPRendered;
  author: number;
  caption?: WPRendered;
  alt_text: string;
  media_type: string;
  mime_type: string;
  media_details: {
    width?: number;
    height?: number;
    file?: string;
    sizes?: Record<string, { source_url: string; width: number; height: number }>;
  };
  source_url: string;
}

/** Normalized frontend Article shape used across templates. */
export interface Article {
  id: number;
  slug: string;
  title: string;
  titleHtml: string;
  excerptHtml: string;
  excerptText: string;
  contentHtml: string;
  date: string;
  modified: string;
  authorId: number;
  authorName: string;
  authorSlug: string;
  authorBio: string;
  authorBioHtml: string;
  authorAvatar: string | null;
  authorInitials: string;
  featured: {
    url: string;
    alt: string;
    caption: string;
    width: number | null;
    height: number | null;
  } | null;
  categories: Array<{ id: number; slug: string; name: string }>;
  tags: Array<{ id: number; slug: string; name: string }>;
  canonicalUrl: string;
}

export interface PageContent {
  id: number;
  slug: string;
  title: string;
  contentHtml: string;
}
