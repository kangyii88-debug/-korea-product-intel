create extension if not exists "pgcrypto";

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text not null default 'viewer',
  created_at timestamptz default now(),
  unique(organization_id, user_id)
);

create table if not exists platforms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text unique not null,
  country text default 'KR',
  base_url text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  platform_id uuid references platforms(id),
  parent_id uuid references categories(id),
  name text not null,
  path text,
  external_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  canonical_name text not null,
  brand text,
  category_id uuid references categories(id),
  primary_image_url text,
  status text default 'pending_analysis',
  decision text,
  bookmark boolean default false,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists product_sources (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  platform_id uuid references platforms(id),
  source_url text not null,
  external_product_id text,
  source_title text,
  source_brand text,
  seller_name text,
  seller_type text,
  delivery_type text,
  image_urls jsonb default '[]',
  raw_payload jsonb default '{}',
  first_collected_at timestamptz,
  last_collected_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists product_metrics (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  product_source_id uuid references product_sources(id) on delete cascade,
  collected_at timestamptz not null default now(),
  price numeric,
  discount_price numeric,
  estimated_monthly_sales int,
  review_count int,
  rating numeric,
  rank int,
  favorites int,
  keyword_rankings jsonb default '{}',
  size text,
  colors text[],
  material text,
  weight text,
  package_size text,
  selling_points text[],
  keywords text[],
  raw_metrics jsonb default '{}',
  created_at timestamptz default now()
);

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  product_source_id uuid references product_sources(id) on delete cascade,
  platform_id uuid references platforms(id),
  external_review_id text,
  rating numeric,
  review_text text,
  review_images text[],
  review_date date,
  option_name text,
  helpful_count int,
  is_negative boolean,
  language text default 'ko',
  raw_payload jsonb default '{}',
  created_at timestamptz default now()
);

create table if not exists review_translations (
  id uuid primary key default gen_random_uuid(),
  review_id uuid references reviews(id) on delete cascade,
  source_language text default 'ko',
  target_language text default 'zh',
  translated_text text not null,
  provider text,
  model_name text,
  created_at timestamptz default now()
);

create table if not exists review_keywords (
  id uuid primary key default gen_random_uuid(),
  review_id uuid references reviews(id) on delete cascade,
  product_id uuid references products(id) on delete cascade,
  keyword text not null,
  language text default 'ko',
  sentiment text,
  issue_type text,
  weight numeric default 1,
  created_at timestamptz default now()
);

create table if not exists review_sentiments (
  id uuid primary key default gen_random_uuid(),
  review_id uuid references reviews(id) on delete cascade,
  product_id uuid references products(id) on delete cascade,
  sentiment text not null,
  score numeric,
  purchase_impact boolean,
  repurchase_impact boolean,
  created_at timestamptz default now()
);

create table if not exists ai_agents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text unique not null,
  description text,
  provider text,
  model_name text,
  system_prompt text,
  prompt_version text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists ai_reports (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  version int not null,
  report_type text not null,
  title text,
  content jsonb not null,
  input_snapshot jsonb default '{}',
  model_provider text,
  model_name text,
  prompt_version text,
  status text default 'completed',
  created_by_agent_id uuid references ai_agents(id),
  created_at timestamptz default now(),
  unique(product_id, report_type, version)
);

create table if not exists review_analysis (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  ai_report_id uuid references ai_reports(id) on delete set null,
  version int not null,
  issue_type text not null,
  issue_count int,
  issue_ratio numeric,
  severity text,
  affects_purchase boolean,
  affects_repurchase boolean,
  evidence_review_ids uuid[],
  summary text,
  optimization_suggestion text,
  created_by_agent_id uuid references ai_agents(id),
  created_at timestamptz default now()
);

create table if not exists development_plans (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  ai_report_id uuid references ai_reports(id) on delete set null,
  version int not null,
  positioning text,
  target_customer text,
  market_opportunity text,
  core_pain_points text[],
  improvement_directions text[],
  suggested_size text,
  suggested_colors text[],
  suggested_material text,
  suggested_packaging text,
  suggested_sale_price numeric,
  suggested_purchase_price numeric,
  suggested_first_batch_qty int,
  estimated_margin_rate numeric,
  estimated_payback_cycle_days int,
  competition_strength text,
  development_difficulty text,
  risk_level text,
  execution_priority text,
  status text default 'idea',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists ai_scores (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  version int not null,
  market_demand_score int,
  competition_score int,
  profit_score int,
  review_quality_score int,
  review_optimization_score int,
  supply_chain_score int,
  logistics_score int,
  certification_risk_score int,
  seasonality_risk_score int,
  recommendation_index int,
  final_grade text,
  reasoning jsonb default '[]',
  created_by_agent_id uuid references ai_agents(id),
  created_at timestamptz default now()
);

create table if not exists collection_tasks (
  id uuid primary key default gen_random_uuid(),
  platform_id uuid references platforms(id),
  task_type text,
  keyword text,
  category_id uuid references categories(id),
  status text default 'idle',
  schedule_cron text,
  last_run_at timestamptz,
  next_run_at timestamptz,
  config jsonb default '{}',
  result_summary jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists collection_runs (
  id text primary key,
  started_at timestamptz not null,
  finished_at timestamptz,
  duration_ms int,
  targets jsonb default '[]',
  status text,
  errors jsonb default '[]',
  result_summary jsonb default '{}',
  created_at timestamptz default now()
);

create table if not exists collected_product_snapshots (
  id uuid primary key default gen_random_uuid(),
  collection_run_id text references collection_runs(id) on delete cascade,
  platform text not null,
  source_url text not null,
  external_product_id text,
  product_name text,
  link text,
  price numeric,
  discount_price numeric,
  rating numeric,
  review_count int,
  review_growth int,
  sales_label text,
  delivery_type text,
  is_rocket boolean,
  images jsonb default '[]',
  title text,
  detail_selling_points jsonb default '[]',
  qna jsonb default '[]',
  brand text,
  sizes text[],
  colors text[],
  material text,
  raw jsonb default '{}',
  collected_at timestamptz default now()
);

create table if not exists curtain_industry_records (
  id uuid primary key default gen_random_uuid(),
  curtain_type text not null,
  product_id uuid references products(id) on delete set null,
  product_name text not null,
  brand text,
  sizes text[],
  colors text[],
  material text,
  price numeric,
  review_count int,
  negative_review_count int,
  estimated_monthly_sales int,
  collected_at timestamptz default now()
);

create table if not exists curtain_product_profiles (
  id uuid primary key default gen_random_uuid(),
  curtain_type text not null,
  platform text not null,
  external_product_id text,
  product_name text not null,
  brand text,
  link text not null,
  image text,
  price numeric,
  discount_price numeric,
  rating numeric,
  review_count int,
  review_growth int,
  sales_label text,
  colors text[],
  sizes text[],
  material text,
  installation_method text,
  delivery_type text,
  seller_type text,
  first_seen_at timestamptz default now(),
  last_seen_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(platform, link)
);

create table if not exists curtain_size_stats (
  id uuid primary key default gen_random_uuid(),
  curtain_type text,
  size_value text not null,
  product_count int default 0,
  estimated_sales int default 0,
  review_count int default 0,
  negative_review_count int default 0,
  return_mention_count int default 0,
  growth_score numeric default 0,
  opportunity_score numeric default 0,
  recommended_for_development boolean default false,
  reasons jsonb default '[]',
  calculated_at timestamptz default now()
);

create table if not exists curtain_color_stats (
  id uuid primary key default gen_random_uuid(),
  curtain_type text,
  color_value text not null,
  product_count int default 0,
  estimated_sales int default 0,
  review_count int default 0,
  negative_review_count int default 0,
  return_mention_count int default 0,
  growth_score numeric default 0,
  opportunity_score numeric default 0,
  recommended_for_development boolean default false,
  reasons jsonb default '[]',
  calculated_at timestamptz default now()
);

create table if not exists curtain_negative_cases (
  id uuid primary key default gen_random_uuid(),
  curtain_profile_id uuid references curtain_product_profiles(id) on delete cascade,
  product_name text,
  issue_type text not null,
  issue_label text,
  review_text text,
  rating numeric,
  sentiment text,
  affects_purchase boolean,
  affects_repurchase boolean,
  optimization_suggestion text,
  collected_at timestamptz default now()
);

create table if not exists product_opportunities (
  id text primary key,
  product_id uuid references products(id) on delete set null,
  product_name text not null,
  opportunity_type text not null,
  opportunity_pool text,
  platform text not null,
  category text,
  evidence jsonb default '[]',
  estimated_impact_score int,
  opportunity_score jsonb default '{}',
  opportunity_level text,
  opportunity_reasons jsonb default '[]',
  why_worth_attention text,
  why_growing text,
  biggest_market_opportunity text,
  biggest_risk text,
  china_supply_chain_fit boolean,
  korea_market_fit boolean,
  test_fit boolean,
  estimated_profit_margin numeric,
  competition_level text,
  development_difficulty text,
  risk_level text,
  recommended_action text,
  discovered_at timestamptz default now(),
  status text default 'new',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists product_decision_profiles (
  id text primary key,
  product_id uuid references products(id) on delete set null,
  product_name text not null,
  platform text not null,
  category text,
  product_opportunity_index int,
  development_priority text,
  decision text,
  action text,
  can_do boolean,
  why text,
  biggest_opportunity text,
  biggest_risk text,
  suggested_sale_price numeric,
  suggested_purchase_price numeric,
  suggested_first_batch_quantity int,
  suggested_test_cycle_days int,
  estimated_margin_rate numeric,
  estimated_payback_cycle_days int,
  score jsonb default '{}',
  lifecycle_forecast jsonb default '{}',
  next_step text,
  generated_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists new_product_discovery_signals (
  id text primary key,
  product_id uuid references products(id) on delete set null,
  product_name text not null,
  platform text not null,
  signal_type text not null,
  evidence jsonb default '[]',
  severity text,
  opportunity_score int,
  discovered_at timestamptz default now(),
  auto_entered_pool text,
  created_at timestamptz default now()
);

create table if not exists market_trend_snapshots (
  id text primary key,
  snapshot_date date not null,
  platform text not null,
  category text,
  product_count int,
  average_price numeric,
  average_discount_price numeric,
  average_rating numeric,
  total_review_count int,
  total_estimated_sales int,
  average_rank numeric,
  price_change_index numeric,
  review_change_index numeric,
  rank_change_index numeric,
  created_at timestamptz default now()
);

create table if not exists market_product_trends (
  id text primary key,
  product_id uuid references products(id) on delete set null,
  product_name text not null,
  platform text not null,
  category text,
  growth_window_days int not null,
  growth_speed numeric,
  growth_level text,
  growth_reasons jsonb default '[]',
  calculated_at timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists market_opportunity_radar (
  id uuid primary key default gen_random_uuid(),
  generated_at timestamptz default now(),
  new_opportunities jsonb default '[]',
  new_trends jsonb default '[]',
  new_categories jsonb default '[]',
  growing_categories jsonb default '[]',
  declining_categories jsonb default '[]'
);

create table if not exists competitor_intelligence_reports (
  id uuid primary key default gen_random_uuid(),
  generated_at timestamptz default now(),
  growing_brands jsonb default '[]',
  declining_brands jsonb default '[]',
  review_growth_leaders jsonb default '[]',
  ranking_movers jsonb default '[]',
  price_movers jsonb default '[]'
);

create table if not exists market_reports (
  id uuid primary key default gen_random_uuid(),
  report_key text unique not null,
  capability text not null default 'market-research',
  title text not null,
  query text,
  summary text,
  output_json jsonb default '{}',
  output_markdown text,
  output_csv text,
  source_mode text default 'standby',
  provider text default 'perplexity',
  model_name text,
  status text default 'standby',
  generated_at timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists trend_reports (
  id uuid primary key default gen_random_uuid(),
  report_key text unique not null,
  capability text not null default 'trend-discovery',
  title text not null,
  query text,
  summary text,
  output_json jsonb default '{}',
  output_markdown text,
  output_csv text,
  source_mode text default 'standby',
  provider text default 'perplexity',
  model_name text,
  status text default 'standby',
  generated_at timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists competitor_reports (
  id uuid primary key default gen_random_uuid(),
  report_key text unique not null,
  capability text not null default 'competitor-analysis',
  title text not null,
  query text,
  summary text,
  output_json jsonb default '{}',
  output_markdown text,
  output_csv text,
  source_mode text default 'standby',
  provider text default 'perplexity',
  model_name text,
  status text default 'standby',
  generated_at timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists opportunity_reports (
  id uuid primary key default gen_random_uuid(),
  report_key text unique not null,
  capability text not null default 'new-product-discovery',
  title text not null,
  query text,
  summary text,
  output_json jsonb default '{}',
  output_markdown text,
  output_csv text,
  source_mode text default 'standby',
  provider text default 'perplexity',
  model_name text,
  status text default 'standby',
  generated_at timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists market_alerts (
  id text primary key,
  alert_type text not null,
  severity text,
  title text not null,
  message text,
  product_id uuid references products(id) on delete set null,
  platform text,
  evidence jsonb default '[]',
  is_resolved boolean default false,
  created_at timestamptz default now(),
  resolved_at timestamptz
);

create table if not exists ai_logs (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references ai_agents(id),
  product_id uuid references products(id) on delete cascade,
  task_type text,
  input jsonb default '{}',
  output jsonb default '{}',
  status text default 'completed',
  error_message text,
  token_usage jsonb default '{}',
  cost numeric,
  latency_ms int,
  created_at timestamptz default now()
);

create index if not exists idx_products_status on products(status);
create index if not exists idx_organization_members_user on organization_members(user_id);
create index if not exists idx_organization_members_org on organization_members(organization_id);
create index if not exists idx_products_decision on products(decision);
create index if not exists idx_product_sources_platform on product_sources(platform_id);
create index if not exists idx_product_metrics_product_time on product_metrics(product_id, collected_at desc);
create index if not exists idx_reviews_product on reviews(product_id);
create index if not exists idx_reviews_negative on reviews(is_negative);
create index if not exists idx_reviews_language on reviews(language);
create index if not exists idx_review_keywords_product_keyword on review_keywords(product_id, keyword);
create index if not exists idx_review_sentiments_product on review_sentiments(product_id, sentiment);
create index if not exists idx_ai_reports_product_type_version on ai_reports(product_id, report_type, version desc);
create index if not exists idx_ai_scores_product_version on ai_scores(product_id, version desc);
create index if not exists idx_ai_scores_grade on ai_scores(final_grade);
create index if not exists idx_ai_logs_product_time on ai_logs(product_id, created_at desc);
create index if not exists idx_collection_runs_time on collection_runs(started_at desc);
create index if not exists idx_collected_snapshots_platform_time on collected_product_snapshots(platform, collected_at desc);
create index if not exists idx_curtain_records_type_time on curtain_industry_records(curtain_type, collected_at desc);
create index if not exists idx_curtain_profiles_type_time on curtain_product_profiles(curtain_type, updated_at desc);
create index if not exists idx_curtain_profiles_platform_link on curtain_product_profiles(platform, link);
create index if not exists idx_curtain_size_stats_value_score on curtain_size_stats(size_value, opportunity_score desc);
create index if not exists idx_curtain_color_stats_value_score on curtain_color_stats(color_value, opportunity_score desc);
create index if not exists idx_curtain_negative_cases_issue on curtain_negative_cases(issue_type, collected_at desc);
create index if not exists idx_product_opportunities_type_score on product_opportunities(opportunity_type, estimated_impact_score desc);
create index if not exists idx_product_opportunities_pool_score on product_opportunities(opportunity_pool, estimated_impact_score desc);
create index if not exists idx_product_opportunities_level_score on product_opportunities(opportunity_level, estimated_impact_score desc);
create index if not exists idx_product_decision_profiles_index on product_decision_profiles(product_opportunity_index desc);
create index if not exists idx_product_decision_profiles_priority on product_decision_profiles(development_priority, product_opportunity_index desc);
create index if not exists idx_product_decision_profiles_action on product_decision_profiles(action, generated_at desc);
create index if not exists idx_new_product_discovery_signals_type_score on new_product_discovery_signals(signal_type, opportunity_score desc);
create index if not exists idx_market_trend_snapshots_date_platform on market_trend_snapshots(snapshot_date desc, platform);
create index if not exists idx_market_product_trends_window_speed on market_product_trends(growth_window_days, growth_speed desc);
create index if not exists idx_market_alerts_type_time on market_alerts(alert_type, created_at desc);
create index if not exists idx_market_alerts_unresolved on market_alerts(is_resolved, severity, created_at desc);
create index if not exists idx_market_reports_generated_at on market_reports(generated_at desc);
create index if not exists idx_trend_reports_generated_at on trend_reports(generated_at desc);
create index if not exists idx_competitor_reports_generated_at on competitor_reports(generated_at desc);
create index if not exists idx_opportunity_reports_generated_at on opportunity_reports(generated_at desc);
