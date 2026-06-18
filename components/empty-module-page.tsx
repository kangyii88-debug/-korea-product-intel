import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function EmptyModulePage({
  eyebrow,
  title,
  description,
  bullets,
}: {
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
}) {
  return (
    <AppShell>
      <PageHeader eyebrow={eyebrow} title={title} description={description} />
      <div className="mx-auto max-w-7xl space-y-6 px-5 py-6 sm:px-8">
        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold">当前还没有业务数据</h2>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
            <p>
              请先添加第一个 Coupang 商品机会，系统才会开始生成这一模块的数据。
            </p>
            {bullets.map((item) => (
              <p key={item}>- {item}</p>
            ))}
            <div className="pt-2">
              <Link href="/products/new">
                <Button>添加第一个商品机会</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
