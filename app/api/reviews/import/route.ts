import { NextResponse } from "next/server";
import { buildReviewCorpusAnalysis } from "@/lib/review-corpus";
import { parsePastedReviewText, parseReviewCsv, parseReviewExcel } from "@/lib/review-import";

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const productId = new URL(request.url).searchParams.get("productId") ?? "imported-product";

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "Missing file" }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const reviews = file.name.endsWith(".csv")
      ? parseReviewCsv(productId, Buffer.from(buffer).toString("utf8"))
      : parseReviewExcel(productId, buffer);

    return NextResponse.json({ ok: true, reviews, corpus: buildReviewCorpusAnalysis(reviews) });
  }

  const body = await request.json().catch(() => ({}));
  const reviews =
    body.format === "csv"
      ? parseReviewCsv(body.productId ?? productId, body.content ?? "")
      : parsePastedReviewText(body.productId ?? productId, body.content ?? "");

  return NextResponse.json({ ok: true, reviews, corpus: buildReviewCorpusAnalysis(reviews) });
}
