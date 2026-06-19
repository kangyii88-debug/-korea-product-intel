import { NextResponse } from "next/server";
import { createAIAnalysis, listAIAnalysisRecords } from "@/lib/ai-center-server";
import type { ProductOpportunityRecord } from "@/lib/product-opportunities";
import type { AITaskType } from "@/lib/ai-workspace";

export async function GET() {
  const result = await listAIAnalysisRecords();
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    source_type?: string;
    source_id?: string;
    source_title?: string;
    task_type?: AITaskType;
    source_snapshot?: ProductOpportunityRecord;
    provider_name?: "OpenAI" | "Claude" | "Gemini" | "Perplexity" | "Grok";
    model_name?: string;
  };

  if (!body.source_type || !body.source_id || !body.source_title || !body.task_type || !body.source_snapshot) {
    return NextResponse.json({ error: "missing_required_fields" }, { status: 400 });
  }

  const result = await createAIAnalysis({
    source_type: body.source_type,
    source_id: body.source_id,
    source_title: body.source_title,
    task_type: body.task_type,
    source_snapshot: body.source_snapshot,
    provider_name: body.provider_name,
    model_name: body.model_name,
  });

  if (result.error === "unauthorized") {
    return NextResponse.json(result, { status: 401 });
  }

  return NextResponse.json(result);
}
