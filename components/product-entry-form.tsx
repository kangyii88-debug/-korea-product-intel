"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { buildProductFromForm, LOCAL_PRODUCTS_KEY, platformOptions, type LocalProduct } from "@/lib/local-products";

const copy = {
  zh: {
    sectionTitle: "基础信息",
    sectionDescription: "请填写测试商品的核心信息，保存后会写入本地数据库并进入详情页。",
    success: "测试商品已保存，正在打开详情页面。",
    submitIdle: "保存测试商品",
    submitLoading: "保存中...",
    fields: {
      name: "产品名称",
      platform: "平台",
      url: "产品链接",
      image: "产品图片 URL",
      brand: "品牌",
      category: "类目",
      price: "售价 KRW",
      discountPrice: "活动价 KRW",
      estimatedMonthlySales: "预计月销量",
      reviewCount: "评论数",
      rating: "评分",
      rank: "类目排名",
      deliveryType: "配送方式",
      sellerType: "卖家类型",
      size: "尺寸",
      colors: "颜色",
      material: "材质",
      weight: "重量",
      packageSize: "包装尺寸",
      sellingPoints: "核心卖点",
      keywords: "关键词",
      reviews: "评论/差评文本",
    },
    placeholders: {
      name: "例：半遮光蜂巢帘 90x180cm 米白",
      url: "填写 Coupang / Naver 商品链接",
      image: "可选，填写图片地址",
      category: "例：蜂巢帘 / 卷帘 / 收纳 / 厨房用品",
      rating: "例如 4.6",
      rank: "填写类目排名",
      deliveryType: "例如 Rocket Delivery",
      sellerType: "例如 品牌旗舰 / 工厂直销",
      size: "例如 60x150cm, 90x180cm",
      colors: "例如 米白, 灰色, 黑色",
      material: "例如 无纺布 / 铝合金 / 涤纶",
      weight: "例如 1.1kg",
      packageSize: "例如 95 x 8 x 8cm",
      sellingPoints: "每行一个卖点，或用逗号分隔",
      keywords: "例如 蜂巢帘, 블라인드, 窗帘",
      reviews: "粘贴韩文或中文评论，一行一条，系统会识别尺寸、安装、颜色、包装、质量等问题。",
    },
  },
  ko: {
    sectionTitle: "기본 정보",
    sectionDescription: "테스트 상품의 핵심 정보를 입력하면 로컬 데이터베이스에 저장되고 상세 페이지로 이동합니다.",
    success: "테스트 상품이 저장되었습니다. 상세 페이지를 여는 중입니다.",
    submitIdle: "테스트 상품 저장",
    submitLoading: "저장 중...",
    fields: {
      name: "상품명",
      platform: "플랫폼",
      url: "상품 링크",
      image: "상품 이미지 URL",
      brand: "브랜드",
      category: "카테고리",
      price: "판매가 KRW",
      discountPrice: "할인가 KRW",
      estimatedMonthlySales: "예상 월판매량",
      reviewCount: "리뷰 수",
      rating: "평점",
      rank: "카테고리 순위",
      deliveryType: "배송 방식",
      sellerType: "판매자 유형",
      size: "사이즈",
      colors: "색상",
      material: "소재",
      weight: "무게",
      packageSize: "포장 크기",
      sellingPoints: "핵심 판매 포인트",
      keywords: "키워드",
      reviews: "리뷰/불만 텍스트",
    },
    placeholders: {
      name: "예: 반차광 허니콤 블라인드 90x180cm 아이보리",
      url: "Coupang / Naver 상품 링크를 입력하세요",
      image: "선택 사항, 이미지 URL 입력",
      category: "예: 허니콤 블라인드 / 롤스크린 / 수납 / 주방용품",
      rating: "예: 4.6",
      rank: "카테고리 순위를 입력하세요",
      deliveryType: "예: Rocket Delivery",
      sellerType: "예: 브랜드 공식몰 / 공장 직판",
      size: "예: 60x150cm, 90x180cm",
      colors: "예: 아이보리, 그레이, 블랙",
      material: "예: 부직포 / 알루미늄 / 폴리에스터",
      weight: "예: 1.1kg",
      packageSize: "예: 95 x 8 x 8cm",
      sellingPoints: "한 줄에 하나씩 입력하거나 쉼표로 구분하세요",
      keywords: "예: 허니콤 블라인드, 반차광, 커튼",
      reviews: "한국어 또는 중국어 리뷰를 한 줄씩 붙여 넣으면 사이즈, 설치, 색상, 포장, 품질 문제를 분석합니다.",
    },
  },
} as const;

export function ProductEntryForm() {
  const router = useRouter();
  const { locale } = useLocale();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const t = copy[locale];

  function submit(formData: FormData) {
    setLoading(true);
    setMessage("");

    const product = buildProductFromForm(Object.fromEntries(formData.entries()));
    const raw = window.localStorage.getItem(LOCAL_PRODUCTS_KEY);
    const products: LocalProduct[] = raw ? JSON.parse(raw) : [];
    const nextProducts = [product, ...products];
    window.localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(nextProducts));

    setMessage(t.success);
    router.push(`/reports/${product.id}`);
  }

  return (
    <form action={submit} className="space-y-6 rounded-xl border bg-white p-6">
      <div>
        <h2 className="text-base font-semibold">{t.sectionTitle}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t.sectionDescription}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Field name="name" label={t.fields.name} required placeholder={t.placeholders.name} />
        <label className="text-sm font-medium">
          {t.fields.platform}
          <select name="platform" className="mt-2 h-10 w-full rounded-md border bg-white px-3 text-sm">
            {platformOptions.map((platform) => (
              <option key={platform}>{platform}</option>
            ))}
          </select>
        </label>
        <Field name="url" label={t.fields.url} required placeholder={t.placeholders.url} />
        <Field name="image" label={t.fields.image} placeholder={t.placeholders.image} />
        <Field name="brand" label={t.fields.brand} />
        <Field name="category" label={t.fields.category} placeholder={t.placeholders.category} />
        <Field name="price" label={t.fields.price} type="number" />
        <Field name="discountPrice" label={t.fields.discountPrice} type="number" />
        <Field name="estimatedMonthlySales" label={t.fields.estimatedMonthlySales} type="number" />
        <Field name="reviewCount" label={t.fields.reviewCount} type="number" />
        <Field name="rating" label={t.fields.rating} type="number" step="0.1" placeholder={t.placeholders.rating} />
        <Field name="rank" label={t.fields.rank} type="number" placeholder={t.placeholders.rank} />
        <Field name="deliveryType" label={t.fields.deliveryType} placeholder={t.placeholders.deliveryType} />
        <Field name="sellerType" label={t.fields.sellerType} placeholder={t.placeholders.sellerType} />
        <Field name="size" label={t.fields.size} placeholder={t.placeholders.size} />
        <Field name="colors" label={t.fields.colors} placeholder={t.placeholders.colors} />
        <Field name="material" label={t.fields.material} placeholder={t.placeholders.material} />
        <Field name="weight" label={t.fields.weight} placeholder={t.placeholders.weight} />
        <Field name="packageSize" label={t.fields.packageSize} placeholder={t.placeholders.packageSize} />
        <TextArea name="sellingPoints" label={t.fields.sellingPoints} placeholder={t.placeholders.sellingPoints} />
        <TextArea name="keywords" label={t.fields.keywords} placeholder={t.placeholders.keywords} />
        <TextArea name="reviews" label={t.fields.reviews} placeholder={t.placeholders.reviews} />
      </div>

      {message ? <p className="rounded-md border bg-muted p-3 text-sm">{message}</p> : null}
      <div className="flex justify-end">
        <Button disabled={loading}>{loading ? t.submitLoading : t.submitIdle}</Button>
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
  placeholder,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  step?: string;
  placeholder?: string;
}) {
  return (
    <label className="text-sm font-medium">
      {label}
      <input
        name={name}
        type={type}
        required={required}
        step={step}
        placeholder={placeholder}
        className="mt-2 h-10 w-full rounded-md border px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
    </label>
  );
}

function TextArea({ name, label, placeholder }: { name: string; label: string; placeholder?: string }) {
  return (
    <label className="text-sm font-medium lg:col-span-2">
      {label}
      <textarea
        name={name}
        rows={4}
        placeholder={placeholder}
        className="mt-2 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
    </label>
  );
}
