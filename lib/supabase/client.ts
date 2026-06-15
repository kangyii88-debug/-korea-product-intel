import { createBrowserClient } from "@supabase/ssr";

export function getSupabasePublicEnv() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}

export function hasSupabasePublicEnv() {
  const { url, anonKey } = getSupabasePublicEnv();
  return {
    hasUrl: Boolean(url),
    hasAnonKey: Boolean(anonKey),
  };
}

export function createClient(overrides?: { url?: string; anonKey?: string }) {
  const fallback = getSupabasePublicEnv();
  const url = overrides?.url || fallback.url;
  const anonKey = overrides?.anonKey || fallback.anonKey;

  if (!url || !anonKey) {
    return null;
  }

  return createBrowserClient(url, anonKey);
}
