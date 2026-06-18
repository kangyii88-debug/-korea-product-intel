"use client";

import { Sparkles } from "lucide-react";
import { useLocale } from "@/components/locale-provider";
import { getDictionary } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";

export function AIProviderCard() {
  const { locale } = useLocale();
  const t = getDictionary(locale);

  return (
    <div className="rounded-[18px] border border-slate-200 bg-slate-50/90 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
        <Sparkles className="h-4 w-4 text-slate-500" />
        {t.common.provider}
      </div>
      <p className="mt-2 text-xs leading-5 text-slate-500">{t.nav.providerDescription}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {["OpenAI", "Claude", "Gemini", "Perplexity", "Grok"].map((item) => (
          <Badge key={item} className="bg-white">
            {item}
          </Badge>
        ))}
      </div>
    </div>
  );
}
