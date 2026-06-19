import { NextResponse } from "next/server";
import { listAITaskTemplates } from "@/lib/ai-center-server";

export async function GET() {
  const result = await listAITaskTemplates();
  return NextResponse.json(result);
}
