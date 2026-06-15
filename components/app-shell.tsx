import Link from "next/link";
import {
  BarChart3,
  Boxes,
  ClipboardCheck,
  LogOut,
  Lightbulb,
  MessageSquareWarning,
  PackageSearch,
  Radar,
  Settings2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const navigation = [
  { href: "/", label: "爆款产品采集库", icon: PackageSearch },
  { href: "/reports/coupang-folding-cart", label: "单品 AI 情报报告", icon: BarChart3 },
  { href: "/reviews", label: "评论差评分析中心", icon: MessageSquareWarning },
  { href: "/development", label: "产品开发建议中心", icon: Lightbulb },
  { href: "/decisions", label: "AI 选品决策中心", icon: ClipboardCheck },
  { href: "/actions", label: "行动中心", icon: Radar },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-30 border-b bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Boxes className="h-5 w-5" />
            Korea Product Intel
          </div>
          <a
            href="/api/auth/signout"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border text-muted-foreground"
            aria-label="退出登录"
          >
            <LogOut className="h-4 w-4" />
          </a>
        </div>
        <nav className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="inline-flex shrink-0 items-center gap-2 rounded-md border px-3 py-2 text-xs text-muted-foreground"
            >
              <item.icon className="h-3.5 w-3.5" />
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <aside className="fixed left-0 top-0 hidden h-screen w-72 border-r bg-white px-4 py-5 lg:block">
        <div className="mb-8 px-2">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Boxes className="h-5 w-5" />
            Korea Product Intel
          </div>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            韩国电商 AI 选品开发情报系统
          </p>
        </div>
        <nav className="space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-5 left-4 right-4 rounded-lg border p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Settings2 className="h-4 w-4" />
            AI Provider
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {["OpenAI", "Claude", "Gemini", "Perplexity", "Grok"].map((item) => (
              <Badge key={item}>{item}</Badge>
            ))}
          </div>
          <a
            href="/api/auth/signout"
            className="mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            退出登录
          </a>
        </div>
      </aside>
      <main className="lg:pl-72">{children}</main>
    </div>
  );
}
