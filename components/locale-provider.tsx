"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type AppLocale = "zh" | "ko";

type LocaleContextValue = {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
};

const STORAGE_KEY = "korea-ecommerce-locale";

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<AppLocale>("zh");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "zh" || saved === "ko") {
      setLocale(saved);
      return;
    }

    const browserLocale = window.navigator.language.toLowerCase();
    setLocale(browserLocale.startsWith("ko") ? "ko" : "zh");
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, locale);
    document.documentElement.lang = locale === "ko" ? "ko-KR" : "zh-CN";
  }, [locale]);

  const value = useMemo(() => ({ locale, setLocale }), [locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return context;
}
