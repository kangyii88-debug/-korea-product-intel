import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  note,
  tone = "default",
}: {
  label: string;
  value: string;
  note: string;
  tone?: "default" | "good" | "warn";
}) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-2 text-2xl font-semibold tracking-tight",
          tone === "good" && "text-emerald-700",
          tone === "warn" && "text-amber-700",
        )}
      >
        {value}
      </p>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{note}</p>
    </div>
  );
}
