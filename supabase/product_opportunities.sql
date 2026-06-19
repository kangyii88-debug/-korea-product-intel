create extension if not exists pgcrypto;

create table if not exists public.product_opportunities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  sku text,
  keyword text,
  category text not null,
  business_type text not null,
  coupang_url text,
  image_url text,
  price numeric(12, 2),
  review_count integer default 0,
  rating numeric(4, 2) default 0,
  competitor_count integer default 0,
  estimated_purchase_cost numeric(12, 2) default 0,
  estimated_shipping_cost numeric(12, 2) default 0,
  estimated_local_delivery_cost numeric(12, 2) default 0,
  platform_fee_rate numeric(5, 2) default 0,
  estimated_ad_cost numeric(12, 2) default 0,
  estimated_sale_price numeric(12, 2) default 0,
  estimated_margin numeric(12, 2) default 0,
  estimated_margin_rate numeric(6, 2) default 0,
  market_heat text default 'medium',
  competition_level text default 'medium',
  profit_level text default 'medium',
  risk_level text default 'medium',
  kc_risk text default 'low',
  volume_weight_risk text default 'low',
  return_risk text default 'low',
  negative_review_risk text default 'low',
  price_war_risk text default 'low',
  supply_chain_risk text default 'low',
  score integer default 0,
  status text not null default 'pending_analysis',
  next_action text,
  owner text,
  deadline timestamptz,
  notes text,
  demand_stability text,
  seasonality text,
  long_term_fit boolean default false,
  short_term_test_fit boolean default true,
  competitor_price_range text,
  top_seller_count integer default 0,
  review_issue_summary text,
  negative_review_keywords text,
  improvement_points text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.product_opportunities add column if not exists sku text;

create index if not exists idx_product_opportunities_user_id on public.product_opportunities(user_id);
create index if not exists idx_product_opportunities_updated_at on public.product_opportunities(updated_at desc);

create or replace function public.set_product_opportunities_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_product_opportunities_updated_at on public.product_opportunities;
create trigger trg_product_opportunities_updated_at
before update on public.product_opportunities
for each row execute function public.set_product_opportunities_updated_at();

alter table public.product_opportunities enable row level security;

drop policy if exists "product_opportunities_select_own" on public.product_opportunities;
create policy "product_opportunities_select_own"
on public.product_opportunities
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "product_opportunities_insert_own" on public.product_opportunities;
create policy "product_opportunities_insert_own"
on public.product_opportunities
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "product_opportunities_update_own" on public.product_opportunities;
create policy "product_opportunities_update_own"
on public.product_opportunities
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "product_opportunities_delete_own" on public.product_opportunities;
create policy "product_opportunities_delete_own"
on public.product_opportunities
for delete
to authenticated
using (auth.uid() = user_id);
