import { NextResponse } from "next/server";
import { listAIProviders, upsertAIProvider } from "@/lib/ai-center-server";

export async function GET() {
  const result = await listAIProviders();
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    provider_name?: "OpenAI" | "Claude" | "Gemini" | "Perplexity" | "Grok";
    enabled?: boolean;
    default_model?: string;
    usage_type?: string[];
    notes?: string;
    api_key_configured?: boolean;
  };

  if (!body.provider_name || !body.default_model) {
    return NextResponse.json({ error: "missing_required_fields" }, { status: 400 });
  }

  const result = await upsertAIProvider({
    provider_name: body.provider_name,
    enabled: Boolean(body.enabled),
    default_model: body.default_model,
    usage_type: body.usage_type ?? [],
    notes: body.notes,
    api_key_configured: body.api_key_configured,
  });

  if (result.error === "unauthorized") {
    return NextResponse.json(result, { status: 401 });
  }
  if (result.error === "supabase_not_configured") {
    return NextResponse.json(result, { status: 503 });
  }
  if (result.error) {
    return NextResponse.json(result, { status: 500 });
  }

  return NextResponse.json(result);
}
