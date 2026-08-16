AGENTS.md — The Last DVD Headless Frontend

> Durable implementation brief for coding agents. Read this file completely before making architectural or production changes.

1. Project

Publication: The Last DVD
Canonical public site: https://thelastdvd.com
Editorial email: editor@thelastdvd.com

The Last DVD is an independent magazine focused primarily on cinema, with adjacent writing on music, dance, theatre, culture, and related media. It is based in India but publishes work concerning cinema and culture internationally.

This repository is for the new public frontend. WordPress remains the editorial CMS.

The primary product contract is:

> **Editor writes in WordPress → presses Publish → Cloudflare rebuilds → article appears on The Last DVD.**

The new frontend does not need to reproduce the current WordPress theme pixel-for-pixel. Correctness, readability, mobile usability, stable URLs, low operating cost, and a boring editorial workflow matter more than visual parity.

────────

2. Locked architecture

2.1 CMS

Use the existing WordPress installation hosted on Hostinger.

Editors must continue using normal WordPress for:

• posts;
• pages;
• authors;
• categories;
• tags;
• featured images;
• inline images/media;
• publication dates;
• excerpts;
• editorial revisions;
• normal Publish/Update workflow.

Do not replace WordPress.

Do not require editors to edit Git, JSON, Markdown, source code, or Cloudflare settings for ordinary publishing.

2.2 CMS production hostname

The eventual production CMS origin is:

https://cms.thelastdvd.com

The public frontend origin is:

https://thelastdvd.com

These are deliberately separate.

The frontend must never assume that WordPress runs at the public frontend origin.

Read the CMS base URL from:

```bash
WORDPRESS_BASE_URL=https://cms.thelastdvd.com
```

During initial local development, WORDPRESS_BASE_URL may temporarily point to the current reachable WordPress URL while cms.thelastdvd.com is not yet configured.

2.3 Frontend framework

Use:

• Astro
• TypeScript in strict mode
• static output
• Astro components by default
• ordinary CSS / scoped Astro CSS / a small global stylesheet
• minimal client-side JavaScript

Do not use Next.js for this project unless the architecture is explicitly revisited.

Do not make this a client-side SPA.

Do not add React unless a genuinely interactive component cannot be implemented reasonably with Astro + browser JavaScript.

This is a content-heavy magazine site. Prefer generated HTML.

2.4 Production hosting

Use Cloudflare Pages for the public frontend.

Cloudflare Pages is the production host.

GitHub stores source code and connects to Cloudflare Pages for deployments.

The expected deployment model is:

```text
GitHub repository
      ↓
Cloudflare Pages build
      ↓
Astro static output (dist/)
      ↓
Cloudflare CDN
      ↓
thelastdvd.com
```

Build command:

```bash
npm run build
```

Output directory:

```text
dist
```

2.5 Publishing model

The site is statically generated.

At build time Astro fetches published content from WordPress REST API and generates:

• homepage;
• article pages;
• static/editorial pages;
• category archives;
• tag archives;
• author archives where possible;
• sitemap;
• RSS if implemented.

When WordPress content is published or materially updated, WordPress triggers a Cloudflare Pages Deploy Hook.

That deploy hook starts a new Cloudflare build, which fetches current WordPress data and republishes the static site.

There is no requirement for server-side rendering at request time.

There is no requirement for Pages Functions in Phase 1.

────────

3. Cost-control principle

The architecture is intentionally static-first.

Avoid introducing infrastructure that creates a recurring frontend hosting bill unless a real requirement cannot be met otherwise.

Phase 1 should not need:

• Vercel Pro;
• a database;
• serverless API functions;
• Redis;
• custom search infrastructure;
• user authentication;
• payment processing.

Cloudflare Pages static delivery should handle the public website.

If a future feature requires dynamic execution, assess Cloudflare Workers/Pages Functions separately rather than turning the whole site into a dynamic application.

────────

4. Important Cloudflare DNS fact

The final production apex domain thelastdvd.com will be used with Cloudflare Pages.

The domain is currently registered with GoDaddy.

Domain registration does not need to move away from GoDaddy.

However, before attaching the apex domain to Cloudflare Pages, the site’s authoritative DNS will likely need to be managed in the Cloudflare account.

This means a future cutover may require changing the domain’s nameservers at GoDaddy to the nameservers Cloudflare assigns.

This is a production infrastructure step.

Do not do it automatically.

Before any nameserver change:

1. export/screenshot/copy every current DNS record;
2. recreate all required records in Cloudflare DNS;
3. verify them carefully;
4. preserve website rollback information;
5. preserve all Google Workspace email records;
6. preserve Beehiiv-related records;
7. preserve any SendGrid records still deliberately used;
8. preserve Google verification records;
9. preserve SPF, DKIM, DMARC, MX, CNAME, TXT records;
10. only then change nameservers.

Do not modify production DNS without explicit user approval.

────────

5. Email is separate infrastructure

Domain email uses Google Workspace.

Known mailbox:

editor@thelastdvd.com

The frontend does not need Gmail API integration.

The Contact page can use a normal mailto: link.

Frontend deployment must not alter email routing.

Never delete or overwrite:

• Google Workspace MX records;
• Google SPF;
• Google DKIM;
• DMARC;
• domain verification records;

during a website cutover.

Web hosting and email hosting are separate concerns.

────────

6. Newsletter

The publication’s newsletter is free.

Current newsletter provider:

Beehiiv

The public site needs:

• visible Subscribe navigation;
• /subscribe/;
• a newsletter call-to-action in the footer;
• optionally a homepage CTA.

No paid website subscription.

No paywall.

No member account.

No custom subscriber database.

Prefer the official Beehiiv hosted/embed form.

Store the configurable embed URL in:

```bash
PUBLIC_BEEHIIV_EMBED_URL=
```

If an embed is unreliable, use the Beehiiv hosted subscription URL rather than building a custom submission backend.

────────

7. Public routes

Preserve existing public URLs wherever practical.

Required routes:

```text
/
 /about-us/
 /contact-us/
 /all-issues/
 /submission-guidelines/
 /subscribe/
 /category/<slug>/
 /tag/<slug>/
 /author/<slug>/       when reliable author data exists
 /<post-slug>/
```

Article URLs must stay at the root:

```text
https://thelastdvd.com/<post-slug>/
```

Do not move articles to:

```text
/articles/<slug>/
```

or:

```text
/posts/<slug>/
```

Existing article links are valuable and should not be broken.

Use trailing slashes consistently.

Recommended Astro config:

```ts
trailingSlash: "always"
```

────────

8. Essential navigation

The frontend must expose these destinations:

• About us
• Contact
• All Issues
• Write for Us
• Subscribe

The publication also uses social accounts. Keep social URLs in one config file rather than scattering them across components.

Known handles previously used by the publication:

• X/Twitter: @thelastdvd
• Letterboxd: @thelastdvd
• Instagram: @last_dvd

Before production, verify the actual URLs once and store them in site config.

Do not invent social URLs from handles if they have not been verified.

────────

9. WordPress is the editorial source of truth

Do not hardcode changing editorial content into the Astro repository.

WordPress owns:

• article titles;
• article body;
• article slugs;
• excerpts;
• dates;
• authors;
• categories;
• tags;
• featured images;
• media;
• static page copy where it exists in WordPress.

If WordPress contains the content, fetch it.

Do not duplicate it in local Markdown solely to make implementation easier.

────────

10. WordPress REST API

Use WordPress’s built-in REST API.

Base:

```text
${WORDPRESS_BASE_URL}/wp-json/wp/v2
```

No GraphQL plugin is required.

No authenticated API is required for reading ordinary published content.

Do not create WordPress Application Passwords merely to fetch public posts.

10.1 Posts

Endpoint:

```text
/posts
```

Typical queries:

```text
/posts?slug=<slug>&_embed=1
/posts?per_page=20&page=1&_embed=1
/posts?categories=<id>&per_page=20&page=1&_embed=1
/posts?tags=<id>&per_page=20&page=1&_embed=1
/posts?author=<id>&per_page=20&page=1&_embed=1
```

Use _embed=1 where useful to obtain author and featured-media data without unnecessary requests.

10.2 Pages

Endpoint:

```text
/pages
```

Typical query:

```text
/pages?slug=<slug>
```

Expected page slugs:

• about-us
• contact-us
• all-issues
• submission-guidelines

Prefer WordPress page content for these routes.

Do not invent missing page copy.

10.3 Categories

```text
/categories
```

Use category ID/slug/name/description.

10.4 Tags

```text
/tags
```

Use tag ID/slug/name/description.

10.5 Media

```text
/media
```

Prefer embedded featured-media data when available.

Use the media endpoint only when needed.

10.6 Authors/users

```text
/users
```

Public author exposure may be limited.

Prefer embedded author data on posts.

If a biography is unavailable, render the name only.

Never invent a biography.

────────

11. API client rules

Put WordPress access in one data layer.

Suggested structure:

```text
src/lib/wordpress/
  client.ts
  types.ts
  posts.ts
  pages.ts
  taxonomies.ts
  authors.ts
  pagination.ts
  transforms.ts
```

Do not scatter fetch() calls and /wp-json/... strings through page templates.

The client must:

• read WORDPRESS_BASE_URL;
• validate that it is configured;
• create URLs safely with URL and URLSearchParams;
• throw meaningful errors for non-2xx responses;
• support pagination;
• inspect X-WP-Total;
• inspect X-WP-TotalPages;
• avoid requesting more content than needed;
• normalize WordPress responses into frontend-friendly types where useful.

Do not guess TypeScript response types.

Inspect actual API responses first.

────────

12. Build-time data strategy

Astro’s production build must generate all article routes that currently exist.

For dynamic article routes:

```text
src/pages/[slug].astro
```

use getStaticPaths().

The implementation must fetch the complete list of published WordPress posts across API pages.

WordPress collection APIs paginate.

Do not assume the first 10 or first 100 posts represent the full archive.

Build a reusable pagination helper.

The same principle applies to:

• categories;
• tags;
• author route generation;
• sitemap.

Normal HTML archive pages should still paginate visually rather than dumping hundreds of posts onto one page.

────────

13. Build-trigger architecture

13.1 Cloudflare Pages Deploy Hook

Create one deploy hook in the Cloudflare Pages project after the initial deployment.

Do not commit the deploy-hook URL publicly.

It is effectively a build-trigger secret.

Store the hook on the WordPress side, not in browser JavaScript.

13.2 WordPress integration

Commit a tiny mu-plugin to this repo:

```text
wordpress/tld-cloudflare-deploy.php
```

It will later be copied to:

```text
wp-content/mu-plugins/tld-cloudflare-deploy.php
```

The plugin should:

• trigger only for relevant public content;
• ignore autosaves;
• ignore revisions;
• avoid loops;
• avoid firing for irrelevant admin changes;
• trigger when a published post/page is created or materially updated;
• trigger when a published post/page is moved out of published state;
• trigger on relevant taxonomy changes if necessary;
• send an HTTP POST to the Cloudflare Pages deploy-hook URL;
• use a short timeout;
• fail silently from the editor’s perspective;
• log useful errors without exposing secrets.

Prefer a constant or server-side environment/config value such as:

```php
TLD_CLOUDFLARE_DEPLOY_HOOK
```

Do not expose this URL through the REST API or frontend HTML.

13.3 Build-frequency restraint

Do not trigger builds on:

• autosaves;
• revisions;
• every keystroke;
• draft-only saves.

Cloudflare’s free Pages plan has a finite monthly deployment allowance, so publishing automation should be deliberate.

A short debounce via WordPress transient is acceptable if needed.

13.4 Failure fallback

If the automatic deploy hook fails, an administrator must be able to manually redeploy from Cloudflare Pages.

The site already deployed remains online; a failed new build should not destroy the previous working deployment.

────────

14. WordPress HTML rendering

WordPress returns rendered HTML in fields such as:

```text
title.rendered
excerpt.rendered
content.rendered
```

14.1 Titles and excerpts

Decode HTML entities for plain-text contexts.

Do not display:

```text
&#8217;
&amp;
```

to readers.

Use safe text for:

• <title>;
• Open Graph metadata;
• card labels;
• accessible text.

14.2 Article body

Render WordPress HTML as first-party editorial HTML.

Use a dedicated component such as:

```text
src/components/content/WpContent.astro
```

Give it a stable wrapper class:

```text
.wp-content
```

Support at minimum:

• paragraphs;
• h2-h6;
• links;
• lists;
• blockquotes;
• images;
• figures;
• figcaptions;
• tables;
• horizontal rules;
• audio;
• video;
• iframe embeds where safe;
• common WordPress block classes.

Do not strip ordinary editorial formatting.

14.3 Sanitization

The CMS is first-party trusted content, but a deliberate HTML sanitization strategy is still preferable.

If adding an HTML sanitizer, configure it carefully enough not to destroy WordPress blocks, captions, images, or embeds.

Do not add a sanitizer and then silently break article layouts.

14.4 Internal links

Article body HTML may contain absolute links to:

```text
https://thelastdvd.com/...
```

Those should remain public frontend links.

After WordPress moves to cms.thelastdvd.com, CMS-generated links may occasionally contain that origin.

Normal post/page links should send readers to the public origin.

Do not blindly rewrite media URLs to the frontend domain.

────────

15. CMS/media cutover

Before thelastdvd.com stops serving WordPress directly, WordPress must have a durable CMS hostname.

Production target:

```text
https://cms.thelastdvd.com
```

Required sequence:

1. Back up WordPress.
2. Create the cms DNS record pointing to Hostinger.
3. Add/configure the subdomain in Hostinger.
4. Confirm SSL for cms.thelastdvd.com.
5. Make WordPress available at that hostname.
6. Confirm /wp-admin/.
7. Confirm /wp-json/.
8. Confirm media URLs.
9. Confirm new media uploads.
10. Confirm editing and publishing.
11. Only then prepare public-domain cutover.

15.1 Search-replace warning

Do not run a blind database-wide replacement of:

```text
thelastdvd.com
```

with:

```text
cms.thelastdvd.com
```

because editorial links to public articles should continue to point to the public site.

If old WordPress media URLs need changing, target the media path specifically, for example conceptually:

```text
https://thelastdvd.com/wp-content/uploads/
```

to:

```text
https://cms.thelastdvd.com/wp-content/uploads/
```

Back up before any bulk database operation.

Inspect first.

Do not run destructive search-replace without explicit approval.

────────

16. Media strategy

WordPress remains the media library.

Do not copy every article image into the Astro repo.

Article/featured images should load from the CMS/media origin.

Use:

• featured image URL;
• alt text;
• caption;
• width;
• height;

when available.

16.1 Missing images

If a post has no featured image:

• do not crash;
• render a clean text-first card;
• do not fabricate an image.

16.2 Alt text

Use WordPress alt text.

If no useful alt text exists and an image is decorative, prefer:

```html
alt=""
```

Do not automatically repeat the article title for every image.

16.3 Logo

The publication logo is a required local brand asset.

Before launch:

1. identify the current official logo;
2. use a publication-owned source file;
3. store it under public/brand/;
4. reference it locally;
5. provide a textual “The Last DVD” fallback.

Do not permanently hotlink the old WordPress theme’s logo.

Do not redesign the logo unless explicitly requested.

────────

17. Homepage

Pixel replication of the old homepage is not required.

Phase 1 homepage needs:

• masthead/logo;
• navigation;
• lead/latest article;
• latest article listing/grid;
• featured images where available;
• title;
• excerpt;
• author where available;
• date;
• useful category context;
• newsletter CTA;
• footer.

Use real WordPress posts.

Never hardcode current article titles.

A reasonable simple structure:

```text
Header
Lead story
Recent pieces
Newsletter CTA
Footer
```

The design should feel editorial, not like SaaS software.

────────

18. Article page

Route:

```text
/<post-slug>/
```

Minimum:

• title;
• excerpt/dek when suitable;
• author;
• publication date;
• featured image;
• featured-image caption where available;
• article body;
• categories;
• tags;
• author description if available;
• newsletter CTA;
• footer.

If the requested slug is not a published WordPress post, return a proper static 404 page.

No comments for Phase 1.

No account UI.

No WordPress admin UI exposed on the public site.

────────

19. Static/editorial pages

19.1 About

Route:

```text
/about-us/
```

Prefer WordPress page content.

If the WordPress page contains masthead/editorial details, preserve them.

19.2 Contact

Route:

```text
/contact-us/
```

Must include:

```text
editor@thelastdvd.com
```

Use mailto:.

Also show verified social links.

No custom form backend is required.

19.3 All Issues

Route:

```text
/all-issues/
```

Do not invent an issue data model.

Preference order:

1. render the existing WordPress page content;
2. simplify its presentation if old theme markup is awkward;
3. preserve correct issue/article links;
4. only model issues structurally if WordPress exposes a reliable underlying taxonomy/data structure.

Exact old issue-card visuals are not required.

19.4 Write for Us

Route:

```text
/submission-guidelines/
```

Prefer WordPress page content.

Do not invent or modernize editorial rules without instruction.

19.5 Subscribe

Route:

```text
/subscribe/
```

Free Beehiiv newsletter only.

Make it obvious that this is newsletter subscription, not a paid site membership.

────────

20. Archives

Category

Route pattern:

```text
/category/[slug]/
```

Generate all categories that need public pages.

Render:

• name;
• description if meaningful;
• posts;
• pagination.

Tag

Route pattern:

```text
/tag/[slug]/
```

Same pattern.

Author

Route pattern:

```text
/author/[slug]/
```

Implement only if WordPress gives reliable public author routing/data.

Render:

• author name;
• description if available;
• articles.

If public author slug data is insufficient, do not fabricate it.

Author archive can be deferred without blocking the rest of the site.

────────

21. Archive pagination

Use static pagination.

Examples:

```text
/category/cinema/
 /category/cinema/page/2/
 /tag/example/
 /tag/example/page/2/
```

Avoid client-only “load more” as the sole access mechanism.

Every archive page should have crawlable links.

Choose a reasonable page size, e.g. 12-20 posts.

Keep it configurable.

────────

22. Search

Search is not a launch blocker.

Do not build a server-side search service in Phase 1.

If a minimal search is later requested, possible approaches include:

• build-time search index generated from WordPress content;
• small client-side search for the static corpus;
• third-party search only if justified.

Do not delay the basic launch for search.

────────

23. Astro project structure

Recommended:

```text
.
├── AGENTS.md
├── README.md
├── .env.example
├── astro.config.mjs
├── package.json
├── public/
│   └── brand/
├── src/
│   ├── components/
│   │   ├── Header.astro
│   │   ├── Footer.astro
│   │   ├── MobileNav.astro
│   │   ├── PostCard.astro
│   │   ├── PostList.astro
│   │   ├── Pagination.astro
│   │   ├── Subscribe.astro
│   │   └── content/
│   │       └── WpContent.astro
│   ├── config/
│   │   └── site.ts
│   ├── layouts/
│   │   ├── BaseLayout.astro
│   │   └── ArticleLayout.astro
│   ├── lib/
│   │   ├── dates.ts
│   │   ├── html.ts
│   │   └── wordpress/
│   │       ├── client.ts
│   │       ├── types.ts
│   │       ├── pagination.ts
│   │       ├── posts.ts
│   │       ├── pages.ts
│   │       ├── taxonomies.ts
│   │       ├── authors.ts
│   │       └── transforms.ts
│   ├── pages/
│   │   ├── index.astro
│   │   ├── 404.astro
│   │   ├── about-us/
│   │   │   └── index.astro
│   │   ├── contact-us/
│   │   │   └── index.astro
│   │   ├── all-issues/
│   │   │   └── index.astro
│   │   ├── submission-guidelines/
│   │   │   └── index.astro
│   │   ├── subscribe/
│   │   │   └── index.astro
│   │   ├── category/
│   │   │   └── [slug]/
│   │   │       ├── index.astro
│   │   │       └── page/
│   │   │           └── [page].astro
│   │   ├── tag/
│   │   │   └── [slug]/
│   │   │       ├── index.astro
│   │   │       └── page/
│   │   │           └── [page].astro
│   │   ├── author/
│   │   │   └── [slug]/
│   │   │       └── index.astro
│   │   ├── rss.xml.ts
│   │   └── [slug].astro
│   └── styles/
│       └── global.css
└── wordpress/
    └── tld-cloudflare-deploy.php
```

This is guidance, not a requirement to create pointless files.

Prefer clarity.

────────

24. Site config

Create:

```text
src/config/site.ts
```

Stable public values belong here.

Conceptual example:

```ts
export const siteConfig = {
  name: "The Last DVD",
  url: "https://thelastdvd.com",
  description: "Independent writing on cinema and adjacent arts.",
  email: "editor@thelastdvd.com",
  nav: [
    { label: "About us", href: "/about-us/" },
    { label: "Contact", href: "/contact-us/" },
    { label: "All Issues", href: "/all-issues/" },
    { label: "Write for Us", href: "/submission-guidelines/" },
    { label: "Subscribe", href: "/subscribe/" },
  ],
  socials: {
    x: "",
    instagram: "",
    letterboxd: "",
  },
};
```

Verify social URLs before filling them.

────────

25. Environment variables

Create:

```text
.env.example
```

Minimum:

```bash
WORDPRESS_BASE_URL=https://cms.thelastdvd.com
PUBLIC_SITE_URL=https://thelastdvd.com
PUBLIC_BEEHIIV_EMBED_URL=
```

For local development .env or .env.local may use a temporary WordPress origin.

Cloudflare Pages production variables must be configured in Cloudflare dashboard.

Do not commit secrets.

The Beehiiv public form URL is not necessarily secret, but keep it configurable.

The Cloudflare deploy hook belongs on the WordPress side and should not be a PUBLIC_ frontend variable.

────────

26. SEO

SEO and URL continuity are launch-critical.

26.1 Canonical URLs

Always emit public canonicals from:

```text
https://thelastdvd.com
```

Never use cms.thelastdvd.com as an article canonical.

26.2 Article metadata

Generate:

• title;
• description from clean excerpt;
• canonical;
• Open Graph title;
• Open Graph description;
• Open Graph image when available;
• article date;
• author name where available.

26.3 Static pages

Give each a meaningful title and canonical.

Use WordPress description/content where appropriate.

26.4 Sitemap

Use the official Astro sitemap integration or generate equivalent output.

Sitemap must include at least:

• homepage;
• required static pages;
• all published article URLs.

Category/tag archive inclusion is optional if it improves discoverability.

Do not omit articles because the API paginates.

26.5 robots.txt

Allow normal public indexing.

Reference the sitemap.

Do not accidentally block the whole site.

26.6 CMS indexing

The CMS subdomain is not the canonical public publication.

It is reasonable to discourage indexing of CMS-origin frontend pages, but do not block /wp-json/ access needed for builds.

Do not apply a rule that prevents the Astro build from reading WordPress.

────────

27. RSS

RSS is useful for a publication and cheap in a static build.

Implement:

```text
/rss.xml
```

using Astro’s RSS tooling if practical.

Include:

• site title;
• article title;
• public article URL;
• publication date;
• description/excerpt.

RSS is desirable for Phase 1 but can be deferred if it blocks core launch.

────────

28. Design direction

Exact legacy-theme reproduction is explicitly not required.

Use a restrained magazine design.

Desired characteristics:

• publication masthead/logo;
• generous whitespace;
• strong hierarchy;
• readable long-form typography;
• neutral palette;
• subtle rules/borders;
• no dashboard aesthetic;
• no excessive cards;
• no gratuitous gradients;
• no glassmorphism requirement;
• no animation requirement;
• no autoplay;
• no infinite scroll.

A serif-forward editorial feel is welcome but not mandatory.

Do not spend days matching old margins or breakpoints.

────────

29. Accessibility

Minimum:

• semantic HTML;
• header, nav, main, article, footer;
• sensible heading hierarchy;
• keyboard-operable nav;
• visible focus;
• descriptive links;
• correct image alt behavior;
• iframe titles;
• adequate contrast;
• mobile menu operable without a mouse;
• no hover-only information;
• no disabled browser zoom.

Use the Astro dev toolbar/accessibility feedback during implementation where useful.

────────

30. Responsive requirements

Must work well around:

• 320 px;
• typical iPhone widths;
• typical Android widths;
• tablets;
• laptops;
• wide desktops.

Article content must not horizontally overflow.

Special handling may be needed for:

• tables;
• iframes;
• videos;
• very long URLs;
• WordPress embeds.

Make tables horizontally scrollable rather than shrinking text into unreadability.

────────

31. Performance

Static output should already be fast.

Preserve that advantage.

Do not ship JavaScript unless interaction requires it.

Prefer Astro components with no hydration.

For mobile navigation, a few lines of vanilla JS are preferable to importing a full UI framework.

Avoid large dependencies for trivial utilities.

Use responsive image behavior and explicit dimensions when available.

Do not proxy every WordPress image through a runtime image service unless justified.

────────

32. Date handling

Use a consistent publication format such as:

```text
17 August 2026
```

Treat the WordPress publication date as editorial publication data.

Do not convert the displayed date into each reader’s local timezone.

Avoid client/server date shifts.

────────

33. Error behavior

Build failures

If WordPress is completely unavailable during a production build, the build should fail clearly rather than deploy a mysteriously empty publication.

Log the failed endpoint.

Do not hide API errors by returning [] for everything.

The previous Cloudflare deployment should remain the production version if a new build fails.

Missing featured image

Render text-only.

Missing author bio

Render name only.

Missing page

Required static/editorial routes should present a controlled fallback/error rather than exposing raw API JSON.

Do not invent editorial copy to make the error disappear.

Unknown article slug

404. 

────────

34. Security

• no WordPress admin credentials in this repo;
• no deploy-hook URL in public frontend code;
• no secrets in Git;
• no public arbitrary-fetch proxy;
• no custom authentication;
• no payment code;
• no subscriber database;
• no dynamic form-processing endpoint unless explicitly requested;
• carefully handle CMS HTML;
• external links opened in a new tab should use appropriate rel values;
• do not trust arbitrary environment values without validation.

────────

35. Contact page

Use:

```text
editor@thelastdvd.com
```

as the editorial contact.

A plain mailto: is acceptable.

Do not build a contact database or serverless mailer for Phase 1.

If spam later becomes a problem, revisit then.

────────

36. No paid subscription logic

“Subscribe” means free newsletter subscription.

It does not mean:

• WordPress user registration;
• site membership;
• premium account;
• payment;
• article access entitlement.

Do not create membership language in UI unless instructed.

────────

37. Explicit Phase 1 non-goals

Do not block launch on:

• exact old-theme replication;
• search;
• comments;
• paid subscriptions;
• accounts;
• paywall;
• GraphQL;
• custom CMS;
• custom fields;
• complex issue model;
• recommendation engine;
• personalized feeds;
• e-commerce;
• advanced animation;
• dark mode;
• multilingual infrastructure;
• mobile app;
• analytics;
• advertisements.

────────

38. Dependencies

Keep dependencies minimal.

Likely useful:

• astro
• typescript (through Astro project setup)
• @astrojs/sitemap
• @astrojs/rss
• he or an equivalent tiny HTML-entity decoder if needed
• sanitize-html only if a sanitization step is genuinely used and configured correctly

Do not install Tailwind automatically.

Do not install React automatically.

Do not add state-management libraries.

Do not add axios merely to replace native fetch.

Use platform/native APIs where straightforward.

────────

39. Testing

Before first preview deployment:

```bash
npm run astro check
npm run build
npm run preview
```

If astro check is not configured yet, add the official checker.

Manually verify:

Home

• real posts;
• correct links;
• images;
• mobile.

Articles

Test at least five existing articles with varied content:

• long text;
• images;
• captions;
• headings;
• lists;
• embeds if available.

Verify their old root-level slugs.

Static pages

• About
• Contact
• All Issues
• Write for Us
• Subscribe

Archives

• one category;
• one tag;
• pagination if enough posts;
• author if implemented.

Newsletter

• Beehiiv form/link loads;
• clearly free;
• usable on phone.

SEO

• canonical;
• metadata;
• sitemap;
• robots;
• RSS if implemented.

Errors

• nonsense slug gives 404;
• no image does not crash;
• API failure gives useful build error.

────────

40. Cloudflare Pages setup

Do not perform production setup until local build works.

Expected Cloudflare Pages project settings:

```text
Framework preset: Astro
Build command: npm run build
Build output directory: dist
Production branch: main
```

Set required environment variables in Cloudflare Pages.

Connect the GitHub repository.

Use preview deployments for branches/PRs.

Do not attach thelastdvd.com until:

• preview is checked;
• CMS is working independently at cms.thelastdvd.com;
• all required DNS records have been inventoried;
• user explicitly approves cutover.

────────

41. Git workflow

Use GitHub.

Recommended:

```text
main = production
feature branches = preview deployments
```

Agents may commit code when instructed.

Do not force-push.

Do not rewrite shared history.

Do not commit .env.

Do not put production secrets into GitHub merely because Cloudflare can read the repo.

────────

42. Production cutover sequence

This section is intentionally conservative.

Do not skip steps.

Stage A — frontend preview

1. Build locally.
2. Push to GitHub.
3. Create Cloudflare Pages project.
4. Deploy preview/production Pages URL.
5. Test Pages URL thoroughly.

Stage B — CMS independence

1. Back up WordPress.
2. Configure cms.thelastdvd.com to Hostinger.
3. Enable SSL.
4. Make WordPress work at CMS hostname.
5. Verify admin.
6. Verify REST API.
7. Verify existing images.
8. Verify new uploads.
9. Configure Astro WORDPRESS_BASE_URL to CMS hostname.
10. Rebuild Cloudflare preview.
11. Verify again.

Stage C — publishing automation

1. Create Cloudflare Pages deploy hook.
2. Configure it on WordPress.
3. Install tiny mu-plugin.
4. Publish/update a controlled test item.
5. Confirm one Cloudflare build triggers.
6. Confirm changed content appears.
7. Confirm autosaves do not trigger noisy builds.

Stage D — DNS inventory

Record every current DNS entry before moving authoritative DNS.

Pay special attention to:

• current public web record;
• www;
• cms;
• Google Workspace MX;
• SPF;
• Google DKIM;
• DMARC;
• Google verification TXT;
• Beehiiv records;
• SendGrid records;
• any other intentional service.

Stage E — Cloudflare DNS

If the apex-domain Pages setup requires Cloudflare to host the DNS zone:

1. add the site to Cloudflare;
2. recreate/verify all existing required DNS records there;
3. do not proxy records that should be DNS-only unless appropriate;
4. verify mail records carefully;
5. obtain Cloudflare-assigned nameservers;
6. only with explicit approval, replace GoDaddy authoritative nameservers;
7. wait for propagation;
8. confirm email still works before touching frontend destination.

Stage F — public domain

1. Add thelastdvd.com as Cloudflare Pages custom domain.
2. Add/redirect www consistently.
3. Confirm HTTPS.
4. Confirm canonical apex behavior.
5. Verify homepage.
6. Verify 5-10 old article URLs.
7. Verify static pages.
8. Verify images.
9. Verify newsletter.
10. Verify Google Workspace send/receive.
11. Publish/update a controlled WordPress item.
12. Confirm deploy hook.
13. Confirm public update.
14. Keep rollback notes until satisfied.

Never combine this with an unreviewed WordPress database migration.

────────

43. Rollback philosophy

Always know the last working state.

Before DNS cutover, save:

• old nameservers;
• old website A/CNAME values;
• Cloudflare Pages project URL;
• Hostinger CMS IP/records;
• all mail DNS values.

If frontend cutover fails but DNS is otherwise healthy, rollback the public web destination without changing email records.

Do not “fix” a website outage by randomly deleting TXT or MX records.

────────

44. Cloudflare build limits awareness

The publishing design assumes a finite number of Pages deployments per month on the Free plan.

Do not create automation that deploys:

• every minute;
• every autosave;
• every WordPress heartbeat;
• every page view.

A deployment should correspond to an editorially meaningful published change.

If the publication eventually publishes/updates many hundreds of times per month, reassess the deployment model.

Do not prematurely optimize for that scale.

────────

45. Static site size awareness

Cloudflare Pages Free has file-count limits.

Do not generate enormous quantities of redundant files.

One HTML file per article/archive page is expected and appropriate.

Do not generate dozens of useless variants of every article.

If the publication ever approaches platform file limits, reassess architecture based on actual corpus size.

────────

46. Design implementation rules for agents

When no exact design is specified:

• choose a clean editorial default;
• use CSS variables for colors/spacing/type;
• keep typography readable;
• avoid novelty;
• keep the Subscribe CTA visible;
• keep main navigation obvious;
• make article body the visual priority.

Do not repeatedly ask the user:

• exact border radius?
• exact shade of grey?
• exact gap in pixels?
• exact hover animation?

Make sensible defaults and show working output.

Ask only when a decision materially changes product behavior or editorial meaning.

────────

47. Editorial accuracy rules

Do not fabricate:

• author biographies;
• issue names;
• article subtitles;
• article descriptions;
• categories;
• submission rules;
• contact information;
• social links;
• publication history.

If a field is missing:

• omit it;
• use a neutral structural fallback;
• report the missing source.

Never use AI-generated copy as if it were existing publication copy.

────────

48. WordPress theme independence

The new frontend must not depend on:

• the old WordPress theme’s CSS;
• theme PHP templates;
• theme JavaScript;
• theme-specific navigation;
• theme layout classes.

It may read the rendered WordPress article body because that is editorial content.

Where article HTML contains WordPress block classes, style those generically.

Preserve content semantics, not theme quirks.

────────

49. Static pages and WordPress shortcodes

If a WordPress page contains shortcodes that are rendered only by the old frontend/theme:

1. inspect the REST API output;
2. determine whether WordPress returns rendered useful HTML;
3. if yes, render it;
4. if no, implement the minimum equivalent frontend presentation based on verified source content;
5. do not recreate a large plugin ecosystem on the frontend.

Document each exception.

────────

50. All Issues caution

“All Issues” may depend on how the current WordPress site models issues.

Do not assume an issue custom post type exists.

Inspect:

```text
/wp-json/wp/v2/types
```

and relevant taxonomies/endpoints.

If the issue page is simply a normal WordPress page with links, render it first.

If a stable structured issue model exists, a richer frontend can use it.

Data decides architecture, not guesses.

────────

51. CORS

A fully static Astro build fetches WordPress at build time on the server/build machine.

Therefore ordinary public rendering should not depend on browser CORS access to WordPress.

Do not add permissive Access-Control-Allow-Origin: * headers to WordPress just because the site is headless.

Only add CORS changes if a concrete browser-side request actually needs them.

────────

52. WordPress privacy/indexing setting

Do not enable WordPress’s “Discourage search engines” option blindly if it would add headers/meta behavior that interferes with API usage or media.

The CMS origin should not compete with the public frontend in search results.

Handle CMS indexing deliberately.

The canonical public website remains thelastdvd.com.

────────

53. Cloudflare caching

Because the public site consists mainly of static assets, let Cloudflare Pages/CDN serve generated output normally.

Do not create complicated cache rules in Phase 1.

Do not cache WordPress admin through an aggressive custom rule.

CMS/Hostinger and public Pages are separate origins.

────────

54. Analytics

Not required for first launch.

If added later:

• one small integration;
• ID via environment variable;
• no ad-tech bundle;
• no blocking script;
• respect privacy requirements.

Do not delay launch for analytics.

────────

55. Browser support

Target modern evergreen browsers and current mobile Safari/Chrome.

Use progressive enhancement.

Navigation and article reading should remain functional without heavy JavaScript.

Do not depend on experimental browser APIs for core reading.

────────

56. First implementation milestone

The first coding milestone is a locally working static Astro site with:

• base layout;
• header;
• footer;
• responsive navigation;
• site config;
• WordPress API client;
• robust pagination helper;
• homepage from real WP posts;
• root-level article routes generated from all published posts;
• WordPress HTML renderer;
• featured images;
• About;
• Contact;
• All Issues;
• Write for Us;
• Subscribe;
• category archive;
• tag archive;
• author archive if reliable;
• 404;
• metadata;
• canonical URLs;
• sitemap;
• robots;
• RSS if straightforward;
• .env.example;
• README;
• responsive editorial styling.

No Cloudflare production cutover yet.

────────

57. Second implementation milestone

After local functionality:

• connect GitHub;
• deploy to Cloudflare Pages preview;
• test preview;
• configure cms.thelastdvd.com;
• point build-time API at CMS hostname;
• implement Cloudflare deploy-hook mu-plugin;
• test WordPress → Cloudflare build;
• improve odd WordPress content cases;
• check broad legacy URL sample;
• prepare production DNS inventory.

────────

58. Definition of done

Phase 1 production is done when:

• thelastdvd.com is served by Cloudflare Pages;
• WordPress remains usable on Hostinger at the CMS hostname;
• editors publish only through WordPress;
• a meaningful WordPress publish/update triggers a Cloudflare build;
• the new/updated article appears without editing Git;
• existing root article slugs resolve;
• homepage is real WP content;
• articles are readable;
• images work;
• About works;
• Contact works;
• All Issues works;
• Write for Us works;
• free Beehiiv Subscribe works;
• category/tag archives work;
• mobile works;
• HTTPS works;
• sitemap works;
• robots works;
• metadata/canonicals use public domain;
• build/type checks pass;
• Google Workspace email continues working.

Pixel parity with the old WordPress theme is not part of done.

────────

59. Agent operating rules

1. Read this entire file.
2. Inspect the repository before restructuring it.
3. Inspect live WordPress API responses before modeling data.
4. Prefer the smallest correct implementation.
5. Keep WordPress as source of truth.
6. Keep public article URLs.
7. Do not change DNS without explicit approval.
8. Do not change production WordPress URLs without explicit approval.
9. Do not perform database-wide replacements without explicit approval.
10. Do not delete content.
11. Do not expose secrets.
12. Do not introduce a paid service unnecessarily.
13. Do not add React/Tailwind/state libraries automatically.
14. Use static Astro output.
15. Do not turn missing editorial data into invented copy.
16. Test actual routes.
17. Run type/check/build before claiming completion.
18. Report what was verified, not what is assumed.
19. Keep a short implementation checklist while working.
20. Continue through implementation rather than stopping at a plan unless blocked by a real external dependency.
21. When blocked, explain exactly what input or infrastructure is missing.
22. Do not make production infrastructure changes merely because credentials happen to be available.
23. Keep deployment reversible.
24. Treat email DNS as sacred during frontend work.
25. Optimize for a simple editorial workflow.

────────

60. Final principle

This is not a complex web application.

It is a magazine.

The ideal production system is:

```text
WordPress on Hostinger
        ↓
WordPress REST API
        ↓
Astro build
        ↓
Cloudflare Pages
        ↓
thelastdvd.com
```

with:

```text
WordPress Publish/Update
        ↓
Cloudflare Pages Deploy Hook
        ↓
new static build
```

and separately:

```text
editor@thelastdvd.com
        ↓
Google Workspace
```

and:

```text
Subscribe
        ↓
Beehiiv
```

Keep those concerns separate, inexpensive, and boring.