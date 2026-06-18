import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  note,
  tone = "default",
  icon,
}: {
  label: string;
  value: string | number;
  note: string;
  tone?: "default" | "success" | "warning" | "danger";
  icon?: React.ReactNode;
}) {
  return (
    <Card className="h-full">
      <CardContent className="flex h-full flex-col justify-between gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          {icon ? <div className="text-slate-400">{icon}</div> : null}
        </div>
        <div>
          <p
            className={cn(
              "text-[30px] font-semibold tracking-[-0.03em] text-slate-950",
              tone === "success" && "text-emerald-700",
              tone === "warning" && "text-amber-700",
              tone === "danger" && "text-rose-700",
            )}
          >
            {value}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-500">{note}</p>
        </div>
      </CardContent>
    </Card>
  );
}
