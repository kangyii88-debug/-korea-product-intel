import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextRequest, NextResponse } from "next/server";

const SAMPLE_FILES = {
  coupang_hot_products_50: "coupang_hot_products_50.json",
  coupang_test_products_5: "coupang_test_products_5.json",
  coupang_rocket_growth_test_10: "coupang_rocket_growth_test_10.json",
} as const;

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get("name") as keyof typeof SAMPLE_FILES | null;
  if (!name || !(name in SAMPLE_FILES)) {
    return NextResponse.json({ error: "invalid_sample_name" }, { status: 400 });
  }

  try {
    const filePath = join(process.cwd(), "data", SAMPLE_FILES[name]);
    const content = await readFile(filePath, "utf8");
    const items = JSON.parse(content) as unknown;

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: "invalid_sample_payload" }, { status: 500 });
    }

    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ error: "sample_read_failed" }, { status: 500 });
  }
}
