import { NextResponse } from "next/server";
import { testAIProvider } from "@/lib/ai-center-server";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    provider_name?: "OpenAI" | "Claude" | "Gemini" | "Perplexity" | "Grok";
    apiKey?: string;
  };

  if (!body.provider_name) {
    return NextResponse.json({ error: "missing_provider_name" }, { status: 400 });
  }

  const result = await testAIProvider({
    provider_name: body.provider_name,
    apiKey: body.apiKey,
  });

  return NextResponse.json(result);
}
