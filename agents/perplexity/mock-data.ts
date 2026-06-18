import type { PerplexityCapability, PerplexityMockInsight, PerplexityReportPayload, PerplexityReportTable } from "@/agents/perplexity/types";

const tableMap: Record<PerplexityCapability, PerplexityReportTable> = {
  "market-research": "market_reports",
  "trend-discovery": "trend_reports",
  "competitor-analysis": "competitor_reports",
  "new-product-discovery": "opportunity_reports",
};

const capabilityContent: Record<
  PerplexityCapability,
  {
    title: string;
    query: string;
    summary: string;
    highlights: string[];
    insights: PerplexityMockInsight[];
    nextSteps: string[];
  }
> = {
  "market-research": {
    title: "Korea Home Living Market Research",
    query: "Korea home-living category demand, price band, customer pain points, and platform momentum",
    summary: "Mock market research indicates stable demand in functional home-living products, with strongest conversion coming from clear utility, easy installation, and visually clean listings.",
    highlights: [
      "Coupang and Naver remain the two most important signal sources for early demand validation.",
      "Products with simple setup and low return risk outperform feature-heavy listings.",
      "Mid-price positioning shows better review-to-conversion balance than pure low-price competition.",
    ],
    insights: [
      {
        title: "Demand concentrates around practical use cases",
        summary: "Customers reward products that solve one concrete household problem quickly.",
        evidence: ["High review density around installation convenience", "Repeat category demand around storage, blinds, and lightweight household improvements"],
        confidence: 86,
        recommendedAction: "Focus research on scenario-specific landing copy and problem-solution listing structures.",
      },
      {
        title: "Price compression increases in undifferentiated SKUs",
        summary: "Generic SKUs without visual or feature distinction face faster margin erosion.",
        evidence: ["Competing price ladders cluster tightly", "Listing differentiation often comes from bundle or packaging strategy"],
        confidence: 82,
        recommendedAction: "Build comparison-ready offers instead of entering commodity-only price wars.",
      },
    ],
    nextSteps: [
      "Validate top 3 price bands with real Perplexity web citations later.",
      "Link category research to local product database for SKU scoring.",
      "Add source URL extraction when live API is enabled.",
    ],
  },
  "trend-discovery": {
    title: "Emerging Trend Discovery Report",
    query: "Korean ecommerce trend discovery for fast-moving home living and organization categories",
    summary: "Mock trend discovery suggests lightweight convenience, calm neutral aesthetics, and compact-space optimization remain the strongest short-term trend clusters.",
    highlights: [
      "Compact apartment-friendly positioning is a recurring growth theme.",
      "Neutral color palettes continue to outperform louder decorative positioning.",
      "Products that reduce setup friction gain faster review momentum.",
    ],
    insights: [
      {
        title: "Small-space optimization is still growing",
        summary: "Products framed around space efficiency and low visual clutter keep strong attention.",
        evidence: ["Keyword clusters around compact, slim, foldable", "Higher engagement on before/after utility narratives"],
        confidence: 84,
        recommendedAction: "Create a trend watchlist for slim-format, foldable, and modular SKUs.",
      },
      {
        title: "Functional calm aesthetic is more defensible than novelty",
        summary: "Minimalist presentation remains easier to scale than novelty-driven seasonal demand.",
        evidence: ["Neutral palette dominance", "Review language favors clean, simple, tidy, easy-match qualities"],
        confidence: 79,
        recommendedAction: "Prioritize beige, white, gray, and matte finishes in future testing.",
      },
    ],
    nextSteps: [
      "Attach trend snapshots to weekly planning rhythm.",
      "Add trend score history once database ingestion is live.",
      "Compare trend signals by platform after Perplexity API integration.",
    ],
  },
  "competitor-analysis": {
    title: "Competitor Analysis Snapshot",
    query: "Korean ecommerce competitor analysis for home-living category leaders and listing strategies",
    summary: "Mock competitor analysis shows winning brands combine strong review proof, better image clarity, and simpler option structures rather than relying only on discount depth.",
    highlights: [
      "Top competitors reduce option overload and lead with one hero use case.",
      "Review growth leaders emphasize installation ease and packaging reliability.",
      "Mid-tier brands often leave room for copy and bundle optimization.",
    ],
    insights: [
      {
        title: "Top listings are operationally clearer",
        summary: "Winning competitor pages reduce ambiguity in option names, sizing, and installation expectations.",
        evidence: ["Simplified option trees", "Stronger first-screen benefit framing"],
        confidence: 88,
        recommendedAction: "Benchmark option naming and first-screen message structure.",
      },
      {
        title: "Negative review gaps remain exploitable",
        summary: "Packaging damage, size misunderstanding, and color mismatch continue to open entry points.",
        evidence: ["Complaint clusters repeat across similar listings", "Competitors often under-explain product expectations"],
        confidence: 83,
        recommendedAction: "Turn review complaints into explicit promise-and-proof content blocks.",
      },
    ],
    nextSteps: [
      "Connect competitor snapshots to competitor report storage.",
      "Add URL-level citation fields when live Perplexity responses are enabled.",
      "Create weekly competitor watchlists for selected brands.",
    ],
  },
  "new-product-discovery": {
    title: "New Product Discovery Opportunities",
    query: "Discover new product opportunities in Korean ecommerce home-living categories",
    summary: "Mock opportunity discovery highlights products with clear utility, lower structural complexity, and obvious negative-review optimization potential as the best near-term candidates.",
    highlights: [
      "Products with visible pain-point fixes create faster test loops.",
      "Moderate complexity products fit better with quick sourcing validation.",
      "Opportunity quality improves when complaints are easy to resolve through spec, packaging, or copy.",
    ],
    insights: [
      {
        title: "Pain-point led discovery outperforms random novelty hunting",
        summary: "The best mock opportunities are anchored in solvable complaint patterns, not just rising traffic.",
        evidence: ["Installation confusion", "Packaging weakness", "Color expectation mismatch"],
        confidence: 87,
        recommendedAction: "Rank discovery candidates by fixability before ranking by traffic alone.",
      },
      {
        title: "Low-complexity sourcing should be prioritized first",
        summary: "Products with simpler materials and less regulatory risk offer faster test velocity.",
        evidence: ["Shorter sourcing cycles", "Easier sample verification", "Lower launch coordination overhead"],
        confidence: 81,
        recommendedAction: "Create a fast-lane pool for products with simple BOM and clear market signal.",
      },
    ],
    nextSteps: [
      "Feed discovered opportunities into the opportunity center.",
      "Add category-level opportunity scores with real citations later.",
      "Connect future Perplexity results to sourcing task generation.",
    ],
  },
};

export function buildMockPerplexityReport(capability: PerplexityCapability): PerplexityReportPayload {
  const source = capabilityContent[capability];
  const generatedAt = new Date().toISOString();

  return {
    id: `perplexity-${capability}-${Date.now()}`,
    capability,
    title: source.title,
    query: source.query,
    generatedAt,
    provider: "mock-perplexity",
    model: "sonar-pro-placeholder",
    summary: source.summary,
    highlights: source.highlights,
    insights: source.insights,
    nextSteps: source.nextSteps,
    metadata: {
      outputTable: tableMap[capability],
      sourceMode: "mock",
      futureApiReady: true,
    },
  };
}
