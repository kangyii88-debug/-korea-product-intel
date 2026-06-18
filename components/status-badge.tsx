import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function StatusBadge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
}) {
  return (
    <Badge
      className={cn(
        "rounded-full px-2.5 py-1",
        tone === "neutral" && "border-slate-200 bg-slate-50 text-slate-600",
        tone === "success" && "border-emerald-200 bg-emerald-50 text-emerald-700",
        tone === "warning" && "border-amber-200 bg-amber-50 text-amber-700",
        tone === "danger" && "border-rose-200 bg-rose-50 text-rose-700",
        tone === "info" && "border-sky-200 bg-sky-50 text-sky-700",
      )}
    >
      {children}
    </Badge>
  );
}
