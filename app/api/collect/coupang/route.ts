import { NextResponse } from "next/server";
import { runCoupangCollection } from "@/lib/collection-workflow";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const urls = Array.isArray(body.urls) ? body.urls : body.url ? [body.url] : [];

  if (!urls.length) {
    return NextResponse.json({ ok: false, error: "Missing Coupang product URL" }, { status: 400 });
  }

  const run = await runCoupangCollection(urls);
  return NextResponse.json({ ok: run.status !== "failed", run });
}
