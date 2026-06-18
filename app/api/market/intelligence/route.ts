import { NextResponse } from "next/server";

const emptyResult = {
  ok: true,
  result: {
    generatedAt: new Date().toISOString(),
    snapshots: [],
    trendCenter: {
      fastestGrowing7Days: [],
      fastestGrowing30Days: [],
      fastestGrowing90Days: [],
    },
    opportunityRadar: {
      newOpportunities: [],
      newTrends: [],
      newCategories: [],
      growingCategories: [],
      decliningCategories: [],
    },
    curtainTrendCenter: {
      hotSizeTrends: [],
      hotColorTrends: [],
      hotMaterialTrends: [],
      hotPriceTrends: [],
    },
    competitorIntelligence: {
      growingBrands: [],
      decliningBrands: [],
      reviewGrowthLeaders: [],
      rankingMovers: [],
      priceMovers: [],
    },
    alerts: [],
    executiveBrief: [],
  },
};

export async function GET() {
  return NextResponse.json(emptyResult);
}

export async function POST() {
  return NextResponse.json(emptyResult);
}
