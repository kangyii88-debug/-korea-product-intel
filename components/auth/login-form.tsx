"use client";

import { useState } from "react";
import { ArrowRight, Loader2, Mail } from "lucide-react";
import { useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();
  const { locale } = useLocale();
  const t = getDictionary(locale);
  const next = searchParams.get("next") || "/";
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"error" | "success">("error");
  const [loading, setLoading] = useState(false);
  const guestButtonLabel = locale === "ko" ? "비밀번호 없이 바로 입장" : "免密码直接进入";

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

    const result = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (result.error) {
      setMessage(t.loginForm.signInError);
      setLoading(false);
      return;
    }

    setMessageTone("success");
    setMessage(t.loginForm.magicLinkSent);
    setLoading(false);
  }

  async function enterWithoutPassword() {
    setLoading(true);
    setMessage("");
    setMessageTone("error");

    const supabase = createClient({ url: supabaseUrl, anonKey: supabaseAnonKey });
    if (supabase) {
      const result = await supabase.auth.signInAnonymously();
      if (!result.error) {
        window.location.href = next;
        return;
      }
    }

    window.location.href = `/api/auth/demo?next=${encodeURIComponent(next)}`;
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
        <div className="flex items-start gap-3">
          <Mail className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
          <p>{t.loginForm.emailHint}</p>
        </div>
      </div>

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
        <Button type="submit" className="h-11 w-full rounded-lg" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t.loginForm.loading}
            </>
          ) : (
            t.loginForm.signIn
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          className="h-11 w-full rounded-lg border-slate-200 bg-white"
          onClick={() => {
            void enterWithoutPassword();
          }}
        >
          {guestButtonLabel}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
