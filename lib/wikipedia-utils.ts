export function normalizeSlug(title: string) {
  return decodeURIComponent(title.replace(/ /g, "_"));
}

export function extractWikiSlugs(html: string, limit = 15) {
  const slugs: string[] = [];
  const seen = new Set<string>();
  const re = /href="\/wiki\/([^"#?]+)/g;

  for (const match of html.matchAll(re)) {
    const slug = match[1];
    if (seen.has(slug)) continue;
    seen.add(slug);
    slugs.push(slug);
    if (slugs.length >= limit) break;
  }

  return slugs;
}

function isArticleLink(path: string) {
  return !/^(Template|Wikipedia|Category|File|Help|Portal|Special|Module|MediaWiki):/i.test(
    path,
  );
}

export function rewriteWikiLinks(html: string) {
  let result = html.replace(/<base[^>]*>/gi, "");
  result = result.replace(/src="\/\//g, 'src="https://');
  result = result.replace(/srcset="\/\//g, 'srcset="https://');

  result = result.replace(
    /href="\.\/([^"#:?]+)(#[^"]*)?"/g,
    (match, path: string, hash = "") => {
      if (!isArticleLink(path)) return match;
      return `href="/wiki/${path}${hash}"`;
    },
  );

  result = result.replace(
    /href="https?:\/\/en\.wikipedia\.org\/wiki\/([^"#]+)(#[^"]*)?"/g,
    (_, path: string, hash = "") => {
      if (!isArticleLink(path)) return `href="https://en.wikipedia.org/wiki/${path}${hash}"`;
      return `href="/wiki/${path}${hash}"`;
    },
  );

  return result;
}
