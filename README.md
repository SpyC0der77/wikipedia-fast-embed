# Wikipedia Fast Embed

An experiment in fast navigation between English Wikipedia articles. The homepage opens `/wiki/Earth`; article links stay inside the app, with client-side caching and prefetching.

## What it does

- Render Wikipedia article HTML at `/wiki/[title]`.
- Rewrite internal Wikipedia links to local article routes.
- Cache article HTML in memory and deduplicate in-flight requests.
- Queue upstream requests with a 500 ms gap to reduce rate limiting.

## Run locally

Use Node.js 20.9+ and Bun.

```bash
git clone https://github.com/SpyC0der77/wikipedia-fast-embed.git
cd wikipedia-fast-embed
bun install --frozen-lockfile
bun run dev
```

Open [localhost:3000](http://localhost:3000).

## Commands

| Command | Purpose |
| --- | --- |
| `bun run dev` | Start the development server |
| `bun run build` | Build the production app |
| `bun run start` | Serve a production build |
| `bun run lint` | Run ESLint |

Run `build` before `start`.

## Dependencies and limitations

Article content comes from the English Wikipedia REST API. The in-memory cache belongs to a server process and is lost when that process restarts. No API key is required. Wikipedia content retains its upstream licenses and attribution.

## Source layout

- [`lib/wikipedia.ts`](lib/wikipedia.ts): Upstream requests, cache, and queue.
- [`lib/wikipedia-utils.ts`](lib/wikipedia-utils.ts): Slug normalization and link rewriting.
- [`components/wiki-article-view.tsx`](components/wiki-article-view.tsx): Article navigation.
- [`app/api/wiki/route.ts`](app/api/wiki/route.ts): Prefetch endpoint.
