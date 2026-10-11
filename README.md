# The Last DVD — headless frontend

Astro static frontend for [thelastdvd.com](https://thelastdvd.com). WordPress remains the editorial CMS; this repository builds the public site.

**Publishing contract:** editor writes in WordPress → presses Publish → Cloudflare rebuilds → article appears on The Last DVD.

## Architecture at a glance

```
WordPress (Hostinger, becomes cms.thelastdvd.com)
        ↓  REST API (/wp-json/wp/v2)
    Astro build (getStaticPaths at build time)
        ↓
   Cloudflare Pages (static)
        ↓
    thelastdvd.com
```

Full specification, constraints, and cutover plan live in [`AGENTS.md`](./AGENTS.md).

## Prerequisites

- Node.js **>= 22.12** (see `package.json` engines).
- WordPress reachable at `WORDPRESS_BASE_URL` during the build.

## Setup

```bash
npm install
cp .env.example .env
# edit .env — set WORDPRESS_BASE_URL to a reachable WordPress origin
```

## Scripts

```bash
npm run dev        # start Astro dev server
npm run build      # produce static site in dist/
npm run preview    # preview the built site
npm run astro check  # type-check .astro + .ts files
```

## Environment variables

| Variable                    | Purpose                                          |
| --------------------------- | ------------------------------------------------ |
| `WORDPRESS_BASE_URL`        | REST API origin (target: `https://cms.thelastdvd.com`) |
| `PUBLIC_SITE_URL`           | Public canonical origin (`https://thelastdvd.com`)      |
| `TLD_USE_CACHE` *(optional)*| Force cache-only reads (offline builds)           |

## Data layer

All WordPress access is centralised in `src/lib/wordpress/`:

- `client.ts` — `fetch()` with an on-disk fallback cache under `.cache/wp/`.
- `pagination.ts` — reads `X-WP-TotalPages` and fans out remaining pages with a concurrency cap.
- `posts.ts`, `pages.ts`, `taxonomies.ts`, `authors.ts` — typed collection helpers.
- `transforms.ts` — normalises a `WPPost` (+ media + author + terms) into an `Article`.

On every successful fetch the response is written to `.cache/wp/…`. If a later build's live fetch fails, the client transparently falls back to the cached JSON so a broken CMS does not blow up the site. The cache is ignored by Git.

## Publish workflow (future work — see AGENTS.md §13)

A tiny WordPress mu-plugin will POST to a Cloudflare Pages Deploy Hook when a published post/page changes. That plugin lives in `wordpress/tld-cloudflare-deploy.php` (to be added in milestone 2). No autosaves, no revisions, no draft-only saves.

## Deployment (Cloudflare Pages — milestone 2)

- Framework preset: **Astro**
- Build command: `npm run build`
- Output directory: `dist`
- Environment variables set in Cloudflare Pages dashboard (not committed).

Do not attach `thelastdvd.com` until the CMS is independently reachable at `cms.thelastdvd.com`, DNS has been inventoried, and the cutover in AGENTS.md §42 has been followed step-by-step.

## Constraints (read AGENTS.md)

- Static output only. No React, no Tailwind, no state libraries.
- Article URLs stay at the root: `https://thelastdvd.com/<slug>/`.
- Editorial content is never hardcoded — it comes from WordPress.
- Never invent authors, bios, submission rules, or issue names.
- Google Workspace email and DNS routing are separate infrastructure and must not be touched during frontend work.
