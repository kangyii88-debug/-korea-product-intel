"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { buildProductFromForm, saveLocalProducts, loadLocalProducts, platformOptions, type LocalProduct } from "@/lib/local-products";

const copy = {
  zh: {
    sectionTitle: "新增测试商品",
    sectionDescription: "录入基础信息、利润、风险和开发判断字段。中文模式全部显示中文，韩文模式全部显示韩文。",
    success: "测试商品已创建，正在跳转到详情页。",
    submitIdle: "创建测试商品",
    submitLoading: "创建中...",
    groups: {
      basic: "基础信息",
      market: "市场与利润",
      development: "开发判断",
      risk: "风险红线",
    },
    fields: {
      productNameKo: "商品名称韩文",
      productNameZh: "商品名称中文",
      platform: "平台",
      competitorUrl: "Coupang 竞品链接",
      image: "商品图片 URL",
      brand: "品牌",
      category: "类目",
      owner: "负责人",
      supplierQuoteCount: "供应商报价数",
      supplierNames: "供应商名称",
      competitorSalePriceKrw: "竞品售价 KRW",
      targetSupplyPriceKrw: "目标供货价 KRW",
      chinaCostRmb: "中国预估成本 RMB",
      internationalShippingKrw: "国际物流 KRW",
      koreaShippingKrw: "韩国本地物流 KRW",
      coupangFeePercent: "Coupang 手续费 %",
      adCostKrw: "广告费预估 KRW",
      returnLossKrw: "退货损耗预估 KRW",
      otherCostKrw: "其他费用 KRW",
      estimatedMonthlySales: "预计月销",
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
      reviews: "评论 / 差评样本",
      marketAnalysis: "市场分析",
      priceRange: "价格区间",
      reviewSummary: "评论分析摘要",
      consumerPainPoints: "消费者痛点",
      productDevelopmentDirection: "产品开发方向",
      recommendationReason: "推荐理由",
      sampleDevelopmentAdvice: "样品开发建议",
      categoryGapNote: "品类机会说明",
      fileReferences: "文件资料",
      notes: "补充备注",
    },
    checks: {
      needsKcCertification: "需要 KC 认证",
      kcDocsReady: "KC 资料已齐",
      childrenProduct: "儿童用品",
      foodProduct: "食品类",
      electronicsProduct: "电器类",
      cosmeticsProduct: "化妆品类",
      medicalProduct: "医疗相关",
      fragile: "易破损",
      possibleHighReturn: "退货率可能高",
      uncertainRegulation: "韩国法规不确定",
      coupangRestricted: "Coupang 平台限制",
    },
  },
  ko: {
    sectionTitle: "테스트 상품 추가",
    sectionDescription: "기본 정보, 이익, 리스크, 개발 판단 필드를 입력합니다. 한국어 모드에서는 전체 문구가 한국어로 표시됩니다.",
    success: "테스트 상품이 생성되었습니다. 상세 페이지로 이동합니다.",
    submitIdle: "테스트 상품 생성",
    submitLoading: "생성 중...",
    groups: {
      basic: "기본 정보",
      market: "시장 및 마진",
      development: "개발 판단",
      risk: "리스크 레드라인",
    },
    fields: {
      productNameKo: "상품명 한국어",
      productNameZh: "상품명 중국어",
      platform: "플랫폼",
      competitorUrl: "Coupang 경쟁상품 링크",
      image: "상품 이미지 URL",
      brand: "브랜드",
      category: "카테고리",
      owner: "담당자",
      supplierQuoteCount: "공급사 견적 수",
      supplierNames: "공급사 명",
      competitorSalePriceKrw: "경쟁사 판매가 KRW",
      targetSupplyPriceKrw: "목표 공급가 KRW",
      chinaCostRmb: "중국 예상 원가 RMB",
      internationalShippingKrw: "국제 물류 KRW",
      koreaShippingKrw: "국내 물류 KRW",
      coupangFeePercent: "Coupang 수수료 %",
      adCostKrw: "광고비 KRW",
      returnLossKrw: "반품 손실 KRW",
      otherCostKrw: "기타 비용 KRW",
      estimatedMonthlySales: "예상 월판매",
      reviewCount: "리뷰 수",
      rating: "평점",
      rank: "카테고리 순위",
      deliveryType: "배송 방식",
      sellerType: "판매자 유형",
      size: "사이즈",
      colors: "색상",
      material: "재질",
      weight: "중량",
      packageSize: "포장 크기",
      sellingPoints: "핵심 판매 포인트",
      keywords: "키워드",
      reviews: "리뷰 / 불만 샘플",
      marketAnalysis: "시장 분석",
      priceRange: "가격대",
      reviewSummary: "리뷰 분석 요약",
      consumerPainPoints: "소비자 페인포인트",
      productDevelopmentDirection: "제품 개발 방향",
      recommendationReason: "추천 이유",
      sampleDevelopmentAdvice: "샘플 개발 제안",
      categoryGapNote: "카테고리 기회 메모",
      fileReferences: "파일 자료",
      notes: "추가 메모",
    },
    checks: {
      needsKcCertification: "KC 인증 필요",
      kcDocsReady: "KC 자료 준비 완료",
      childrenProduct: "아동용",
      foodProduct: "식품류",
      electronicsProduct: "전기/전자류",
      cosmeticsProduct: "화장품류",
      medicalProduct: "의료 관련",
      fragile: "파손 우려",
      possibleHighReturn: "반품률 우려",
      uncertainRegulation: "한국 규정 불확실",
      coupangRestricted: "Coupang 제한 품목",
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
    const products: LocalProduct[] = loadLocalProducts();
    saveLocalProducts([product, ...products]);

    setMessage(t.success);
    router.push(`/reports/${product.id}`);
  }

  return (
    <form action={submit} className="space-y-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-base font-semibold">{t.sectionTitle}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t.sectionDescription}</p>
      </div>

      <Section title={t.groups.basic}>
        <div className="grid gap-4 lg:grid-cols-2">
          <Field name="productNameKo" label={t.fields.productNameKo} required />
          <Field name="productNameZh" label={t.fields.productNameZh} required />
          <SelectField name="platform" label={t.fields.platform} options={platformOptions} />
          <Field name="competitorUrl" label={t.fields.competitorUrl} required />
          <Field name="image" label={t.fields.image} />
          <Field name="brand" label={t.fields.brand} />
          <Field name="category" label={t.fields.category} required />
          <Field name="owner" label={t.fields.owner} />
          <Field name="supplierQuoteCount" label={t.fields.supplierQuoteCount} type="number" />
          <Field name="supplierNames" label={t.fields.supplierNames} />
          <Field name="deliveryType" label={t.fields.deliveryType} />
          <Field name="sellerType" label={t.fields.sellerType} />
          <Field name="size" label={t.fields.size} />
          <Field name="colors" label={t.fields.colors} />
          <Field name="material" label={t.fields.material} />
          <Field name="weight" label={t.fields.weight} />
          <Field name="packageSize" label={t.fields.packageSize} />
        </div>
      </Section>

      <Section title={t.groups.market}>
        <div className="grid gap-4 lg:grid-cols-3">
          <Field name="competitorSalePriceKrw" label={t.fields.competitorSalePriceKrw} type="number" />
          <Field name="targetSupplyPriceKrw" label={t.fields.targetSupplyPriceKrw} type="number" />
          <Field name="chinaCostRmb" label={t.fields.chinaCostRmb} type="number" />
          <Field name="internationalShippingKrw" label={t.fields.internationalShippingKrw} type="number" />
          <Field name="koreaShippingKrw" label={t.fields.koreaShippingKrw} type="number" />
          <Field name="coupangFeePercent" label={t.fields.coupangFeePercent} type="number" step="0.1" />
          <Field name="adCostKrw" label={t.fields.adCostKrw} type="number" />
          <Field name="returnLossKrw" label={t.fields.returnLossKrw} type="number" />
          <Field name="otherCostKrw" label={t.fields.otherCostKrw} type="number" />
          <Field name="estimatedMonthlySales" label={t.fields.estimatedMonthlySales} type="number" />
          <Field name="reviewCount" label={t.fields.reviewCount} type="number" />
          <Field name="rating" label={t.fields.rating} type="number" step="0.1" />
          <Field name="rank" label={t.fields.rank} type="number" />
        </div>
      </Section>

      <Section title={t.groups.development}>
        <div className="grid gap-4 lg:grid-cols-2">
          <TextArea name="sellingPoints" label={t.fields.sellingPoints} />
          <TextArea name="keywords" label={t.fields.keywords} />
          <TextArea name="reviews" label={t.fields.reviews} />
          <TextArea name="marketAnalysis" label={t.fields.marketAnalysis} />
          <TextArea name="priceRange" label={t.fields.priceRange} />
          <TextArea name="reviewSummary" label={t.fields.reviewSummary} />
          <TextArea name="consumerPainPoints" label={t.fields.consumerPainPoints} />
          <TextArea name="productDevelopmentDirection" label={t.fields.productDevelopmentDirection} />
          <TextArea name="recommendationReason" label={t.fields.recommendationReason} />
          <TextArea name="sampleDevelopmentAdvice" label={t.fields.sampleDevelopmentAdvice} />
          <TextArea name="categoryGapNote" label={t.fields.categoryGapNote} />
          <TextArea name="fileReferences" label={t.fields.fileReferences} />
          <TextArea name="notes" label={t.fields.notes} />
        </div>
      </Section>

      <Section title={t.groups.risk}>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Object.entries(t.checks).map(([name, label]) => (
            <CheckField key={name} name={name} label={label} />
          ))}
        </div>
      </Section>

      {message ? <p className="rounded-md border bg-stone-50 p-3 text-sm">{message}</p> : null}
      <div className="flex justify-end">
        <Button disabled={loading}>{loading ? t.submitLoading : t.submitIdle}</Button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-stone-200 bg-stone-50/50 p-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
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
        className="mt-2 h-10 w-full rounded-md border border-stone-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
    </label>
  );
}

function SelectField({ name, label, options }: { name: string; label: string; options: string[] }) {
  return (
    <label className="text-sm font-medium">
      {label}
      <select name={name} className="mt-2 h-10 w-full rounded-md border border-stone-200 bg-white px-3 text-sm">
        {options.map((platform) => (
          <option key={platform}>{platform}</option>
        ))}
      </select>
    </label>
  );
}

function TextArea({ name, label }: { name: string; label: string }) {
  return (
    <label className="text-sm font-medium">
      {label}
      <textarea
        name={name}
        rows={4}
        className="mt-2 w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
    </label>
  );
}

function CheckField({ name, label }: { name: string; label: string }) {
  return (
    <label className="flex items-center gap-3 rounded-md border border-stone-200 bg-white px-3 py-3 text-sm">
      <input name={name} type="checkbox" className="h-4 w-4 rounded border-stone-300" />
      <span>{label}</span>
    </label>
  );
}
