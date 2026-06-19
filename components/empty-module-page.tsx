"use client";

import { Boxes } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { useLocale } from "@/components/locale-provider";
import { PageHeader } from "@/components/page-header";
import { getDictionary } from "@/lib/i18n";

export function EmptyModulePage({
  bullets,
  pageKey,
}: {
  bullets: string[];
  pageKey: "opportunities" | "competitors" | "pricing" | "risks" | "rocketGrowth" | "pb";
}) {
  const { locale } = useLocale();
  const t = getDictionary(locale);
  const page = t.pages[pageKey];

  return (
    <>
      <PageHeader eyebrow={page.eyebrow} title={page.title} description={page.description} />
      <div className="w-full px-5 py-8 sm:px-8 lg:px-10 2xl:px-12">
        <EmptyState
          icon={<Boxes className="h-6 w-6" />}
          title={t.pages.dashboard.emptyTitle}
          description={`${t.pages.dashboard.emptyDescription}${bullets.length ? ` ${bullets.join(" ")}` : ""}`}
          primaryLabel={t.common.addProduct}
          primaryHref="/products/new"
        />
      </div>
    </>
  );
}
