import { NextResponse } from "next/server";
import { buildCurtainIndustryDatabase } from "@/lib/curtain-database";
import { saveCurtainIndustryDatabase } from "@/lib/curtain-database-store";
import { generateCurtainIntelligence } from "@/lib/curtain-intelligence";
import { mockReviews, products } from "@/lib/mock-data";

export async function GET() {
  const database = buildCurtainIndustryDatabase(products, mockReviews);
  await saveCurtainIndustryDatabase(database);

  return NextResponse.json({
    ok: true,
    database,
    intelligence: generateCurtainIntelligence(products, mockReviews),
  });
}
