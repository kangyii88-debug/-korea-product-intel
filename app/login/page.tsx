import { LoginPageContent } from "@/components/login-page-content";
import { getPublicEnv } from "@/lib/env";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function LoginPage() {
  const { supabaseUrl, supabaseAnonKey } = getPublicEnv();
  return <LoginPageContent supabaseUrl={supabaseUrl} supabaseAnonKey={supabaseAnonKey} />;
}
