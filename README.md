# The Silver Screen

An independent guide to special screenings in Jakarta: festivals, cultural-centre screenings, retrospectives and one-night events, with ticket status for each.

Domain: silverscreenjkt.com

## Stack

- Astro + TypeScript, with small React components for the hero carousel and the What's On filters
- Supabase (Postgres) for listings, project region ap-southeast-1
- Cloudflare Pages for hosting
- Google Sheets "Listings inbox" for day-to-day data entry

## What's built

| Page | File | Data |
| --- | --- | --- |
| Home | `src/pages/index.astro` | Hero, playing today / next up, CGV Arthouse band, ticket sales this week, coming up, blog |
| What's On | `src/pages/whats-on.astro` + `src/components/WhatsOn.tsx` | Day-by-day listings with range and filters |
| Holding pages | `src/pages/[section].astro` | Festivals, Di Bioskop, Venues, Blog, Search, Alerts, Submit, About |

Sections on Home hide themselves when there is nothing to show (for example, no blog posts yet).

Design tokens and components live in `src/styles/global.css` (design system v2.white: paper pages, black secondaries via `class="dark"`).

## Run it locally

```sh
npm install
npm run dev
```

The Supabase URL and publishable key have safe defaults in `src/lib/supabase.ts`. To override, copy `.env.example` to `.env`.

## Deploy on Cloudflare Pages

1. Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git → choose `KumRizki/Silver-Screen`.
2. Framework preset: Astro. Build command `npm run build`, output directory `dist`.
3. Environment variable: `NODE_VERSION` = `22`.
4. Every push builds; branches other than `main` get preview links.

The site is static, so listings update when it rebuilds. To rebuild daily (keeps "Playing today" current), create a deploy hook in Cloudflare Pages → Settings → Builds → Deploy hooks, and save its URL as the GitHub repository secret `CF_DEPLOY_HOOK`. The workflow in `.github/workflows/daily-rebuild.yml` calls it at 00:07 WIB.
