"use client";

import { normalizeSlug } from "@/lib/wikipedia-utils";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

interface WikiArticleViewProps {
  title: string;
  html: string;
}

function getWikiSlug(href: string) {
  const local = href.match(/^\/wiki\/([^#?]+)/);
  if (local) return local[1];

  const remote = href.match(/^https?:\/\/en\.wikipedia\.org\/wiki\/([^#?]+)/);
  if (remote) return remote[1];

  return null;
}

export function WikiArticleView({ title, html: initialHtml }: WikiArticleViewProps) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const cache = useRef(new Map<string, string>());
  const prefetching = useRef(new Set<string>());
  const hoverTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [html, setHtml] = useState(initialHtml);

  const prefetchSlug = useCallback((slug: string) => {
    if (cache.current.has(slug) || prefetching.current.has(slug)) return;

    prefetching.current.add(slug);

    fetch(`/api/wiki?slugs=${encodeURIComponent(slug)}`)
      .then((res) => res.json())
      .then(({ articles }: { articles: Record<string, string> }) => {
        for (const [key, articleHtml] of Object.entries(articles)) {
          cache.current.set(key, articleHtml);
        }
      });
  }, []);

  useEffect(() => {
    cache.current.set(normalizeSlug(title), initialHtml);
    setHtml(initialHtml);
  }, [title, initialHtml]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function onMouseOver(e: MouseEvent) {
      const link = (e.target as HTMLElement).closest("a");
      if (!link) return;

      const slug = getWikiSlug(link.getAttribute("href") ?? "");
      if (!slug) return;

      clearTimeout(hoverTimer.current);
      hoverTimer.current = setTimeout(() => prefetchSlug(slug), 400);
    }

    function onClick(e: MouseEvent) {
      const link = (e.target as HTMLElement).closest("a");
      if (!link) return;

      const href = link.getAttribute("href");
      if (!href) return;

      const slug = getWikiSlug(href);
      if (!slug) return;

      e.preventDefault();

      fetch("/api/log-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          href,
          title: decodeURIComponent(slug.replace(/_/g, " ")),
        }),
      });

      const hash = href.includes("#") ? href.slice(href.indexOf("#")) : "";
      const cached = cache.current.get(slug);

      if (cached) {
        setHtml(cached);
        window.history.pushState(null, "", `/wiki/${slug}${hash}`);
        if (hash) {
          requestAnimationFrame(() => document.querySelector(hash)?.scrollIntoView());
        } else {
          ref.current?.querySelector(".wiki-article")?.scrollTo(0, 0);
        }
        return;
      }

      router.push(`/wiki/${slug}${hash}`);
    }

    el.addEventListener("mouseover", onMouseOver);
    el.addEventListener("click", onClick);
    return () => {
      clearTimeout(hoverTimer.current);
      el.removeEventListener("mouseover", onMouseOver);
      el.removeEventListener("click", onClick);
    };
  }, [router, prefetchSlug]);

  return (
    <div ref={ref}>
      <article
        className="wiki-article mw-parser-output"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
