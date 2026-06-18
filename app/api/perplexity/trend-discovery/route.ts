import { NextRequest, NextResponse } from "next/server";
import { runPerplexityCapability } from "@/agents/perplexity";
import type { PerplexityOutputFormat } from "@/agents/perplexity/types";

function getFormat(request: NextRequest) {
  const format = request.nextUrl.searchParams.get("format");
  return (format === "markdown" || format === "csv" ? format : "json") as PerplexityOutputFormat;
}

export async function GET(request: NextRequest) {
  const result = await runPerplexityCapability("trend-discovery", getFormat(request));
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const format = body?.format === "markdown" || body?.format === "csv" ? body.format : "json";
  const result = await runPerplexityCapability("trend-discovery", format);
  return NextResponse.json(result);
}
