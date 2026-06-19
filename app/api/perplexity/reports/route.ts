import { NextResponse } from "next/server";
import { createPerplexityReport, listPerplexityReports } from "@/lib/ai-center-server";
import type { PerplexityOutputFormat, PerplexityReportType, PerplexitySavedTo } from "@/lib/ai-workspace";

export async function GET() {
  const result = await listPerplexityReports();
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    query?: string;
    report_type?: PerplexityReportType;
    output_format?: PerplexityOutputFormat;
    saved_to?: PerplexitySavedTo;
    response_language?: "zh" | "ko";
  };

  if (!body.query || !body.report_type || !body.output_format || !body.saved_to) {
    return NextResponse.json({ error: "missing_required_fields" }, { status: 400 });
  }

  const result = await createPerplexityReport({
      query: body.query,
      report_type: body.report_type,
      output_format: body.output_format,
      saved_to: body.saved_to,
      response_language: body.response_language,
    });

  if (result.error === "unauthorized") {
    return NextResponse.json(result, { status: 401 });
  }

  return NextResponse.json(result);
}
