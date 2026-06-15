import { Suspense } from "react";
import { BarChart3, Boxes, CheckCircle2, Sparkles } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";
import { getPublicEnv } from "@/lib/env";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function LoginPage() {
  const { supabaseUrl, supabaseAnonKey } = getPublicEnv();
  const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

  return (
    <main className="min-h-screen bg-white text-foreground">
      <div className="mx-auto grid min-h-screen w-full max-w-6xl items-center gap-10 px-6 py-10 lg:grid-cols-[1fr_440px] lg:px-8">
        <section className="hidden max-w-2xl lg:block">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
              <Boxes className="h-5 w-5 text-slate-900" />
            </div>
            <div>
              <p className="text-base font-semibold tracking-tight text-slate-950">Korea Product Intel</p>
              <p className="text-sm text-slate-500">韩国电商 AI 选品开发情报系统</p>
            </div>
          </div>

          <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-slate-950">
            把韩国电商数据变成可执行的选品决策。
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
            聚合商品、评论、差评、利润和风险信号，帮助你判断产品能不能做、为什么能做、应该怎么做。
          </p>

          <div className="mt-10 grid max-w-xl gap-3">
            {[
              { icon: BarChart3, title: "机会优先", text: "先看增长、利润、竞争和差评优化空间。" },
              { icon: Sparkles, title: "AI 报告", text: "单品分析、评论归因、开发建议和决策评分。" },
              { icon: CheckCircle2, title: "行动导向", text: "输出做不做、卖多少、采多少和风险等级。" },
            ].map((item) => (
              <div key={item.title} className="flex gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50">
                  <item.icon className="h-4 w-4 text-slate-800" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-950">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-[440px]">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
              <Boxes className="h-5 w-5 text-slate-900" />
            </div>
            <div>
              <p className="text-base font-semibold tracking-tight text-slate-950">Korea Product Intel</p>
              <p className="text-sm text-slate-500">韩国电商 AI 选品开发情报系统</p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-7 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
            <div className="mb-7">
              <p className="text-sm font-medium text-emerald-700">Web SaaS Access</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">登录系统</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                进入韩国电商 AI 情报中枢，查看产品库、AI 报告和机会排行榜。
              </p>
            </div>

            {!hasSupabaseConfig ? (
              <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Supabase 环境变量未配置，正式登录暂不可用。你仍可使用免密码预览入口。
              </div>
            ) : null}

            <Suspense>
              <LoginForm supabaseUrl={supabaseUrl} supabaseAnonKey={supabaseAnonKey} />
            </Suspense>
          </div>

          <p className="mt-5 text-center text-xs text-slate-400">
            Protected cloud workspace for product intelligence.
          </p>
        </section>
      </div>
    </main>
  );
}
