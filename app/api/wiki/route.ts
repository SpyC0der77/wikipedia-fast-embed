import { prefetchArticles } from "@/lib/wikipedia";

export async function GET(request: Request) {
  const slugs =
    new URL(request.url).searchParams.get("slugs")?.split(",").filter(Boolean) ?? [];
  const articles = await prefetchArticles(slugs);
  return Response.json({ articles });
}
