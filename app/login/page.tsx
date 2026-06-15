import { Suspense } from "react";
import { Boxes } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getPublicEnv } from "@/lib/env";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function LoginPage() {
  const { supabaseUrl, supabaseAnonKey } = getPublicEnv();
  const envDebug = {
    urlExists: Boolean(supabaseUrl),
    keyExists: Boolean(supabaseAnonKey),
    urlLength: supabaseUrl?.length ?? 0,
    keyLength: supabaseAnonKey?.length ?? 0,
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-5 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-muted">
            <Boxes className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Korea Product Intel</h1>
            <p className="text-sm text-muted-foreground">韩国电商 AI 选品开发网页版系统</p>
          </div>
        </div>
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">登录系统</h2>
            <p className="mt-1 text-sm text-muted-foreground">通过浏览器访问，数据和 AI 报告保存到云端 Supabase。</p>
          </CardHeader>
          <CardContent>
            <div className="mb-4 space-y-1 rounded-md border bg-muted p-3 font-mono text-xs text-muted-foreground">
              <p>SERVER_URL_EXISTS: {String(envDebug.urlExists)}</p>
              <p>SERVER_KEY_EXISTS: {String(envDebug.keyExists)}</p>
              <p>SERVER_URL_LENGTH: {envDebug.urlLength}</p>
              <p>SERVER_KEY_LENGTH: {envDebug.keyLength}</p>
            </div>
            <Suspense>
              <LoginForm supabaseUrl={supabaseUrl} supabaseAnonKey={supabaseAnonKey} envDebug={envDebug} />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
