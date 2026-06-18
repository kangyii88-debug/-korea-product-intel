"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ExternalLink, FileText, ShieldAlert } from "lucide-react";
import { DecisionPill } from "@/components/decision-pill";
import { useLocale } from "@/components/locale-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  analyzeProduct,
  getProductById,
  REJECTION_REASONS,
  updateLocalProduct,
  type LocalProduct,
  type ProductStatus,
} from "@/lib/local-products";
import { formatCurrency, formatNumber } from "@/lib/utils";

const copy = {
  zh: {
    back: "返回测试数据库",
    notFoundTitle: "没有找到这个商品",
    notFoundDescription: "这条商品记录可能已经被删除或还没有写入本地知识库。",
    openCompetitor: "打开竞品链接",
    actions: {
      transferRg: "转入 Rocket Growth 项目",
      transferPb: "转入 PB 项目",
      generateProposal: "生成产品提案",
      generateSupplierTask: "生成供应商开发任务",
      generateCompetitorReport: "生成竞品分析报告",
      markObserve: "标记为继续观察",
      markReject: "标记为淘汰",
      saveReject: "确认淘汰",
    },
    sections: {
      basic: "1. 基础信息",
      competitor: "2. 竞品信息",
      review: "3. 评论差评分析",
      profit: "4. 价格与供货利润测算",
      certification: "5. 认证风险判断",
      logistics: "6. 物流风险判断",
      supply: "7. 供应链优势判断",
      rg: "8. Rocket Growth 适合度",
      pb: "9. PB 适合度",
      ai: "10. AI 最终判断",
      next: "11. 下一步动作",
      tasks: "12. 关联任务",
      files: "13. 文件资料",
    },
    labels: {
      nameKo: "商品名称韩文",
      nameZh: "商品名称中文",
      direction: "推荐方向",
      totalScore: "商品适合度评分",
      rgScore: "RG 适合度评分",
      pbScore: "PB 适合度评分",
      risk: "风险等级",
      status: "当前状态",
      nextAction: "下一步动作",
      judgement: "判断结果",
      opportunity: "最大机会",
      biggestRisk: "最大风险",
      profitSafety: "利润安全",
      targetSupply: "建议目标供货价",
      minimumSupply: "最低可接受供货价",
      rejectionReason: "淘汰原因",
    },
    emptyFiles: "当前没有文件资料。建议补充市场截图、供应商报价单、风险材料或提案文档。",
  },
  ko: {
    back: "테스트 데이터베이스로 돌아가기",
    notFoundTitle: "상품을 찾을 수 없습니다",
    notFoundDescription: "이 상품 기록은 아직 로컬 지식库에 저장되지 않았거나 이미 정리되었을 수 있습니다.",
    openCompetitor: "경쟁상품 링크 열기",
    actions: {
      transferRg: "Rocket Growth 프로젝트로 전환",
      transferPb: "PB 프로젝트로 전환",
      generateProposal: "제품 제안서 생성",
      generateSupplierTask: "공급사 개발 작업 생성",
      generateCompetitorReport: "경쟁 분석 리포트 생성",
      markObserve: "계속 관찰로 표시",
      markReject: "탈락으로 표시",
      saveReject: "탈락 확정",
    },
    sections: {
      basic: "1. 기본 정보",
      competitor: "2. 경쟁 정보",
      review: "3. 리뷰/불만 분석",
      profit: "4. 가격 및 공급 마진 계산",
      certification: "5. 인증 리스크 판단",
      logistics: "6. 물류 리스크 판단",
      supply: "7. 공급망 우위 판단",
      rg: "8. Rocket Growth 적합도",
      pb: "9. PB 적합도",
      ai: "10. AI 최종 판단",
      next: "11. 다음 액션",
      tasks: "12. 연관 작업",
      files: "13. 파일 자료",
    },
    labels: {
      nameKo: "상품명 한국어",
      nameZh: "상품명 중국어",
      direction: "추천 방향",
      totalScore: "상품 적합도 점수",
      rgScore: "RG 적합도 점수",
      pbScore: "PB 적합도 점수",
      risk: "리스크 등급",
      status: "현재 상태",
      nextAction: "다음 액션",
      judgement: "판단 결과",
      opportunity: "최대 기회",
      biggestRisk: "최대 리스크",
      profitSafety: "마진 안전선",
      targetSupply: "권장 목표 공급가",
      minimumSupply: "최저 허용 공급가",
      rejectionReason: "탈락 사유",
    },
    emptyFiles: "등록된 파일 자료가 없습니다. 시장 스크린샷, 공급사 견적서, 리스크 문서, 제안서를 추가해 주세요.",
  },
} as const;

export function LocalReportView({ productId }: { productId: string }) {
  const { locale } = useLocale();
  const t = copy[locale];
  const [product, setProduct] = useState<LocalProduct | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [rejectReason, setRejectReason] = useState("利润太低");

  useEffect(() => {
    setProduct(getProductById(productId));
    setLoaded(true);
  }, [productId]);

  const analysis = useMemo(() => (product ? analyzeProduct(product) : null), [product]);

  if (!loaded) return null;

  if (!product || !analysis) {
    return (
      <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
        <div className="rounded-2xl border border-stone-200 bg-white p-10 text-center shadow-sm">
          <p className="text-lg font-semibold">{t.notFoundTitle}</p>
          <p className="mt-3 text-sm text-muted-foreground">{t.notFoundDescription}</p>
          <Link href="/testing-db" className="mt-6 inline-flex">
            <Button>{t.back}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const updateStatus = (status: ProductStatus) => {
    updateLocalProduct(product.id, (current) => ({
      ...current,
      status,
      rejectionReason: status === "已淘汰" ? current.rejectionReason : undefined,
    }));
    setProduct(getProductById(product.id));
    setFeedback(`状态已更新为「${status}」`);
  };

  const markRejected = () => {
    updateLocalProduct(product.id, (current) => ({
      ...current,
      status: "已淘汰",
      rejectionReason: rejectReason as LocalProduct["rejectionReason"],
    }));
    setProduct(getProductById(product.id));
    setFeedback(`商品已淘汰，原因：${rejectReason}`);
  };

  const transferTo = (target: "rg" | "pb") => {
    const check = target === "rg" ? analysis.transferCheckRg : analysis.transferCheckPb;
    const label = target === "rg" ? t.actions.transferRg : t.actions.transferPb;
    if (!check.ready) {
      setFeedback(`${label}失败，缺少：${check.missing.join("、")}`);
      return;
    }

    updateLocalProduct(product.id, (current) => ({
      ...current,
      status: "已转入 RG/PB 项目系统",
    }));
    setProduct(getProductById(product.id));
    setFeedback(`${label}检查通过，已更新为项目系统已转入状态。`);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-5 py-6 sm:px-8">
      <Link href="/testing-db" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        {t.back}
      </Link>

      {analysis.riskRedlineLevel === "高风险红线" || analysis.riskRedlineLevel === "禁止推进" ? (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-rose-800">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">{analysis.riskRedlineLevel}</p>
            <p className="mt-1 text-sm leading-6">{analysis.riskSummary}</p>
          </div>
        </div>
      ) : null}

      {feedback ? <div className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm">{feedback}</div> : null}

      <section className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <DecisionPill decision={analysis.direction} />
              <Badge>{analysis.totalJudgement}</Badge>
              <Badge>{analysis.riskRedlineLevel}</Badge>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">{t.labels.nameKo}</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">{product.productNameKo}</h2>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">{t.labels.nameZh}</p>
              <p className="mt-1 text-lg text-muted-foreground">{product.productNameZh}</p>
            </div>
            {product.competitorUrl ? (
              <a
                href={product.competitorUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm text-slate-700 underline"
              >
                {t.openCompetitor}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <TopMetric label={t.labels.direction} value={analysis.direction} note={analysis.totalJudgement} />
            <TopMetric label={t.labels.totalScore} value={`${analysis.totalScore}`} note={analysis.biggestOpportunity} />
            <TopMetric label={t.labels.rgScore} value={`${analysis.rgScore}`} note={analysis.rgJudgement} />
            <TopMetric label={t.labels.pbScore} value={`${analysis.pbScore}`} note={analysis.pbJudgement} />
            <TopMetric label={t.labels.risk} value={`${analysis.riskLevel}`} note={analysis.riskSummary} />
            <TopMetric label={t.labels.status} value={product.status} note={analysis.nextAction} />
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <ActionPanel
          title={t.sections.next}
          actions={[
            { label: t.actions.transferRg, onClick: () => transferTo("rg") },
            { label: t.actions.transferPb, onClick: () => transferTo("pb") },
            { label: t.actions.generateProposal, onClick: () => setFeedback("已生成产品提案任务。") },
            { label: t.actions.generateSupplierTask, onClick: () => setFeedback("已生成供应商开发任务。") },
            { label: t.actions.generateCompetitorReport, onClick: () => setFeedback("已生成竞品分析报告任务。") },
            { label: t.actions.markObserve, onClick: () => updateStatus("继续观察") },
          ]}
        />

        <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm xl:col-span-2">
          <div className="flex flex-wrap gap-2">
            {analysis.statusSuggestions.map((status) => (
              <Button key={status} variant="outline" onClick={() => updateStatus(status)}>
                {status}
              </Button>
            ))}
          </div>
          <div className="mt-4 flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 sm:flex-row sm:items-center">
            <select
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              className="h-10 rounded-md border border-rose-200 bg-white px-3 text-sm"
            >
              {REJECTION_REASONS.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
            <Button variant="outline" onClick={markRejected}>
              {t.actions.saveReject}
            </Button>
          </div>
        </section>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <InfoCard title={t.sections.basic}>
          <Info label={t.labels.nameKo} value={product.productNameKo} />
          <Info label={t.labels.nameZh} value={product.productNameZh} />
          <Info label="平台" value={product.platform} />
          <Info label="品牌" value={product.brand || "-"} />
          <Info label="类目" value={product.category || "-"} />
          <Info label="负责人" value={product.owner || "-"} />
          <Info label="配送方式" value={product.deliveryType || "-"} />
          <Info label="卖家类型" value={product.sellerType || "-"} />
          <Info label="尺寸 / 重量" value={`${product.size || "-"} / ${product.weight || "-"}`} />
        </InfoCard>

        <InfoCard title={t.sections.competitor}>
          <Info label="竞品售价" value={formatCurrency(product.competitorSalePriceKrw)} />
          <Info label="预计月销" value={formatNumber(product.estimatedMonthlySales)} />
          <Info label="评论数" value={formatNumber(product.reviewCount)} />
          <Info label="评分" value={`${product.rating || 0}`} />
          <Info label="类目排名" value={product.rank ? `#${product.rank}` : "-"} />
          <Info label={t.labels.opportunity} value={analysis.biggestOpportunity} />
          <Info label={t.labels.biggestRisk} value={analysis.biggestRisk} />
        </InfoCard>

        <ScoreCard title={t.sections.review} rows={analysis.scoreDimensions.filter((item) => item.label === "差评可改进性")} />

        <InfoCard title={t.sections.profit}>
          <Info label="最终毛利 KRW" value={formatCurrency(analysis.grossProfitKrw)} />
          <Info label="最终毛利率 %" value={`${analysis.grossMarginPercent}%`} />
          <Info label={t.labels.profitSafety} value={`${analysis.profitSafety} · ${analysis.profitSafetyNote}`} />
          <Info label={t.labels.targetSupply} value={formatCurrency(analysis.suggestedTargetSupplyPriceKrw)} />
          <Info label={t.labels.minimumSupply} value={formatCurrency(analysis.minimumAcceptableSupplyPriceKrw)} />
        </InfoCard>

        <InfoCard title={t.sections.certification}>
          <Info label="KC 认证需求" value={product.needsKcCertification ? "需要" : "不需要/待确认"} />
          <Info label="KC 资料" value={product.kcDocsReady ? "已完整" : "未完整"} />
          <Info label="认证判断" value={analysis.riskSummary} />
        </InfoCard>

        <InfoCard title={t.sections.logistics}>
          <Info label="包装尺寸" value={product.packageSize || "-"} />
          <Info label="重量" value={product.weight || "-"} />
          <Info label="韩国本地物流" value={formatCurrency(product.koreaShippingKrw)} />
          <Info label="国际物流" value={formatCurrency(product.internationalShippingKrw)} />
          <Info label="物流风险" value={analysis.riskRedlineLevel} />
        </InfoCard>

        <InfoCard title={t.sections.supply}>
          <Info label="供应商报价数" value={`${product.supplierQuoteCount}`} />
          <Info label="供应商列表" value={product.supplierNames.join("、") || "-"} />
          <Info label="供应链优势" value={analysis.scoreDimensions.find((item) => item.label === "供应链优势")?.note ?? "-"} />
          <Info label="品类机会说明" value={product.categoryGapNote || "-"} />
        </InfoCard>

        <ScoreCard title={t.sections.rg} rows={analysis.rgDimensions} footer={analysis.rgJudgement} />
        <ScoreCard title={t.sections.pb} rows={analysis.pbDimensions} footer={analysis.pbJudgement} />

        <InfoCard title={t.sections.ai}>
          <Info label={t.labels.judgement} value={analysis.totalJudgement} />
          <Info label={t.labels.direction} value={analysis.direction} />
          <Info label={t.labels.opportunity} value={analysis.biggestOpportunity} />
          <Info label={t.labels.biggestRisk} value={analysis.biggestRisk} />
          <Info label={t.labels.nextAction} value={analysis.nextAction} />
        </InfoCard>

        <InfoCard title={t.sections.tasks}>
          {analysis.generatedTasks.length ? (
            <div className="space-y-3">
              {analysis.generatedTasks.map((task) => (
                <div key={task.id} className="rounded-xl border border-stone-200 bg-stone-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{task.title}</p>
                    <Badge>{task.status}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{task.reason}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {task.owner} · {task.dueLabel}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">当前没有自动任务，建议先补齐利润和风险信息。</p>
          )}
        </InfoCard>

        <InfoCard title={t.sections.files}>
          {product.fileReferences.length ? (
            <div className="space-y-3">
              {product.fileReferences.map((file) => (
                <div key={file} className="flex items-center gap-3 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm">{file}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t.emptyFiles}</p>
          )}
        </InfoCard>
      </section>
    </div>
  );
}

function TopMetric({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{note}</p>
    </div>
  );
}

function ActionPanel({
  title,
  actions,
}: {
  title: string;
  actions: { label: string; onClick: () => void }[];
}) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="mt-4 flex flex-col gap-2">
        {actions.map((action) => (
          <Button key={action.label} variant="outline" onClick={action.onClick}>
            {action.label}
          </Button>
        ))}
      </div>
    </section>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-stone-100 bg-stone-50 px-4 py-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="max-w-[60%] text-right font-medium">{value}</span>
    </div>
  );
}

function ScoreCard({
  title,
  rows,
  footer,
}: {
  title: string;
  rows: { label: string; score: number; max: number; note: string }[];
  footer?: string;
}) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="mt-4 space-y-3">
        {rows.map((row) => {
          const percent = row.max ? Math.round((row.score / row.max) * 100) : 0;
          return (
            <div key={row.label} className="rounded-xl border border-stone-100 bg-stone-50 p-3">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span>{row.label}</span>
                <span className="font-medium">
                  {row.score}/{row.max}
                </span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-stone-200">
                <div className="h-2 rounded-full bg-slate-900" style={{ width: `${percent}%` }} />
              </div>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">{row.note}</p>
            </div>
          );
        })}
        {footer ? <Badge className="border-slate-200 bg-slate-50 text-slate-700">{footer}</Badge> : null}
      </div>
    </section>
  );
}
