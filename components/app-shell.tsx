"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BrainCircuit,
  Boxes,
  ClipboardCheck,
  FlaskConical,
  Lightbulb,
  LogOut,
  PackageSearch,
  Radar,
  SearchCheck,
  TrendingUp,
} from "lucide-react";
import { AIProviderCard } from "@/components/ai-provider-card";
import { LanguageToggle } from "@/components/language-toggle";
import { useLocale } from "@/components/locale-provider";
import { getDictionary } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

export function AppShell({ children }: { children: React.ReactNode }) {
  return <AppShellContent>{children}</AppShellContent>;
}

function AppShellContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { locale } = useLocale();
  const t = getDictionary(locale);
  const shellCopy =
    locale === "ko"
      ? {
          title: "선정정보 클라우드",
          subtitle: "장기 운영형 한국 전자상거래 상품 정보 작업대",
          intelligence: "정보 영역",
          workspace: "작업 영역",
        }
      : {
          title: "选品情报云",
          subtitle: "独立运营的韩国电商选品与情报工作台",
          intelligence: "情报模块",
          workspace: "工作区",
        };

  const groups: Array<{ label: string; items: NavItem[] }> = [
    {
      label: shellCopy.intelligence,
      items: [
        { href: "/", label: t.nav.items.dashboard, icon: TrendingUp },
        { href: "/opportunities", label: t.nav.items.opportunities, icon: PackageSearch },
        { href: "/competitors", label: t.nav.items.competitors, icon: SearchCheck },
      ],
    },
    {
      label: shellCopy.workspace,
      items: [
        { href: "/reviews", label: t.nav.items.reviews, icon: BrainCircuit },
        { href: "/pricing-profit", label: t.nav.items.pricing, icon: ClipboardCheck },
        { href: "/risk-logistics", label: t.nav.items.risks, icon: Radar },
        { href: "/testing-db", label: t.nav.items.testingDb, icon: FlaskConical },
        { href: "/development", label: t.nav.items.development, icon: Lightbulb },
        { href: "/rocket-growth", label: t.nav.items.rocketGrowth, icon: BarChart3 },
        { href: "/pb", label: t.nav.items.pb, icon: Boxes },
        { href: "/decisions", label: t.nav.items.decisions, icon: ClipboardCheck },
        { href: "/perplexity", label: t.nav.items.perplexity, icon: BrainCircuit },
        { href: "/actions", label: t.nav.items.actions, icon: Radar },
      ],
    },
  ];

  const mobileItems = groups.flatMap((group) => group.items);

  return (
    <div className="min-h-screen bg-[#f7f8fa] text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-[#f7f8fa]/95 backdrop-blur lg:hidden">
        <div className="px-4 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold tracking-[-0.02em] text-slate-950">{shellCopy.title}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{shellCopy.subtitle}</p>
            </div>
            <LanguageToggle />
          </div>
          <nav className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {mobileItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-colors",
                  pathname === item.href
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                )}
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <aside className="fixed left-0 top-0 hidden h-screen w-[296px] border-r border-slate-200 bg-[#fafafa] px-4 py-5 lg:block">
        <div className="flex h-full flex-col">
          <div className="rounded-[20px] border border-slate-200 bg-white px-4 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
            <div className="flex flex-col gap-4">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white">
                  <Boxes className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold tracking-[-0.02em] text-slate-950">{shellCopy.title}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{shellCopy.subtitle}</p>
                </div>
              </div>
              <div className="flex justify-end">
                <LanguageToggle />
              </div>
            </div>
          </div>

          <div className="mt-6 flex-1 overflow-y-auto pr-1">
            {groups.map((group) => (
              <div key={group.label} className="mb-6">
                <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  {group.label}
                </p>
                <nav className="mt-3 space-y-1.5">
                  {group.items.map((item) => {
                    const active = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        title={item.label}
                        className={cn(
                          "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors",
                          active ? "bg-slate-100 text-slate-950" : "text-slate-600 hover:bg-white hover:text-slate-950",
                        )}
                      >
                        <item.icon className={cn("h-4 w-4 shrink-0", active ? "text-slate-950" : "text-slate-400")} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>

          <div className="space-y-3 pt-4">
            <AIProviderCard />
            <a
              href="/api/auth/signout"
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-950"
            >
              <LogOut className="h-4 w-4" />
              {t.common.signOut}
            </a>
          </div>
        </div>
      </aside>

      <main className="lg:pl-[296px]">
        <div className="min-h-screen">{children}</div>
      </main>
    </div>
  );
}
