import { normalizeSlug, rewriteWikiLinks } from "@/lib/wikipedia-utils";

const WIKI_HTML = "https://en.wikipedia.org/api/rest_v1/page/html";
const USER_AGENT =
  "WikipediaEmbedTest/0.1 (https://github.com/wikipedia-embed-test; contact: dev@localhost) Next.js/16";
const REQUEST_GAP_MS = 500;

const articleCache = new Map<string, string>();
const inFlight = new Map<string, Promise<string>>();
let requestQueue: Promise<void> = Promise.resolve();

export { extractWikiSlugs, normalizeSlug } from "@/lib/wikipedia-utils";

function isRateLimitResponse(status: number, body: string) {
  return status === 429 || /too many requests/i.test(body);
}

function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  const result = requestQueue.then(fn);
  requestQueue = result.then(
    () => new Promise((resolve) => setTimeout(resolve, REQUEST_GAP_MS)),
    () => new Promise((resolve) => setTimeout(resolve, REQUEST_GAP_MS)),
  );
  return result;
}

async function fetchFromWiki(slug: string): Promise<string> {
  const res = await fetch(`${WIKI_HTML}/${encodeURIComponent(slug)}`, {
    headers: {
      "User-Agent": USER_AGENT,
      "Accept-Encoding": "gzip",
    },
    next: { revalidate: 86400 },
  });

  const raw = await res.text();

  if (isRateLimitResponse(res.status, raw)) {
    throw new Error("Wikipedia rate limit reached. Wait a moment and try again.");
  }

  const body = raw.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] ?? raw;
  return rewriteWikiLinks(body);
}

export async function getArticleHtml(title: string) {
  const slug = normalizeSlug(title);
  const cached = articleCache.get(slug);
  if (cached) return cached;

  const pending = inFlight.get(slug);
  if (pending) return pending;

  const promise = enqueue(() => fetchFromWiki(slug).then((html) => {
    articleCache.set(slug, html);
    return html;
  }));

  inFlight.set(slug, promise);

  try {
    return await promise;
  } finally {
    inFlight.delete(slug);
  }
}

export async function prefetchArticles(slugs: string[]) {
  const articles: Record<string, string> = {};

  for (const raw of slugs) {
    const slug = normalizeSlug(raw);
    if (articleCache.has(slug)) {
      articles[slug] = articleCache.get(slug)!;
      continue;
    }
    articles[slug] = await getArticleHtml(slug);
  }

  return articles;
}
