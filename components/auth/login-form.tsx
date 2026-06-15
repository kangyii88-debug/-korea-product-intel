"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient, hasSupabasePublicEnv } from "@/lib/supabase/client";

export function LoginForm({
  supabaseUrl,
  supabaseAnonKey,
  envDebug,
}: {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  envDebug: {
    urlExists: boolean;
    keyExists: boolean;
    urlLength: number;
    keyLength: number;
  };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";
  const publicEnv = hasSupabasePublicEnv();
  const hasSupabaseUrl = Boolean(supabaseUrl) || publicEnv.hasUrl;
  const hasSupabaseAnonKey = Boolean(supabaseAnonKey) || publicEnv.hasAnonKey;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"error" | "success">("error");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setMessageTone("error");

    const supabase = createClient({ url: supabaseUrl, anonKey: supabaseAnonKey });
    if (!supabase) {
      setMessage("Supabase client 创建失败。请查看下方 env 诊断值。");
      setLoading(false);
      return;
    }

    if (mode === "signin") {
      const result = await supabase.auth.signInWithPassword({ email, password });

      if (result.error) {
        setMessage("登录失败：账号不存在或密码不正确。请先点击下方“没有账号？创建一个”，或检查邮箱和密码。");
        setLoading(false);
        return;
      }

      router.push(next);
      router.refresh();
      return;
    }

    const result = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (result.error) {
      setMessage(`创建账号失败：${result.error.message}`);
      setLoading(false);
      return;
    }

    if (!result.data.session) {
      setMessageTone("success");
      setMessage("账号已创建。请检查邮箱确认邮件，确认后再返回登录。");
      setLoading(false);
      return;
    }

    router.push(next);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="text-sm font-medium" htmlFor="email">
          邮箱
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-2 h-10 w-full rounded-md border px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          placeholder="you@company.com"
        />
      </div>
      <div>
        <label className="text-sm font-medium" htmlFor="password">
          密码
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-2 h-10 w-full rounded-md border px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          placeholder="至少 6 位"
        />
      </div>
      {message ? (
        <p
          className={
            messageTone === "success"
              ? "rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
              : "rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"
          }
        >
          {message}
        </p>
      ) : null}
      <div className="space-y-1 rounded-md border bg-muted p-3 font-mono text-xs text-muted-foreground">
        <p>URL_EXISTS: {String(envDebug.urlExists)}</p>
        <p>KEY_EXISTS: {String(envDebug.keyExists)}</p>
        <p>URL_LENGTH: {envDebug.urlLength}</p>
        <p>KEY_LENGTH: {envDebug.keyLength}</p>
        <p>CLIENT_URL_EXISTS: {String(hasSupabaseUrl)}</p>
        <p>CLIENT_KEY_EXISTS: {String(hasSupabaseAnonKey)}</p>
      </div>
      <Button className="w-full" disabled={loading}>
        {loading ? "处理中..." : mode === "signin" ? "登录" : "创建账号"}
      </Button>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => {
          window.location.href = `/api/auth/demo?next=${encodeURIComponent(next)}`;
        }}
      >
        免密码进入系统
      </Button>
      <button
        type="button"
        onClick={() => {
          setMode(mode === "signin" ? "signup" : "signin");
          setMessage("");
        }}
        className="w-full text-sm text-muted-foreground hover:text-foreground"
      >
        {mode === "signin" ? "没有账号？创建一个" : "已有账号？返回登录"}
      </button>
    </form>
  );
}
