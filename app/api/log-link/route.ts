export async function POST(request: Request) {
  const { href, title } = await request.json();
  console.log(`[wiki-link] ${title} → ${href}`);
  return Response.json({ ok: true });
}
