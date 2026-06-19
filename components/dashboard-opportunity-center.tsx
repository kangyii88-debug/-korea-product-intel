"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownUp,
  ExternalLink,
  Filter,
  FolderPlus,
  Import,
  PencilLine,
  Search,
  ShieldAlert,
  Trash2,
  X,
} from "lucide-react";
import { useLocale } from "@/components/locale-provider";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getDashboardOpportunityCopy } from "@/lib/dashboard-opportunity-i18n";
import {
  calculateEstimatedMargin,
  calculateEstimatedMarginRate,
  type OpportunityCategory,
  type OpportunityDirection,
  type OpportunityLevel,
  type OpportunityNextAction,
  type OpportunityStatus,
  type ProductOpportunityInput,
  type ProductOpportunityRecord,
} from "@/lib/product-opportunities";
import { createClient as createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type MetricKey = "monthNew" | "highPotential" | "rg" | "pb" | "ownBrand" | "highRisk" | "dropped" | "tasks";
type SortKey =
  | "updated_at"
  | "score"
  | "price"
  | "review_count"
  | "rating"
  | "competitor_count"
  | "estimated_margin_rate";
type SortDirection = "asc" | "desc";
type Mode = "create" | "edit" | null;

type FilterState = {
  status: "all" | OpportunityStatus;
  direction: "all" | OpportunityDirection;
  category: "all" | OpportunityCategory;
  risk: "all" | OpportunityLevel;
  profit: "all" | OpportunityLevel;
  query: string;
};

const DEFAULT_FILTERS: FilterState = {
  status: "all",
  direction: "all",
  category: "all",
  risk: "all",
  profit: "all",
  query: "",
};

const DEFAULT_FORM: ProductOpportunityInput = {
  title: "",
  sku: "",
  keyword: "",
  category: "other",
  business_type: "general",
  coupang_url: "",
  image_url: "",
  price: 0,
  review_count: 0,
  rating: 0,
  competitor_count: 0,
  estimated_purchase_cost: 0,
  estimated_shipping_cost: 0,
  estimated_local_delivery_cost: 0,
  platform_fee_rate: 0,
  estimated_ad_cost: 0,
  estimated_sale_price: 0,
  market_heat: "medium",
  competition_level: "medium",
  kc_risk: "low",
  volume_weight_risk: "low",
  return_risk: "low",
  negative_review_risk: "low",
  price_war_risk: "low",
  supply_chain_risk: "low",
  notes: "",
  status: "pending_analysis",
  next_action: "collect_competitors",
  demand_stability: "",
  seasonality: "",
  long_term_fit: false,
  short_term_test_fit: true,
  competitor_price_range: "",
  top_seller_count: 0,
  review_issue_summary: "",
  negative_review_keywords: "",
  improvement_points: "",
};

const PAGE_SIZE = 10;

export function DashboardOpportunityCenter() {
  const { locale } = useLocale();
  const t = getDashboardOpportunityCopy(locale);
  const [items, setItems] = useState<ProductOpportunityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<{ tone: "default" | "success" | "danger"; message: string } | null>(null);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [metricFilter, setMetricFilter] = useState<MetricKey | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("updated_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [page, setPage] = useState(1);
  const [drawerMode, setDrawerMode] = useState<Mode>(null);
  const [detailItem, setDetailItem] = useState<ProductOpportunityRecord | null>(null);
  const [editingItem, setEditingItem] = useState<ProductOpportunityRecord | null>(null);
  const [form, setForm] = useState<ProductOpportunityInput>(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [guestSessionAttempted, setGuestSessionAttempted] = useState(false);

  const statusOptions = useMemo(
    () => [
      { value: "all", label: t.options.all },
      ...(["pending_analysis", "testable", "high_potential", "paused", "dropped", "in_execution"] as const).map((value) => ({
        value,
        label: t.options.status[value],
      })),
    ],
    [t],
  );

  const directionOptions = useMemo(
    () => [
      { value: "all", label: t.options.all },
      ...(["rocket_growth", "pb_supply", "own_brand", "general"] as const).map((value) => ({
        value,
        label: t.options.direction[value],
      })),
    ],
    [t],
  );

  const categoryOptions = useMemo(
    () => [
      { value: "all", label: t.options.all },
      ...(["window_curtain", "bathroom_curtain", "household", "kids", "outdoor", "other"] as const).map((value) => ({
        value,
        label: t.options.category[value],
      })),
    ],
    [t],
  );

  const levelOptions = useMemo(
    () => [
      { value: "all", label: t.options.all },
      ...(["low", "medium", "high"] as const).map((value) => ({
        value,
        label: t.options.riskLabel[value],
      })),
    ],
    [t],
  );

  const profitOptions = useMemo(
    () => [
      { value: "all", label: t.options.all },
      ...(["low", "medium", "high"] as const).map((value) => ({
        value,
        label: t.options.profitLabel[value],
      })),
    ],
    [t],
  );

  const nextActionOptions = useMemo(
    () =>
      ([
        "collect_competitors",
        "calculate_profit",
        "find_supplier",
        "apply_sample",
        "prepare_rg_proposal",
        "prepare_pb_proposal",
        "launch_test",
        "pause",
      ] as const).map((value) => ({
        value,
        label: t.options.nextAction[value],
      })),
    [t],
  );

  useEffect(() => {
    void loadItems();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [filters, metricFilter, sortKey, sortDirection]);

  async function loadItems() {
    setLoading(true);
    try {
      const response = await fetch("/api/product-opportunities", { cache: "no-store" });
      const data = (await response.json()) as { items?: ProductOpportunityRecord[]; error?: string };

      if (data.error === "unauthorized") {
        if (!guestSessionAttempted) {
          const signedIn = await ensureGuestSession();
          setGuestSessionAttempted(true);
          if (signedIn) {
            return await loadItems();
          }
        }
        setItems([]);
        setBanner({ tone: "default", message: t.authHint });
        return;
      }

      if (data.error === "supabase_not_configured") {
        setItems([]);
        setBanner({ tone: "default", message: t.dbHint });
        return;
      }

      if (data.error) {
        setItems([]);
        setBanner({ tone: "danger", message: t.loadError });
        return;
      }

      setItems(data.items ?? []);
      setBanner(null);
    } catch {
      setItems([]);
      setBanner({ tone: "danger", message: t.loadError });
    } finally {
      setLoading(false);
    }
  }

  async function ensureGuestSession() {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return false;

    const result = await supabase.auth.signInAnonymously();
    return !result.error;
  }

  function openCreateDrawer() {
    setEditingItem(null);
    setForm(DEFAULT_FORM);
    setDrawerMode("create");
  }

  function openEditDrawer(item: ProductOpportunityRecord) {
    setEditingItem(item);
    setForm(mapRecordToForm(item));
    setDrawerMode("edit");
  }

  function closeDrawer() {
    setDrawerMode(null);
    setEditingItem(null);
    setSubmitting(false);
  }

  function onImport() {
    setBanner({ tone: "default", message: t.importPending });
  }

  const baseFilteredItems = useMemo(() => {
    const keyword = filters.query.trim().toLowerCase();
    return items.filter((item) => {
      const searchable = [item.title, item.sku, item.keyword, item.coupang_url, item.notes].join(" ").toLowerCase();
      return (
        (filters.status === "all" || item.status === filters.status) &&
        (filters.direction === "all" || item.business_type === filters.direction) &&
        (filters.category === "all" || item.category === filters.category) &&
        (filters.risk === "all" || item.risk_level === filters.risk) &&
        (filters.profit === "all" || item.profit_level === filters.profit) &&
        (!keyword || searchable.includes(keyword))
      );
    });
  }, [filters, items]);

  const metrics = useMemo(() => {
    const monthKey = new Date().toISOString().slice(0, 7);
    return {
      monthNew: baseFilteredItems.filter((item) => item.created_at.slice(0, 7) === monthKey).length,
      highPotential: baseFilteredItems.filter((item) => Number(item.score ?? 0) >= 80).length,
      rg: baseFilteredItems.filter((item) => item.business_type === "rocket_growth").length,
      pb: baseFilteredItems.filter((item) => item.business_type === "pb_supply").length,
      ownBrand: baseFilteredItems.filter((item) => item.business_type === "own_brand").length,
      highRisk: baseFilteredItems.filter((item) => item.risk_level === "high").length,
      dropped: baseFilteredItems.filter((item) => item.status === "dropped").length,
      tasks: baseFilteredItems.filter((item) => item.next_action && item.status !== "dropped").length,
    };
  }, [baseFilteredItems]);

  const displayItems = useMemo(() => {
    const metricFiltered = baseFilteredItems.filter((item) => {
      if (!metricFilter) return true;
      if (metricFilter === "monthNew") {
        return item.created_at.slice(0, 7) === new Date().toISOString().slice(0, 7);
      }
      if (metricFilter === "highPotential") return Number(item.score ?? 0) >= 80;
      if (metricFilter === "rg") return item.business_type === "rocket_growth";
      if (metricFilter === "pb") return item.business_type === "pb_supply";
      if (metricFilter === "ownBrand") return item.business_type === "own_brand";
      if (metricFilter === "highRisk") return item.risk_level === "high";
      if (metricFilter === "dropped") return item.status === "dropped";
      return Boolean(item.next_action) && item.status !== "dropped";
    });

    const sorted = [...metricFiltered].sort((left, right) => {
      const leftValue = getSortableValue(left, sortKey);
      const rightValue = getSortableValue(right, sortKey);

      if (typeof leftValue === "number" && typeof rightValue === "number") {
        return sortDirection === "asc" ? leftValue - rightValue : rightValue - leftValue;
      }

      const result = String(leftValue).localeCompare(String(rightValue), locale === "ko" ? "ko" : "zh");
      return sortDirection === "asc" ? result : -result;
    });

    return sorted;
  }, [baseFilteredItems, locale, metricFilter, sortDirection, sortKey]);

  const pagedItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return displayItems.slice(start, start + PAGE_SIZE);
  }, [displayItems, page]);

  const totalPages = Math.max(1, Math.ceil(displayItems.length / PAGE_SIZE));

  const computedMargin = calculateEstimatedMargin(form);
  const computedMarginRate = calculateEstimatedMarginRate(computedMargin, Number(form.estimated_sale_price || 0));

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.title.trim() || !form.category || !form.business_type) {
      setBanner({ tone: "danger", message: t.form.required });
      return;
    }

    setSubmitting(true);

    try {
      const result = await submitOpportunityRequest(
        drawerMode === "edit" && editingItem ? `/api/product-opportunities/${editingItem.id}` : "/api/product-opportunities",
        drawerMode === "edit" && editingItem ? "PATCH" : "POST",
        form,
      );
      if (!result.ok) return;

      setBanner({ tone: "success", message: t.saveSuccess });
      closeDrawer();
      await loadItems();
    } catch {
      setBanner({ tone: "danger", message: t.saveError });
    } finally {
      setSubmitting(false);
    }
  }

  async function submitOpportunityRequest(url: string, method: "POST" | "PATCH", payload: ProductOpportunityInput) {
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as { item?: ProductOpportunityRecord; error?: string };
    if (response.ok && !data.error) {
      return { ok: true as const };
    }

    if (data.error === "unauthorized") {
      const signedIn = await ensureGuestSession();
      if (signedIn) {
        const retryResponse = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const retryData = (await retryResponse.json()) as { item?: ProductOpportunityRecord; error?: string };
        if (retryResponse.ok && !retryData.error) {
          return { ok: true as const };
        }
      }
    }

    setBanner({
      tone: "danger",
      message: data.error === "unauthorized" || data.error === "supabase_not_configured" ? t.authHint : t.saveError,
    });
    return { ok: false as const };
  }

  async function onDelete(item: ProductOpportunityRecord) {
    if (!window.confirm(t.deleteConfirm)) return;
    try {
      const removed = await deleteOpportunity(item.id);
      if (!removed) return;

      setBanner({ tone: "success", message: t.deleteSuccess });
      if (detailItem?.id === item.id) {
        setDetailItem(null);
      }
      await loadItems();
    } catch {
      setBanner({ tone: "danger", message: t.deleteError });
    }
  }

  async function deleteOpportunity(id: string) {
    const response = await fetch(`/api/product-opportunities/${id}`, { method: "DELETE" });
    const data = (await response.json()) as { ok?: boolean; error?: string };

    if (response.ok && !data.error) {
      return true;
    }

    if (data.error === "unauthorized") {
      const signedIn = await ensureGuestSession();
      if (signedIn) {
        const retryResponse = await fetch(`/api/product-opportunities/${id}`, { method: "DELETE" });
        const retryData = (await retryResponse.json()) as { ok?: boolean; error?: string };
        if (retryResponse.ok && !retryData.error) {
          return true;
        }
      }
    }

    setBanner({
      tone: "danger",
      message: data.error === "unauthorized" || data.error === "supabase_not_configured" ? t.authHint : t.deleteError,
    });
    return false;
  }

  return (
    <>
      <PageHeader
        eyebrow={t.eyebrow}
        title={t.title}
        description={t.description}
        action={
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={onImport}>
              <Import className="h-4 w-4" />
              {t.import}
            </Button>
            <Button onClick={openCreateDrawer}>
              <FolderPlus className="h-4 w-4" />
              {t.add}
            </Button>
          </div>
        }
      />

      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-6 px-5 py-6 sm:px-8 sm:py-8">
        {banner ? <Banner tone={banner.tone} message={banner.message} onClose={() => setBanner(null)} /> : null}

        <Card>
          <CardContent className="p-5 sm:p-6">
            <div className="grid gap-4 xl:grid-cols-[repeat(5,minmax(0,1fr))_minmax(240px,1.4fr)]">
              <FilterSelect
                label={t.filters.status}
                value={filters.status}
                onChange={(value) => setFilters((current) => ({ ...current, status: value as FilterState["status"] }))}
                options={statusOptions}
              />
              <FilterSelect
                label={t.filters.direction}
                value={filters.direction}
                onChange={(value) => setFilters((current) => ({ ...current, direction: value as FilterState["direction"] }))}
                options={directionOptions}
              />
              <FilterSelect
                label={t.filters.category}
                value={filters.category}
                onChange={(value) => setFilters((current) => ({ ...current, category: value as FilterState["category"] }))}
                options={categoryOptions}
              />
              <FilterSelect
                label={t.filters.risk}
                value={filters.risk}
                onChange={(value) => setFilters((current) => ({ ...current, risk: value as FilterState["risk"] }))}
                options={levelOptions}
              />
              <FilterSelect
                label={t.filters.profit}
                value={filters.profit}
                onChange={(value) => setFilters((current) => ({ ...current, profit: value as FilterState["profit"] }))}
                options={profitOptions}
              />

              <label className="xl:col-span-1">
                <span className="mb-2 inline-flex items-center gap-2 text-xs font-medium text-slate-500">
                  <Search className="h-3.5 w-3.5" />
                  {t.searchPlaceholder}
                </span>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      value={filters.query}
                      onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))}
                      placeholder={t.searchPlaceholder}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-950/5"
                    />
                  </div>
                  <Button variant="outline" onClick={() => { setFilters(DEFAULT_FILTERS); setMetricFilter(null); }}>
                    {t.clearFilters}
                  </Button>
                </div>
              </label>
            </div>
          </CardContent>
        </Card>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label={t.metrics.monthNew.label}
            note={t.metrics.monthNew.note}
            value={metrics.monthNew}
            active={metricFilter === "monthNew"}
            onClick={() => toggleMetric("monthNew", metricFilter, setMetricFilter)}
          />
          <MetricCard
            label={t.metrics.highPotential.label}
            note={t.metrics.highPotential.note}
            value={metrics.highPotential}
            tone="success"
            active={metricFilter === "highPotential"}
            onClick={() => toggleMetric("highPotential", metricFilter, setMetricFilter)}
          />
          <MetricCard
            label={t.metrics.rg.label}
            note={t.metrics.rg.note}
            value={metrics.rg}
            active={metricFilter === "rg"}
            onClick={() => toggleMetric("rg", metricFilter, setMetricFilter)}
          />
          <MetricCard
            label={t.metrics.pb.label}
            note={t.metrics.pb.note}
            value={metrics.pb}
            active={metricFilter === "pb"}
            onClick={() => toggleMetric("pb", metricFilter, setMetricFilter)}
          />
          <MetricCard
            label={t.metrics.ownBrand.label}
            note={t.metrics.ownBrand.note}
            value={metrics.ownBrand}
            active={metricFilter === "ownBrand"}
            onClick={() => toggleMetric("ownBrand", metricFilter, setMetricFilter)}
          />
          <MetricCard
            label={t.metrics.highRisk.label}
            note={t.metrics.highRisk.note}
            value={metrics.highRisk}
            tone="warning"
            active={metricFilter === "highRisk"}
            onClick={() => toggleMetric("highRisk", metricFilter, setMetricFilter)}
          />
          <MetricCard
            label={t.metrics.dropped.label}
            note={t.metrics.dropped.note}
            value={metrics.dropped}
            tone="danger"
            active={metricFilter === "dropped"}
            onClick={() => toggleMetric("dropped", metricFilter, setMetricFilter)}
          />
          <MetricCard
            label={t.metrics.tasks.label}
            note={t.metrics.tasks.note}
            value={metrics.tasks}
            active={metricFilter === "tasks"}
            onClick={() => toggleMetric("tasks", metricFilter, setMetricFilter)}
          />
        </section>

        {loading ? (
          <Card>
            <CardContent className="p-8 text-sm text-slate-500">{locale === "ko" ? "불러오는 중..." : "加载中..."}</CardContent>
          </Card>
        ) : items.length === 0 ? (
          <EmptyOpportunityState locale={locale} onAdd={openCreateDrawer} onImport={onImport} />
        ) : (
          <Card>
            <CardHeader className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6">
              <div>
                <h2 className="text-lg font-semibold tracking-[-0.02em] text-slate-950">{t.table.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">{t.table.description}</p>
              </div>
              <p className="text-sm text-slate-500">{interpolate(t.table.total, { count: String(displayItems.length) })}</p>
            </CardHeader>
            <CardContent className="overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="min-w-[1200px] w-full border-separate border-spacing-0">
                  <thead>
                    <tr className="bg-slate-50/70">
                      <TableHeaderCell>{t.table.columns.opportunity}</TableHeaderCell>
                      <TableHeaderCell>{t.table.columns.category}</TableHeaderCell>
                      <TableHeaderCell>{t.table.columns.direction}</TableHeaderCell>
                      <SortableHeader
                        label={t.table.columns.marketHeat}
                        active={sortKey === "score"}
                        direction={sortDirection}
                        onClick={() => toggleSort("score", sortKey, sortDirection, setSortKey, setSortDirection)}
                      />
                      <TableHeaderCell>{t.table.columns.competition}</TableHeaderCell>
                      <TableHeaderCell>{t.table.columns.profit}</TableHeaderCell>
                      <TableHeaderCell>{t.table.columns.risk}</TableHeaderCell>
                      <SortableHeader
                        label={t.table.columns.score}
                        active={sortKey === "score"}
                        direction={sortDirection}
                        onClick={() => toggleSort("score", sortKey, sortDirection, setSortKey, setSortDirection)}
                      />
                      <TableHeaderCell>{t.table.columns.status}</TableHeaderCell>
                      <TableHeaderCell>{t.table.columns.nextAction}</TableHeaderCell>
                      <SortableHeader
                        label={t.table.columns.updatedAt}
                        active={sortKey === "updated_at"}
                        direction={sortDirection}
                        onClick={() => toggleSort("updated_at", sortKey, sortDirection, setSortKey, setSortDirection)}
                      />
                      <TableHeaderCell align="right">{t.table.columns.operations}</TableHeaderCell>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedItems.length === 0 ? (
                      <tr>
                        <td colSpan={12} className="px-6 py-12 text-center text-sm text-slate-500">
                          {t.table.empty}
                        </td>
                      </tr>
                    ) : (
                      pagedItems.map((item) => (
                        <tr
                          key={item.id}
                          className="cursor-pointer transition hover:bg-slate-50/70"
                          onClick={() => setDetailItem(item)}
                        >
                          <td className="border-t border-slate-200 px-6 py-4 align-top">
                            <div className="flex items-start gap-3">
                              <Thumbnail src={item.image_url} title={item.title} />
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-slate-950">{item.title}</p>
                                <p className="mt-1 truncate text-xs text-slate-500">{item.keyword || item.sku || "-"}</p>
                                {item.coupang_url ? (
                                  <a
                                    href={item.coupang_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={(event) => event.stopPropagation()}
                                    className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-950"
                                  >
                                    Coupang
                                    <ExternalLink className="h-3.5 w-3.5" />
                                  </a>
                                ) : null}
                              </div>
                            </div>
                          </td>
                          <Cell>{t.options.category[item.category]}</Cell>
                          <Cell>
                            <Badge tone="default">{t.options.direction[item.business_type]}</Badge>
                          </Cell>
                          <Cell>
                            <Badge tone={item.market_heat === "high" ? "success" : item.market_heat === "low" ? "danger" : "default"}>
                              {item.market_heat ? t.options.level[item.market_heat] : "-"}
                            </Badge>
                          </Cell>
                          <Cell>
                            <Badge
                              tone={
                                item.competition_level === "low"
                                  ? "success"
                                  : item.competition_level === "high"
                                    ? "danger"
                                    : "default"
                              }
                            >
                              {item.competition_level ? t.options.level[item.competition_level] : "-"}
                            </Badge>
                          </Cell>
                          <Cell>
                            <Badge
                              tone={
                                item.profit_level === "high"
                                  ? "success"
                                  : item.profit_level === "low"
                                    ? "danger"
                                    : "default"
                              }
                            >
                              {item.profit_level ? t.options.profitLabel[item.profit_level] : "-"}
                            </Badge>
                          </Cell>
                          <Cell>
                            <Badge tone={item.risk_level === "high" ? "danger" : item.risk_level === "medium" ? "warning" : "success"}>
                              {item.risk_level ? t.options.riskLabel[item.risk_level] : "-"}
                            </Badge>
                          </Cell>
                          <Cell>
                            <div className="space-y-1">
                              <p className="text-sm font-semibold text-slate-950">{Number(item.score ?? 0)}</p>
                              <p className="text-xs text-slate-500">{formatPercent(Number(item.estimated_margin_rate ?? 0))}</p>
                            </div>
                          </Cell>
                          <Cell>
                            <Badge tone="default">{t.options.status[item.status]}</Badge>
                          </Cell>
                          <Cell className="max-w-[180px]">
                            <p className="text-sm leading-6 text-slate-600">{item.next_action ? t.options.nextAction[item.next_action] : "-"}</p>
                          </Cell>
                          <Cell>{formatDate(item.updated_at)}</Cell>
                          <td className="border-t border-slate-200 px-6 py-4 text-right align-top">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setDetailItem(item);
                                }}
                              >
                                {t.actions.view}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openEditDrawer(item);
                                }}
                              >
                                <PencilLine className="h-4 w-4" />
                                {t.actions.edit}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  void onDelete(item);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                                {t.actions.delete}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <p className="text-sm text-slate-500">{interpolate(t.table.page, { current: String(page), total: String(totalPages) })}</p>
                <div className="flex gap-2">
                  <Button variant="outline" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
                    {t.table.prev}
                  </Button>
                  <Button
                    variant="outline"
                    disabled={page >= totalPages}
                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  >
                    {t.table.next}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Drawer open={drawerMode !== null} onClose={closeDrawer} title={drawerMode === "edit" ? t.form.editTitle : t.form.createTitle} description={drawerMode === "edit" ? t.form.editDescription : t.form.createDescription}>
        <form onSubmit={onSubmit} className="space-y-6">
          <DrawerSection title={t.form.sections.basic}>
            <div className="grid gap-4 md:grid-cols-2">
              <TextField label={t.form.fields.title} value={form.title} onChange={(value) => setForm((current) => ({ ...current, title: value }))} required />
              <TextField label={t.form.fields.sku} value={form.sku} onChange={(value) => setForm((current) => ({ ...current, sku: value }))} />
              <TextField label={t.form.fields.keyword} value={form.keyword} onChange={(value) => setForm((current) => ({ ...current, keyword: value }))} />
              <TextField label={t.form.fields.coupangUrl} value={form.coupang_url} onChange={(value) => setForm((current) => ({ ...current, coupang_url: value }))} />
              <TextField label={t.form.fields.imageUrl} value={form.image_url} onChange={(value) => setForm((current) => ({ ...current, image_url: value }))} />
              <SelectField
                label={t.form.fields.category}
                value={form.category}
                onChange={(value) => setForm((current) => ({ ...current, category: value as OpportunityCategory }))}
                options={categoryOptions.filter((option) => option.value !== "all")}
              />
              <SelectField
                label={t.form.fields.direction}
                value={form.business_type}
                onChange={(value) => setForm((current) => ({ ...current, business_type: value as OpportunityDirection }))}
                options={directionOptions.filter((option) => option.value !== "all")}
              />
              <SelectField
                label={t.form.fields.status}
                value={form.status}
                onChange={(value) => setForm((current) => ({ ...current, status: value as OpportunityStatus }))}
                options={statusOptions.filter((option) => option.value !== "all")}
              />
            </div>
          </DrawerSection>

          <DrawerSection title={t.form.sections.market}>
            <div className="grid gap-4 md:grid-cols-2">
              <NumberField label={t.form.fields.price} value={form.price} onChange={(value) => setForm((current) => ({ ...current, price: value }))} />
              <NumberField label={t.form.fields.reviewCount} value={form.review_count} onChange={(value) => setForm((current) => ({ ...current, review_count: value }))} />
              <NumberField label={t.form.fields.rating} value={form.rating} step="0.1" onChange={(value) => setForm((current) => ({ ...current, rating: value }))} />
              <NumberField label={t.form.fields.competitorCount} value={form.competitor_count} onChange={(value) => setForm((current) => ({ ...current, competitor_count: value }))} />
              <SelectField
                label={t.form.fields.marketHeat}
                value={form.market_heat}
                onChange={(value) => setForm((current) => ({ ...current, market_heat: value as OpportunityLevel }))}
                options={["low", "medium", "high"].map((value) => ({ value, label: t.options.level[value as OpportunityLevel] }))}
              />
              <SelectField
                label={t.form.fields.competitionLevel}
                value={form.competition_level}
                onChange={(value) => setForm((current) => ({ ...current, competition_level: value as OpportunityLevel }))}
                options={["low", "medium", "high"].map((value) => ({ value, label: t.options.level[value as OpportunityLevel] }))}
              />
              <TextField label={t.form.fields.demandStability} value={form.demand_stability} onChange={(value) => setForm((current) => ({ ...current, demand_stability: value }))} />
              <TextField label={t.form.fields.seasonality} value={form.seasonality} onChange={(value) => setForm((current) => ({ ...current, seasonality: value }))} />
              <TextField
                label={t.form.fields.competitorPriceRange}
                value={form.competitor_price_range}
                onChange={(value) => setForm((current) => ({ ...current, competitor_price_range: value }))}
              />
              <NumberField label={t.form.fields.topSellerCount} value={form.top_seller_count} onChange={(value) => setForm((current) => ({ ...current, top_seller_count: value }))} />
              <TextAreaField
                label={t.form.fields.reviewIssueSummary}
                value={form.review_issue_summary}
                onChange={(value) => setForm((current) => ({ ...current, review_issue_summary: value }))}
              />
              <TextAreaField
                label={t.form.fields.negativeReviewKeywords}
                value={form.negative_review_keywords}
                onChange={(value) => setForm((current) => ({ ...current, negative_review_keywords: value }))}
              />
              <TextAreaField
                label={t.form.fields.improvementPoints}
                value={form.improvement_points}
                onChange={(value) => setForm((current) => ({ ...current, improvement_points: value }))}
              />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <CheckboxField
                label={t.form.fields.longTermFit}
                checked={form.long_term_fit}
                onChange={(checked) => setForm((current) => ({ ...current, long_term_fit: checked }))}
              />
              <CheckboxField
                label={t.form.fields.shortTermFit}
                checked={form.short_term_test_fit}
                onChange={(checked) => setForm((current) => ({ ...current, short_term_test_fit: checked }))}
              />
            </div>
          </DrawerSection>

          <DrawerSection title={t.form.sections.profit}>
            <div className="grid gap-4 md:grid-cols-2">
              <NumberField
                label={t.form.fields.purchaseCost}
                value={form.estimated_purchase_cost}
                onChange={(value) => setForm((current) => ({ ...current, estimated_purchase_cost: value }))}
              />
              <NumberField
                label={t.form.fields.shippingCost}
                value={form.estimated_shipping_cost}
                onChange={(value) => setForm((current) => ({ ...current, estimated_shipping_cost: value }))}
              />
              <NumberField
                label={t.form.fields.localDeliveryCost}
                value={form.estimated_local_delivery_cost}
                onChange={(value) => setForm((current) => ({ ...current, estimated_local_delivery_cost: value }))}
              />
              <NumberField
                label={t.form.fields.platformFeeRate}
                value={form.platform_fee_rate}
                step="0.1"
                onChange={(value) => setForm((current) => ({ ...current, platform_fee_rate: value }))}
              />
              <NumberField
                label={t.form.fields.adCost}
                value={form.estimated_ad_cost}
                onChange={(value) => setForm((current) => ({ ...current, estimated_ad_cost: value }))}
              />
              <NumberField
                label={t.form.fields.salePrice}
                value={form.estimated_sale_price}
                onChange={(value) => setForm((current) => ({ ...current, estimated_sale_price: value }))}
              />
              <ReadOnlyField label={t.form.fields.margin} value={formatCurrency(computedMargin)} />
              <ReadOnlyField label={t.form.fields.marginRate} value={formatPercent(computedMarginRate)} />
            </div>
          </DrawerSection>

          <DrawerSection title={t.form.sections.risk}>
            <div className="grid gap-4 md:grid-cols-2">
              <SelectField
                label={t.form.fields.kcRisk}
                value={form.kc_risk}
                onChange={(value) => setForm((current) => ({ ...current, kc_risk: value as OpportunityLevel }))}
                options={["low", "medium", "high"].map((value) => ({ value, label: t.options.riskLabel[value as OpportunityLevel] }))}
              />
              <SelectField
                label={t.form.fields.volumeRisk}
                value={form.volume_weight_risk}
                onChange={(value) => setForm((current) => ({ ...current, volume_weight_risk: value as OpportunityLevel }))}
                options={["low", "medium", "high"].map((value) => ({ value, label: t.options.riskLabel[value as OpportunityLevel] }))}
              />
              <SelectField
                label={t.form.fields.returnRisk}
                value={form.return_risk}
                onChange={(value) => setForm((current) => ({ ...current, return_risk: value as OpportunityLevel }))}
                options={["low", "medium", "high"].map((value) => ({ value, label: t.options.riskLabel[value as OpportunityLevel] }))}
              />
              <SelectField
                label={t.form.fields.negativeReviewRisk}
                value={form.negative_review_risk}
                onChange={(value) => setForm((current) => ({ ...current, negative_review_risk: value as OpportunityLevel }))}
                options={["low", "medium", "high"].map((value) => ({ value, label: t.options.riskLabel[value as OpportunityLevel] }))}
              />
              <SelectField
                label={t.form.fields.priceWarRisk}
                value={form.price_war_risk}
                onChange={(value) => setForm((current) => ({ ...current, price_war_risk: value as OpportunityLevel }))}
                options={["low", "medium", "high"].map((value) => ({ value, label: t.options.riskLabel[value as OpportunityLevel] }))}
              />
              <SelectField
                label={t.form.fields.supplyChainRisk}
                value={form.supply_chain_risk}
                onChange={(value) => setForm((current) => ({ ...current, supply_chain_risk: value as OpportunityLevel }))}
                options={["low", "medium", "high"].map((value) => ({ value, label: t.options.riskLabel[value as OpportunityLevel] }))}
              />
              <SelectField
                label={t.form.fields.nextAction}
                value={form.next_action}
                onChange={(value) => setForm((current) => ({ ...current, next_action: value as OpportunityNextAction }))}
                options={nextActionOptions}
              />
              <TextAreaField label={t.form.fields.notes} value={form.notes} onChange={(value) => setForm((current) => ({ ...current, notes: value }))} />
            </div>
          </DrawerSection>

          <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-5">
            <Button type="button" variant="outline" onClick={closeDrawer}>
              {t.form.cancel}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? t.form.save : drawerMode === "edit" ? t.form.update : t.form.create}
            </Button>
          </div>
        </form>
      </Drawer>

      <Drawer open={Boolean(detailItem)} onClose={() => setDetailItem(null)} title={t.detail.title} description={t.detail.description}>
        {detailItem ? (
          <div className="space-y-6">
            <DrawerSection title={t.detail.sections.basic}>
              <div className="flex items-start gap-4">
                <Thumbnail src={detailItem.image_url} title={detailItem.title} large />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold tracking-[-0.02em] text-slate-950">{detailItem.title}</h3>
                    <Badge tone="default">{t.options.direction[detailItem.business_type]}</Badge>
                    <Badge tone={detailItem.risk_level === "high" ? "danger" : detailItem.risk_level === "medium" ? "warning" : "success"}>
                      {detailItem.risk_level ? t.options.riskLabel[detailItem.risk_level] : "-"}
                    </Badge>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <DetailRow label={t.form.fields.category} value={t.options.category[detailItem.category]} />
                    <DetailRow label={t.detail.labels.price} value={formatCurrency(detailItem.price)} />
                    <DetailRow label={t.detail.labels.reviewCount} value={formatNumber(detailItem.review_count)} />
                    <DetailRow label={t.detail.labels.rating} value={formatNumber(detailItem.rating)} />
                    <DetailRow label={t.detail.labels.competitorCount} value={formatNumber(detailItem.competitor_count)} />
                    <DetailRow label={t.detail.labels.enteredBy} value={detailItem.owner || "-"} />
                    <DetailRow label="SKU" value={detailItem.sku || "-"} />
                    <DetailRow label={t.detail.labels.updatedAt} value={formatDate(detailItem.updated_at)} />
                  </div>
                  {detailItem.coupang_url ? (
                    <a
                      href={detailItem.coupang_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-950"
                    >
                      {t.detail.openLink}
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  ) : null}
                </div>
              </div>
            </DrawerSection>

            <DrawerSection title={t.detail.sections.market}>
              <div className="grid gap-3 sm:grid-cols-2">
                <DetailRow label={t.detail.labels.marketHeat} value={detailItem.market_heat ? t.options.level[detailItem.market_heat] : "-"} />
                <DetailRow label={t.detail.labels.demandStability} value={detailItem.demand_stability || "-"} />
                <DetailRow label={t.detail.labels.seasonality} value={detailItem.seasonality || "-"} />
                <DetailRow label={t.detail.labels.longTermFit} value={detailItem.long_term_fit ? t.options.boolean.yes : t.options.boolean.no} />
                <DetailRow label={t.detail.labels.shortTermFit} value={detailItem.short_term_test_fit ? t.options.boolean.yes : t.options.boolean.no} />
              </div>
            </DrawerSection>

            <DrawerSection title={t.detail.sections.competitor}>
              <div className="grid gap-3 sm:grid-cols-2">
                <DetailRow label={t.detail.labels.competitorPriceRange} value={detailItem.competitor_price_range || "-"} />
                <DetailRow label={t.detail.labels.topSellerCount} value={formatNumber(detailItem.top_seller_count)} />
                <DetailRow label={t.detail.labels.reviewIssueSummary} value={detailItem.review_issue_summary || "-"} multiline />
                <DetailRow label={t.detail.labels.negativeReviewKeywords} value={detailItem.negative_review_keywords || "-"} multiline />
                <DetailRow label={t.detail.labels.improvementPoints} value={detailItem.improvement_points || "-"} multiline />
              </div>
            </DrawerSection>

            <DrawerSection title={t.detail.sections.profit}>
              <div className="grid gap-3 sm:grid-cols-2">
                <DetailRow label={t.detail.labels.purchaseCost} value={formatCurrency(detailItem.estimated_purchase_cost)} />
                <DetailRow label={t.detail.labels.shippingCost} value={formatCurrency(detailItem.estimated_shipping_cost)} />
                <DetailRow label={t.detail.labels.localDeliveryCost} value={formatCurrency(detailItem.estimated_local_delivery_cost)} />
                <DetailRow label={t.detail.labels.platformFee} value={`${formatNumber(detailItem.platform_fee_rate)}%`} />
                <DetailRow label={t.detail.labels.adCost} value={formatCurrency(detailItem.estimated_ad_cost)} />
                <DetailRow label={t.detail.labels.salePrice} value={formatCurrency(detailItem.estimated_sale_price)} />
                <DetailRow label={t.detail.labels.margin} value={formatCurrency(detailItem.estimated_margin)} />
                <DetailRow label={t.detail.labels.marginRate} value={formatPercent(Number(detailItem.estimated_margin_rate ?? 0))} />
              </div>
            </DrawerSection>

            <DrawerSection title={t.detail.sections.risk}>
              <div className="grid gap-3 sm:grid-cols-2">
                <DetailRow label={t.detail.labels.kcRisk} value={detailItem.kc_risk ? t.options.riskLabel[detailItem.kc_risk] : "-"} />
                <DetailRow label={t.detail.labels.volumeRisk} value={detailItem.volume_weight_risk ? t.options.riskLabel[detailItem.volume_weight_risk] : "-"} />
                <DetailRow label={t.detail.labels.returnRisk} value={detailItem.return_risk ? t.options.riskLabel[detailItem.return_risk] : "-"} />
                <DetailRow label={t.detail.labels.negativeReviewRisk} value={detailItem.negative_review_risk ? t.options.riskLabel[detailItem.negative_review_risk] : "-"} />
                <DetailRow label={t.detail.labels.priceWarRisk} value={detailItem.price_war_risk ? t.options.riskLabel[detailItem.price_war_risk] : "-"} />
                <DetailRow label={t.detail.labels.supplyChainRisk} value={detailItem.supply_chain_risk ? t.options.riskLabel[detailItem.supply_chain_risk] : "-"} />
              </div>
            </DrawerSection>
          </div>
        ) : null}
      </Drawer>
    </>
  );
}

function EmptyOpportunityState({
  locale,
  onAdd,
  onImport,
}: {
  locale: "zh" | "ko";
  onAdd: () => void;
  onImport: () => void;
}) {
  const t = getDashboardOpportunityCopy(locale);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px]">
      <Card>
        <CardContent className="flex flex-col items-start p-8 sm:p-10">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-500">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h2 className="mt-6 text-2xl font-semibold tracking-[-0.03em] text-slate-950">{t.empty.title}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">{t.empty.description}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button onClick={onAdd}>
              <FolderPlus className="h-4 w-4" />
              {t.add}
            </Button>
            <Button variant="outline" onClick={onImport}>
              <Import className="h-4 w-4" />
              {t.import}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-5">
          <h3 className="text-base font-semibold tracking-[-0.02em] text-slate-950">{t.empty.guideTitle}</h3>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          <div className="grid gap-2">
            {t.empty.guideItems.map((item) => (
              <div key={item} className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm text-slate-600">
                {item}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Banner({
  tone,
  message,
  onClose,
}: {
  tone: "default" | "success" | "danger";
  message: string;
  onClose: () => void;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 rounded-2xl border px-4 py-3 text-sm",
        tone === "default" && "border-slate-200 bg-white text-slate-600",
        tone === "success" && "border-emerald-200 bg-emerald-50 text-emerald-800",
        tone === "danger" && "border-rose-200 bg-rose-50 text-rose-800",
      )}
    >
      <p className="leading-6">{message}</p>
      <button type="button" onClick={onClose} className="text-current/70 transition hover:text-current">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function MetricCard({
  label,
  note,
  value,
  tone = "default",
  active,
  onClick,
}: {
  label: string;
  note: string;
  value: number;
  tone?: "default" | "success" | "warning" | "danger";
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="text-left">
      <Card className={cn("h-full transition", active && "border-slate-900 shadow-[0_0_0_1px_rgba(15,23,42,0.06)]")}>
        <CardContent className="flex h-full flex-col justify-between gap-5 p-5">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              KPI
            </span>
          </div>
          <div>
            <p
              className={cn(
                "text-[34px] font-semibold tracking-[-0.04em] text-slate-950",
                tone === "success" && "text-emerald-700",
                tone === "warning" && "text-amber-700",
                tone === "danger" && "text-rose-700",
              )}
            >
              {value}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-500">{note}</p>
          </div>
        </CardContent>
      </Card>
    </button>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="block">
      <span className="mb-2 inline-flex items-center gap-2 text-xs font-medium text-slate-500">
        <Filter className="h-3.5 w-3.5" />
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-950/5"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function TableHeaderCell({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" }) {
  return (
    <th className={cn("px-6 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400", align === "right" && "text-right")}>
      {children}
    </th>
  );
}

function SortableHeader({
  label,
  active,
  direction,
  onClick,
}: {
  label: string;
  active: boolean;
  direction: SortDirection;
  onClick: () => void;
}) {
  return (
    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
      <button type="button" onClick={onClick} className="inline-flex items-center gap-2 transition hover:text-slate-600">
        {label}
        <ArrowDownUp className={cn("h-3.5 w-3.5", active && "text-slate-700")} />
        {active ? <span className="text-[10px] text-slate-500">{direction === "asc" ? "↑" : "↓"}</span> : null}
      </button>
    </th>
  );
}

function Cell({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn("border-t border-slate-200 px-6 py-4 align-top text-sm text-slate-600", className)}>{children}</td>;
}

function Badge({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "default" | "success" | "warning" | "danger";
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
        tone === "default" && "bg-slate-100 text-slate-700",
        tone === "success" && "bg-emerald-50 text-emerald-700",
        tone === "warning" && "bg-amber-50 text-amber-700",
        tone === "danger" && "bg-rose-50 text-rose-700",
      )}
    >
      {children}
    </span>
  );
}

function Drawer({
  open,
  onClose,
  title,
  description,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/22 backdrop-blur-[1px]">
      <button type="button" className="h-full flex-1 cursor-default" onClick={onClose} aria-label={title} />
      <div className="flex h-full w-full max-w-[720px] flex-col border-l border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-5 sm:px-6">
          <div>
            <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
      </div>
    </div>
  );
}

function DrawerSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5">
      <h3 className="text-sm font-semibold tracking-[-0.02em] text-slate-950">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function TextField({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-600">
        {label}
        {required ? <span className="ml-1 text-rose-500">*</span> : null}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-950/5"
      />
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
  step,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-600">{label}</span>
      <input
        type="number"
        value={Number.isFinite(value) ? value : 0}
        step={step}
        onChange={(event) => onChange(Number(event.target.value || 0))}
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-950/5"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-600">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-950/5"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block md:col-span-2">
      <span className="mb-2 block text-sm font-medium text-slate-600">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-950/5"
      />
    </label>
  );
}

function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 rounded border-slate-300" />
      {label}
    </label>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="mb-2 block text-sm font-medium text-slate-600">{label}</span>
      <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-slate-100 px-3 text-sm font-medium text-slate-700">{value}</div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div className={cn("rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-3", multiline && "sm:col-span-2")}>
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm leading-6 text-slate-700">{value}</p>
    </div>
  );
}

function Thumbnail({ src, title, large = false }: { src: string | null; title: string; large?: boolean }) {
  if (src) {
    return (
      <img
        src={src}
        alt={title}
        className={cn(
          "rounded-2xl border border-slate-200 bg-slate-100 object-cover",
          large ? "h-24 w-24" : "h-14 w-14 shrink-0",
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 text-sm font-semibold text-slate-500",
        large ? "h-24 w-24" : "h-14 w-14 shrink-0",
      )}
    >
      {title.slice(0, 1).toUpperCase()}
    </div>
  );
}

function mapRecordToForm(item: ProductOpportunityRecord): ProductOpportunityInput {
  return {
    title: item.title ?? "",
    sku: item.sku ?? "",
    keyword: item.keyword ?? "",
    category: item.category,
    business_type: item.business_type,
    coupang_url: item.coupang_url ?? "",
    image_url: item.image_url ?? "",
    price: Number(item.price ?? 0),
    review_count: Number(item.review_count ?? 0),
    rating: Number(item.rating ?? 0),
    competitor_count: Number(item.competitor_count ?? 0),
    estimated_purchase_cost: Number(item.estimated_purchase_cost ?? 0),
    estimated_shipping_cost: Number(item.estimated_shipping_cost ?? 0),
    estimated_local_delivery_cost: Number(item.estimated_local_delivery_cost ?? 0),
    platform_fee_rate: Number(item.platform_fee_rate ?? 0),
    estimated_ad_cost: Number(item.estimated_ad_cost ?? 0),
    estimated_sale_price: Number(item.estimated_sale_price ?? 0),
    market_heat: item.market_heat ?? "medium",
    competition_level: item.competition_level ?? "medium",
    kc_risk: item.kc_risk ?? "low",
    volume_weight_risk: item.volume_weight_risk ?? "low",
    return_risk: item.return_risk ?? "low",
    negative_review_risk: item.negative_review_risk ?? "low",
    price_war_risk: item.price_war_risk ?? "low",
    supply_chain_risk: item.supply_chain_risk ?? "low",
    notes: item.notes ?? "",
    status: item.status,
    next_action: item.next_action ?? "collect_competitors",
    demand_stability: item.demand_stability ?? "",
    seasonality: item.seasonality ?? "",
    long_term_fit: Boolean(item.long_term_fit),
    short_term_test_fit: Boolean(item.short_term_test_fit),
    competitor_price_range: item.competitor_price_range ?? "",
    top_seller_count: Number(item.top_seller_count ?? 0),
    review_issue_summary: item.review_issue_summary ?? "",
    negative_review_keywords: item.negative_review_keywords ?? "",
    improvement_points: item.improvement_points ?? "",
  };
}

function toggleMetric(
  next: MetricKey,
  current: MetricKey | null,
  setMetricFilter: (value: MetricKey | null) => void,
) {
  setMetricFilter(current === next ? null : next);
}

function toggleSort(
  nextKey: SortKey,
  currentKey: SortKey,
  currentDirection: SortDirection,
  setSortKey: (value: SortKey) => void,
  setSortDirection: (value: SortDirection) => void,
) {
  if (currentKey === nextKey) {
    setSortDirection(currentDirection === "asc" ? "desc" : "asc");
    return;
  }
  setSortKey(nextKey);
  setSortDirection("desc");
}

function getSortableValue(item: ProductOpportunityRecord, key: SortKey) {
  if (key === "updated_at") return new Date(item.updated_at).getTime();
  return Number(item[key] ?? 0);
}

function formatDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}-${`${date.getDate()}`.padStart(2, "0")}`;
}

function formatNumber(value: number | string | null | undefined) {
  const number = Number(value ?? 0);
  if (Number.isNaN(number)) return "-";
  return new Intl.NumberFormat("en-US").format(number);
}

function formatCurrency(value: number | string | null | undefined) {
  const number = Number(value ?? 0);
  if (Number.isNaN(number)) return "-";
  return `₩${new Intl.NumberFormat("en-US").format(Math.round(number))}`;
}

function formatPercent(value: number) {
  if (!Number.isFinite(value)) return "0%";
  return `${Math.round(value * 10) / 10}%`;
}

function interpolate(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce((result, [key, value]) => result.replaceAll(`{${key}}`, value), template);
}
