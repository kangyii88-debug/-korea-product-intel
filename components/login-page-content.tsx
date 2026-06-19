"use client";

import { BarChart3, Boxes, CheckCircle2, Sparkles } from "lucide-react";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { useLocale } from "@/components/locale-provider";
import { getDictionary } from "@/lib/i18n";

export function LoginPageContent({
  supabaseUrl,
  supabaseAnonKey,
}: {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
}) {
  const { locale } = useLocale();
  const t = getDictionary(locale);
  const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);
  const brandName = locale === "ko" ? "선정정보 클라우드" : "选品情报云";
  const accessTitle = locale === "ko" ? "독立 운영 전용 진입" : "独立运营专用入口";

  return (
    <main className="min-h-screen bg-white text-foreground">
      <div className="mx-auto grid min-h-screen w-full max-w-6xl items-center gap-10 px-6 py-10 lg:grid-cols-[1fr_440px] lg:px-8">
        <section className="hidden max-w-2xl lg:block">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
              <Boxes className="h-5 w-5 text-slate-900" />
            </div>
            <div>
              <p className="text-base font-semibold tracking-tight text-slate-950">{brandName}</p>
              <p className="text-sm text-slate-500">{t.pages.login.subtitle}</p>
            </div>
          </div>

          <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-slate-950">{t.pages.login.heroTitle}</h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">{t.pages.login.heroDescription}</p>

          <div className="mt-10 grid max-w-xl gap-3">
            {[
              { icon: BarChart3, title: t.pages.login.features[0].title, text: t.pages.login.features[0].text },
              { icon: Sparkles, title: t.pages.login.features[1].title, text: t.pages.login.features[1].text },
              { icon: CheckCircle2, title: t.pages.login.features[2].title, text: t.pages.login.features[2].text },
            ].map((item) => (
              <div key={item.title} className="flex gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50">
                  <item.icon className="h-4 w-4 text-slate-800" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-950">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-[440px]">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
              <Boxes className="h-5 w-5 text-slate-900" />
            </div>
            <div>
              <p className="text-base font-semibold tracking-tight text-slate-950">{brandName}</p>
              <p className="text-sm text-slate-500">{t.pages.login.subtitle}</p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-7 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
            <div className="mb-7">
              <p className="text-sm font-medium text-emerald-700">{accessTitle}</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{t.pages.login.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">{t.pages.login.accessDescription}</p>
            </div>

            {!hasSupabaseConfig ? (
              <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {t.pages.login.noSupabase}
              </div>
            ) : null}

            <Suspense>
              <LoginForm supabaseUrl={supabaseUrl} supabaseAnonKey={supabaseAnonKey} />
            </Suspense>
          </div>

          <p className="mt-5 text-center text-xs text-slate-400">{brandName}</p>
        </section>
      </div>
    </main>
  );
}
