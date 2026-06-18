import Link from "next/link";
import { Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function EmptyState({
  title,
  description,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
  icon,
}: {
  title: string;
  description: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  icon?: React.ReactNode;
}) {
  return (
    <Card className="mx-auto max-w-3xl">
      <CardContent className="flex flex-col items-center px-6 py-12 text-center sm:px-10 sm:py-16">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-500">
          {icon ?? <Inbox className="h-6 w-6" />}
        </div>
        <h2 className="mt-5 text-xl font-semibold tracking-[-0.02em] text-slate-950">{title}</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">{description}</p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link href={primaryHref}>
            <Button>{primaryLabel}</Button>
          </Link>
          {secondaryLabel && secondaryHref ? (
            <Link href={secondaryHref}>
              <Button variant="outline">{secondaryLabel}</Button>
            </Link>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
