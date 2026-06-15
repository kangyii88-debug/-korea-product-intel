"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const platforms = ["Coupang", "Naver Shopping", "오늘의집", "11번가", "Gmarket", "AliExpress Korea"];

export function ProductEntryForm() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(formData: FormData) {
    setLoading(true);
    setMessage("");

    const payload = Object.fromEntries(formData.entries());
    const response = await fetch("/api/products", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      setMessage("保存失败，请检查字段或 Supabase 配置。");
      setLoading(false);
      return;
    }

    setMessage("商品已保存，可以继续生成 AI 报告。");
    router.refresh();
    setLoading(false);
  }

  return (
    <form action={submit} className="grid gap-4 lg:grid-cols-2">
      <Field name="name" label="商品名称" required />
      <label className="text-sm font-medium">
        平台
        <select name="platform" className="mt-2 h-10 w-full rounded-md border bg-white px-3 text-sm">
          {platforms.map((platform) => (
            <option key={platform}>{platform}</option>
          ))}
        </select>
      </label>
      <Field name="url" label="商品链接" required />
      <Field name="image" label="图片 URL" />
      <Field name="brand" label="品牌" />
      <Field name="category" label="类目" />
      <Field name="price" label="价格" type="number" />
      <Field name="discountPrice" label="折扣价" type="number" />
      <Field name="estimatedMonthlySales" label="预计月销量" type="number" />
      <Field name="reviewCount" label="评论数" type="number" />
      <Field name="rating" label="评分" type="number" step="0.1" />
      <Field name="rank" label="排名" type="number" />
      <Field name="favorites" label="收藏数" type="number" />
      <Field name="deliveryType" label="配送方式" />
      <Field name="sellerType" label="卖家类型" />
      <Field name="size" label="尺寸" />
      <Field name="colors" label="颜色，逗号分隔" />
      <Field name="material" label="材质" />
      <Field name="weight" label="重量" />
      <Field name="packageSize" label="包装尺寸" />
      <TextArea name="sellingPoints" label="主要卖点，一行一个" />
      <TextArea name="keywords" label="关键词，一行一个" />
      <div className="lg:col-span-2">
        {message ? <p className="mb-3 rounded-md border bg-muted p-3 text-sm">{message}</p> : null}
        <Button disabled={loading}>{loading ? "保存中..." : "保存商品"}</Button>
      </div>
    </form>
  );
}

function Field({
  name,
  label,
  type = "text",
  required = false,
  step,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  step?: string;
}) {
  return (
    <label className="text-sm font-medium">
      {label}
      <input
        name={name}
        type={type}
        required={required}
        step={step}
        className="mt-2 h-10 w-full rounded-md border px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
    </label>
  );
}

function TextArea({ name, label }: { name: string; label: string }) {
  return (
    <label className="text-sm font-medium lg:col-span-2">
      {label}
      <textarea
        name={name}
        rows={4}
        className="mt-2 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
    </label>
  );
}
