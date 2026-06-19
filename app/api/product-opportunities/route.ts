import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildOpportunityPayload, type ProductOpportunityInput } from "@/lib/product-opportunities";

export async function GET() {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ items: [], error: "supabase_not_configured" }, { status: 200 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ items: [], error: "unauthorized" }, { status: 200 });
  }

  const { data, error } = await supabase
    .from("product_opportunities")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ items: [], error: error.message }, { status: 500 });
  }

  return NextResponse.json({ items: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "supabase_not_configured" }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as ProductOpportunityInput;

  if (!body.title || !body.category || !body.business_type) {
    return NextResponse.json({ error: "missing_required_fields" }, { status: 400 });
  }

  const payload = buildOpportunityPayload(body, user.email ?? user.id);

  const { data, error } = await supabase
    .from("product_opportunities")
    .insert({
      ...payload,
      user_id: user.id,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ item: data });
}
