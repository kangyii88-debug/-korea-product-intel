"use client";

import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { getDictionary } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";

export function LoginForm({
  supabaseUrl,
  supabaseAnonKey,
}: {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale } = useLocale();
  const t = getDictionary(locale);
  const next = searchParams.get("next") || "/";
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
      setMessage(t.loginForm.missingSupabase);
      setLoading(false);
      return;
    }

    if (mode === "signin") {
      const result = await supabase.auth.signInWithPassword({ email, password });

      if (result.error) {
        setMessage(t.loginForm.signInError);
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
      setMessage(`${t.loginForm.signUpError}: ${result.error.message}`);
      setLoading(false);
      return;
    }

    if (!result.data.session) {
      setMessageTone("success");
      setMessage(t.loginForm.signUpSuccess);
      setLoading(false);
      return;
    }

    router.push(next);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-800" htmlFor="email">
          {t.loginForm.email}
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
          placeholder={t.loginForm.emailPlaceholder}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-800" htmlFor="password">
          {t.loginForm.password}
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
          placeholder={t.loginForm.passwordPlaceholder}
        />
      </div>

      {message ? (
        <p
          className={
            messageTone === "success"
              ? "rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800"
              : "rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-800"
          }
        >
          {message}
        </p>
      ) : null}

      <div className="space-y-3">
        <Button className="h-11 w-full rounded-lg" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t.loginForm.loading}
            </>
          ) : mode === "signin" ? (
            t.loginForm.signIn
          ) : (
            t.loginForm.signUp
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          className="h-11 w-full rounded-lg border-slate-200 bg-white"
          onClick={() => {
            window.location.href = `/api/auth/demo?next=${encodeURIComponent(next)}`;
          }}
        >
          {t.loginForm.demoAccess}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <button
        type="button"
        onClick={() => {
          setMode(mode === "signin" ? "signup" : "signin");
          setMessage("");
        }}
        className="w-full text-sm text-slate-500 transition hover:text-slate-950"
      >
        {mode === "signin" ? t.loginForm.switchToSignup : t.loginForm.switchToSignin}
      </button>
    </form>
  );
}
