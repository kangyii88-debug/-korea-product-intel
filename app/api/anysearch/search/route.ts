import { NextRequest, NextResponse } from "next/server";
import { AnySearchError, searchAnySearch } from "@/lib/anysearch";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { query?: string; limit?: number };
    const query = body.query?.trim();

    if (!query) {
      return NextResponse.json(
        {
          ok: false,
          error: "Query is required.",
        },
        { status: 400 },
      );
    }

    const result = await searchAnySearch({
      query,
      limit: typeof body.limit === "number" ? body.limit : 10,
    });

    return NextResponse.json({
      ok: true,
      data: result,
    });
  } catch (error) {
    const normalized = error instanceof AnySearchError ? error : new AnySearchError("Unexpected AnySearch error.");
    const status = normalized.status && normalized.status >= 400 ? normalized.status : 500;

    return NextResponse.json(
      {
        ok: false,
        error: normalized.message,
        details: normalized.details ?? null,
      },
      { status },
    );
  }
}
