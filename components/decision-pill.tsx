import type { Decision } from "@/lib/types";

const tone: Record<Decision, string> = {
  强烈建议开发: "border-emerald-200 bg-emerald-50 text-emerald-700",
  可以测试: "border-sky-200 bg-sky-50 text-sky-700",
  继续观察: "border-amber-200 bg-amber-50 text-amber-700",
  不建议开发: "border-red-200 bg-red-50 text-red-700",
};

export function DecisionPill({ decision }: { decision: Decision }) {
  return (
    <span className={`inline-flex items-center rounded-md border px-2.5 py-1 text-sm font-semibold ${tone[decision]}`}>
      {decision}
    </span>
  );
}
