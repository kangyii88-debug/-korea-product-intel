import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  await supabase?.auth.signOut();

  const response = NextResponse.redirect(new URL("/login", request.url));
  response.cookies.delete("kpi_demo_access");

  return response;
}
