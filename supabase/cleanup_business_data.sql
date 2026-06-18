do $$
declare
  target text;
  targets text[] := array[
    'proposal_drafts',
    'action_tasks',
    'perplexity_reports',
    'market_reports',
    'trend_reports',
    'competitor_reports',
    'opportunity_reports',
    'ai_logs',
    'ai_reports',
    'ai_scores',
    'review_analysis',
    'review_sentiments',
    'review_keywords',
    'review_translations',
    'reviews',
    'development_suggestions',
    'development_plans',
    'price_profit_calculations',
    'risk_assessments',
    'product_tests',
    'review_analyses',
    'competitor_products',
    'rg_candidates',
    'pb_candidates',
    'ai_decisions',
    'product_decision_profiles',
    'new_product_discovery_signals',
    'product_opportunities',
    'market_alerts',
    'competitor_intelligence_reports',
    'market_opportunity_radar',
    'market_product_trends',
    'market_trend_snapshots',
    'curtain_negative_cases',
    'curtain_price_stats',
    'curtain_material_stats',
    'curtain_color_stats',
    'curtain_size_stats',
    'curtain_product_profiles',
    'curtain_industry_records',
    'collected_product_snapshots',
    'collection_runs',
    'collection_logs',
    'collection_tasks',
    'product_metrics',
    'product_sources',
    'products',
    'categories',
    'platforms'
  ];
begin
  foreach target in array targets loop
    if exists (
      select 1
      from information_schema.tables
      where table_schema = 'public'
        and table_name = target
    ) then
      execute format('truncate table public.%I restart identity cascade', target);
    end if;
  end loop;
end $$;
