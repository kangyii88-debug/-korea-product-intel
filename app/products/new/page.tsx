import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { ProductEntryForm } from "@/components/product-entry-form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function NewProductPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Cloud Data Entry"
        title="新增商品"
        description="通过浏览器录入商品数据。配置 Supabase 后，商品、来源和指标会保存到云端数据库。"
      />
      <div className="mx-auto max-w-5xl px-5 py-6 sm:px-8">
        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold">商品基础信息</h2>
          </CardHeader>
          <CardContent>
            <ProductEntryForm />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
