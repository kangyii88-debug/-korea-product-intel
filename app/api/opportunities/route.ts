import { NextResponse } from "next/server";

const emptyResult = {
  ok: true,
  result: {
    generatedAt: new Date().toISOString(),
    pools: {
      growth: [],
      optimization: [],
      supplyChain: [],
      innovation: [],
    },
    reports: [],
  },
};

export async function GET() {
  return NextResponse.json(emptyResult);
}

export async function POST() {
  return NextResponse.json(emptyResult);
}
