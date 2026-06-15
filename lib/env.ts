import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

type PublicEnv = {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
};

export function getPublicEnv(): PublicEnv {
  const fromProcess = {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };

  if (fromProcess.supabaseUrl && fromProcess.supabaseAnonKey) {
    return fromProcess;
  }

  const envPath = join(process.cwd(), ".env.local");
  if (!existsSync(envPath)) {
    return fromProcess;
  }

  const parsed = parseEnvFile(readFileSync(envPath, "utf8"));

  return {
    supabaseUrl: fromProcess.supabaseUrl || parsed.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: fromProcess.supabaseAnonKey || parsed.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}

function parseEnvFile(content: string) {
  const env: Record<string, string> = {};

  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;

    const separator = trimmed.indexOf("=");
    if (separator === -1) return;

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    env[key] = value;
  });

  return env;
}
