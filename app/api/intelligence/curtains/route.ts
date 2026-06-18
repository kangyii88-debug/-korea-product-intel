import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    database: {
      generatedAt: new Date().toISOString(),
      records: [],
      profiles: [],
      sizeStats: [],
      colorStats: [],
      materialStats: [],
      priceStats: [],
      negativeCases: [],
      recommendations: [],
    },
    intelligence: {
      categorySummary: [],
      topSignals: [],
      riskAlerts: [],
      nextActions: [],
    },
  });
}
