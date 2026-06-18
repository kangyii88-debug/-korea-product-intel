"use client";

import { useLocale } from "@/components/locale-provider";

export function LanguageToggle() {
  const { locale, setLocale } = useLocale();

  return (
    <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white p-1 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <button
        type="button"
        onClick={() => setLocale("zh")}
        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
          locale === "zh" ? "bg-slate-950 text-white" : "text-slate-500 hover:bg-slate-50"
        }`}
      >
        中文
      </button>
      <button
        type="button"
        onClick={() => setLocale("ko")}
        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
          locale === "ko" ? "bg-slate-950 text-white" : "text-slate-500 hover:bg-slate-50"
        }`}
      >
        한국어
      </button>
    </div>
  );
}
