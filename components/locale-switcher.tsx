"use client";

import { useLocale } from "@/components/locale-provider";

export function LocaleSwitcher() {
  const { locale, setLocale } = useLocale();

  return (
    <div className="inline-flex rounded-md border bg-white p-1">
      <button
        type="button"
        onClick={() => setLocale("zh")}
        className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
          locale === "zh" ? "bg-slate-900 text-white" : "text-muted-foreground hover:bg-muted"
        }`}
      >
        中文
      </button>
      <button
        type="button"
        onClick={() => setLocale("ko")}
        className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
          locale === "ko" ? "bg-slate-900 text-white" : "text-muted-foreground hover:bg-muted"
        }`}
      >
        한국어
      </button>
    </div>
  );
}
