"use client";

import { useLocale } from "@/components/locale-provider";
import { getDirectionTone } from "@/lib/business-positioning";
import type { RecommendationDirection } from "@/lib/local-products";
import { getDirectionLabel } from "@/lib/presentation";

export function DecisionPill({ decision }: { decision: RecommendationDirection }) {
  const { locale } = useLocale();

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold tracking-tight ${getDirectionTone(decision)}`}
    >
      {getDirectionLabel(decision, locale)}
    </span>
  );
}
