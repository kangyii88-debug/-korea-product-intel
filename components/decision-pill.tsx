import { getDirectionTone } from "@/lib/business-positioning";
import type { RecommendationDirection } from "@/lib/local-products";

export function DecisionPill({ decision }: { decision: RecommendationDirection }) {
  return (
    <span className={`inline-flex items-center rounded-md border px-2.5 py-1 text-sm font-semibold ${getDirectionTone(decision)}`}>
      {decision}
    </span>
  );
}
