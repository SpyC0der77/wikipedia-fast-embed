import { WikiArticleView } from "@/components/wiki-article-view";
import { getArticleHtml } from "@/lib/wikipedia";

interface WikiPageProps {
  params: Promise<{ title: string }>;
}

export default async function WikiPage({ params }: WikiPageProps) {
  const { title } = await params;
  const decoded = decodeURIComponent(title);
  const html = await getArticleHtml(decoded);

  return <WikiArticleView title={decoded} html={html} />;
}
