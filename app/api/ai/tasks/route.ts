import { NextResponse } from "next/server";
import { listAIGeneratedTasks } from "@/lib/ai-center-server";

export async function GET() {
  const result = await listAIGeneratedTasks();
  return NextResponse.json(result);
}
