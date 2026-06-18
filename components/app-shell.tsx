"use client";

import Link from "next/link";
import {
  BarChart3,
  BrainCircuit,
  Boxes,
  ClipboardCheck,
  Lightbulb,
  LogOut,
  MessageSquareWarning,
  PackageSearch,
  Radar,
  Settings2,
} from "lucide-react";
import { LocaleProvider, useLocale } from "@/components/locale-provider";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Badge } from "@/components/ui/badge";

const navigationCopy = {
  zh: {
    title: "Coupang 选品 ERP",
    subtitle: "用 AI 管理测试商品、评论问题、开发建议、Perplexity 情报和运营决策。",
    signOut: "退出登录",
    provider: "AI Provider",
    items: [
      { href: "/", label: "商品测试数据库", icon: PackageSearch },
      { href: "/products/new", label: "新增测试商品", icon: BarChart3 },
      { href: "/reviews", label: "评论问题分析", icon: MessageSquareWarning },
      { href: "/development", label: "产品开发建议", icon: Lightbulb },
      { href: "/decisions", label: "AI 决策中心", icon: ClipboardCheck },
      { href: "/perplexity", label: "Perplexity Intelligence", icon: BrainCircuit },
      { href: "/actions", label: "执行动作清单", icon: Radar },
    ],
  },
  ko: {
    title: "Coupang 상품 ERP",
    subtitle: "AI로 테스트 상품, 리뷰 이슈, 개발 제안, Perplexity 인텔리전스와 운영 의사결정을 함께 관리합니다.",
    signOut: "로그아웃",
    provider: "AI Provider",
    items: [
      { href: "/", label: "상품 테스트 데이터베이스", icon: PackageSearch },
      { href: "/products/new", label: "테스트 상품 추가", icon: BarChart3 },
      { href: "/reviews", label: "리뷰 문제 분석", icon: MessageSquareWarning },
      { href: "/development", label: "상품 개발 제안", icon: Lightbulb },
      { href: "/decisions", label: "AI 의사결정 센터", icon: ClipboardCheck },
      { href: "/perplexity", label: "Perplexity Intelligence", icon: BrainCircuit },
      { href: "/actions", label: "실행 액션 목록", icon: Radar },
    ],
  },
} as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      <AppShellContent>{children}</AppShellContent>
    </LocaleProvider>
  );
}

function AppShellContent({ children }: { children: React.ReactNode }) {
  const { locale } = useLocale();
  const copy = navigationCopy[locale];

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-30 border-b bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Boxes className="h-5 w-5" />
            {copy.title}
          </div>
          <div className="flex items-center gap-2">
            <LocaleSwitcher />
            <a
              href="/api/auth/signout"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border text-muted-foreground"
              aria-label={copy.signOut}
            >
              <LogOut className="h-4 w-4" />
            </a>
          </div>
        </div>
        <nav className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {copy.items.map((item) => (
            <Link key={item.href} href={item.href} className="inline-flex shrink-0 items-center gap-2 rounded-md border px-3 py-2 text-xs text-muted-foreground">
              <item.icon className="h-3.5 w-3.5" />
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <aside className="fixed left-0 top-0 hidden h-screen w-72 border-r bg-white px-4 py-5 lg:block">
        <div className="mb-8 px-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Boxes className="h-5 w-5" />
              {copy.title}
            </div>
            <LocaleSwitcher />
          </div>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">{copy.subtitle}</p>
        </div>
        <nav className="space-y-1">
          {copy.items.map((item) => (
            <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-5 left-4 right-4 rounded-lg border p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Settings2 className="h-4 w-4" />
            {copy.provider}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {["OpenAI", "Claude", "Gemini", "Perplexity", "Grok"].map((item) => (
              <Badge key={item}>{item}</Badge>
            ))}
          </div>
          <a href="/api/auth/signout" className="mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
            <LogOut className="h-4 w-4" />
            {copy.signOut}
          </a>
        </div>
      </aside>
      <main className="lg:pl-72">{children}</main>
    </div>
  );
}
