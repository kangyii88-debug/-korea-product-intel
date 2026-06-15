import type { CollectionRunResult, CollectionTaskTarget } from "@/lib/types";
import { collectCoupangProduct } from "@/lib/collectors/coupang";
import { saveCollectionRun } from "@/lib/collection-store";
import { discoverOpportunities } from "@/lib/opportunity-engine";

const curtainSeedTargets: CollectionTaskTarget[] = [
  { platform: "Coupang", keyword: "허니콤 블라인드", curtainType: "honeycomb_blind" },
  { platform: "Coupang", keyword: "플리츠 블라인드", curtainType: "pleated_blind" },
  { platform: "Coupang", keyword: "롤스크린 블라인드", curtainType: "roller_blind" },
  { platform: "Coupang", keyword: "콤비블라인드", curtainType: "zebra_blind" },
  { platform: "Coupang", keyword: "우드블라인드", curtainType: "venetian_blind" },
  { platform: "Coupang", keyword: "샤워커튼", curtainType: "bathroom_curtain" },
  { platform: "Coupang", keyword: "커튼 레일 브라켓", curtainType: "curtain_accessory" },
];

export async function runCoupangCollection(urls: string[]): Promise<CollectionRunResult> {
  const startedAtMs = Date.now();
  const startedAt = new Date(startedAtMs).toISOString();
  const targets = urls.map((url) => ({ platform: "Coupang" as const, url }));
  const collectedProducts = [];
  const errors = [];

  for (const url of urls) {
    try {
      collectedProducts.push(await collectCoupangProduct(url));
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  const generatedOpportunities = discoverOpportunities(collectedProducts);
  const run: CollectionRunResult = {
    id: `collection-${startedAtMs}`,
    startedAt,
    finishedAt: new Date().toISOString(),
    durationMs: Date.now() - startedAtMs,
    targets,
    collectedProducts,
    generatedOpportunities,
    status: errors.length && collectedProducts.length ? "partial" : errors.length ? "failed" : "completed",
    errors,
  };

  await saveCollectionRun(run);
  return run;
}

export async function planDailyCurtainCollection() {
  return {
    targets: curtainSeedTargets,
    expectedScale: {
      productProfiles: "1000+",
      reviewAnalyses: "10000+",
      developmentOpportunities: "100+",
    },
    note: "关键词任务需要接入搜索结果采集器或外部数据源后自动扩展为商品 URL 队列。",
  };
}
