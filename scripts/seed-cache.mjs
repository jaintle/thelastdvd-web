// Offline fixture seed for `.cache/wp/`.
// Used only when the WP API is unreachable from the build sandbox (local dev
// on a locked-down network). Cloudflare Pages builds fetch live data and
// overwrite these files. Not required for production.
import { mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';

const CACHE = join(process.cwd(), '.cache/wp');
mkdirSync(CACHE, { recursive: true });

function key(pathname, params = {}) {
  const url = new URL('http://x' + pathname);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  const canonical = `${url.pathname}?${url.searchParams.toString()}`;
  const h = createHash('sha1').update(canonical).digest('hex').slice(0, 16);
  const safe = url.pathname.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '');
  return join(CACHE, `${safe}_${h}.json`);
}

function write(pathname, params, body, headers = {}) {
  const p = key(pathname, params);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, JSON.stringify({ body, headers }, null, 2), 'utf8');
  console.log('wrote', p);
}

// Categories — from real /wp-json/wp/v2/categories snapshot.
const categories = [
  { id: 22, count: 3, description: '', link: '', name: 'Current Issue', slug: 'current-issue', taxonomy: 'category', parent: 0 },
  { id: 28, count: 5, description: '', link: '', name: 'Issue 1', slug: 'issue-1', taxonomy: 'category', parent: 0 },
  { id: 26, count: 5, description: '', link: '', name: 'Issue 2', slug: 'issue-2', taxonomy: 'category', parent: 0 },
  { id: 29, count: 4, description: '', link: '', name: 'Issue 3', slug: 'issue-3', taxonomy: 'category', parent: 0 },
  { id: 36, count: 5, description: 'April 2026', link: '', name: 'Issue 4', slug: 'issue-4', taxonomy: 'category', parent: 0 },
  { id: 70, count: 4, description: '', link: '', name: 'Issue 5', slug: 'issue-5', taxonomy: 'category', parent: 0 },
  { id: 77, count: 3, description: '', link: '', name: 'Issue 6', slug: 'issue-6', taxonomy: 'category', parent: 0 },
];
write('/wp-json/wp/v2/categories', { orderby: 'name', order: 'asc', per_page: 100, page: 1 }, categories, { 'x-wp-total': String(categories.length), 'x-wp-totalpages': '1' });

// Tags used by the seed post.
const tags = [
  { id: 54, count: 1, description: '', link: '', name: 'Music', slug: 'music', taxonomy: 'post_tag', parent: 0 },
  { id: 80, count: 1, description: '', link: '', name: 'S Janaki', slug: 's-janaki', taxonomy: 'post_tag', parent: 0 },
  { id: 81, count: 1, description: '', link: '', name: 'Singing', slug: 'singing', taxonomy: 'post_tag', parent: 0 },
  { id: 82, count: 1, description: '', link: '', name: 'South Indian', slug: 'south-indian', taxonomy: 'post_tag', parent: 0 },
];
write('/wp-json/wp/v2/tags', { orderby: 'name', order: 'asc', per_page: 100, page: 1 }, tags, { 'x-wp-total': String(tags.length), 'x-wp-totalpages': '1' });

// Users (from Yoast schema graph).
const users = [
  {
    id: 20,
    name: 'Subhashini Ramachandran',
    slug: 'subhashini-ramachandran',
    description:
      "Subhashini is a Researcher and qualified Assistant Professor based in Chennai. She is passionate about fiction, women's writing, Tamil culture, and a fan of good melodies and thoughtful lyrics. Subhashini is optimistic of her writing skills.",
    link: 'https://thelastdvd.com/author/subhashini-ramachandran/',
    url: '',
  },
];
write('/wp-json/wp/v2/users', { per_page: 100, page: 1 }, users, { 'x-wp-total': String(users.length), 'x-wp-totalpages': '1' });

// Featured media for the seed post.
const media927 = {
  id: 927,
  date: '2026-08-16T11:00:00',
  slug: 's_janaki_-edited',
  type: 'attachment',
  link: 'https://thelastdvd.com/s_janaki_-edited/',
  title: { rendered: 'S Janaki (edited)' },
  author: 20,
  alt_text: 'S Janaki in her youth',
  media_type: 'image',
  mime_type: 'image/jpeg',
  media_details: { width: 683, height: 512 },
  source_url: 'https://thelastdvd.com/wp-content/uploads/2026/08/S_Janaki_-edited.jpg',
  caption: { rendered: 'S Janaki in her youth' },
};
write('/wp-json/wp/v2/media/927', {}, media927, {});

// Empty page responses so page-by-slug lookups produce controlled fallbacks.
for (const slug of ['about-us', 'contact-us', 'all-issues', 'submission-guidelines']) {
  write('/wp-json/wp/v2/pages', { slug, per_page: 1 }, [], { 'x-wp-total': '0', 'x-wp-totalpages': '1' });
}

// The seed post — real data pulled from the live API.
const post923 = {
  id: 923,
  date: '2026-08-16T11:00:00',
  date_gmt: '2026-08-16T05:30:00',
  modified: '2026-08-16T11:07:57',
  modified_gmt: '2026-08-16T05:37:57',
  slug: 's-janaki-amma-a-singer-for-generations',
  status: 'publish',
  type: 'post',
  link: 'https://thelastdvd.com/s-janaki-amma-a-singer-for-generations/',
  title: { rendered: 'S Janaki Amma: The People&#8217;s Singer' },
  excerpt: {
    rendered:
      '<p>To me, Janaki Amma was the voice that carried me through exams, bus rides, heartbreaks, and joy</p>',
  },
  content: {
    rendered:
      '<p class="wp-block-paragraph">When S Janaki passed away on 11 July 2026, tributes from politicians, actors, and music directors poured in. Even the President’s <a href="https://x.com/rashtrapatibhvn/status/2076142565804679565">tweet</a> called her passing “an irreparable loss to the world.” Yet her impressive work across six decades and 20 languages cannot be reduced to a tribute mentioning only a handful of “superhits.”</p>' +
      '<p class="wp-block-paragraph">This piece is not about her hits, but about how she lived in the everyday lives of Tamil people.</p>' +
      '<figure class="wp-block-image size-full is-resized"><img loading="lazy" width="683" height="512" src="https://thelastdvd.com/wp-content/uploads/2026/08/S_Janaki_-edited.jpg" alt="S Janaki in her youth" class="wp-image-927" /><figcaption class="wp-element-caption">S Janaki in her youth</figcaption></figure>' +
      '<p class="wp-block-paragraph">After a lifetime of singing and bestowing her art to simple mortals like us, Janaki Amma turned down the Padma Bhushan in 2013 calling it a “too little too late.” Her refusal was a dignified protest against tokenism and a protest against the injustice of a recognition that arrived too late in life.</p>' +
      '<p class="wp-block-paragraph"><em>Note:</em> this is a shortened offline seed of the article body; the full text arrives when the build reaches the WordPress REST API.</p>',
  },
  author: 20,
  featured_media: 927,
  categories: [22, 77],
  tags: [54, 80, 81, 82],
};

write('/wp-json/wp/v2/posts', { status: 'publish', orderby: 'date', order: 'desc', per_page: 100, page: 1 }, [post923], {
  'x-wp-total': '1',
  'x-wp-totalpages': '1',
});
