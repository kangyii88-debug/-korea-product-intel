create extension if not exists pgcrypto;

create table if not exists public.ai_providers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  provider_name text not null,
  enabled boolean not null default false,
  api_key_configured boolean not null default false,
  default_model text,
  usage_type text[] not null default '{}',
  status text not null default 'missing_key',
  last_tested_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, provider_name)
);

create table if not exists public.ai_task_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  task_name text not null,
  task_type text not null,
  applicable_pages text[] not null default '{}',
  default_provider text not null,
  default_model text,
  input_schema jsonb not null default '[]',
  output_schema jsonb not null default '[]',
  prompt_template text,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, task_type)
);

create table if not exists public.ai_analysis_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  source_type text not null,
  source_id text not null,
  source_title text,
  task_type text not null,
  provider_name text not null,
  model_name text,
  input_snapshot jsonb not null default '{}',
  output_result jsonb not null default '{}',
  status text not null default 'completed',
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.perplexity_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  report_type text not null,
  title text not null,
  query text not null,
  output_format text not null default 'markdown',
  content text,
  content_json jsonb not null default '{}',
  source_links jsonb not null default '[]',
  saved_to text not null,
  status text not null default 'pending_config',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_generated_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  analysis_id uuid references public.ai_analysis_records(id) on delete cascade,
  source_type text not null,
  source_id text not null,
  task_title jsonb not null default '{}',
  task_content jsonb not null default '{}',
  owner text,
  deadline timestamptz,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ai_providers_user_provider on public.ai_providers(user_id, provider_name);
create index if not exists idx_ai_task_templates_user_type on public.ai_task_templates(user_id, task_type);
create index if not exists idx_ai_analysis_records_source on public.ai_analysis_records(source_type, source_id, created_at desc);
create index if not exists idx_ai_generated_tasks_analysis on public.ai_generated_tasks(analysis_id, created_at desc);
create index if not exists idx_perplexity_reports_type_time on public.perplexity_reports(report_type, created_at desc);

create or replace function public.set_ai_engine_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_ai_providers_updated_at on public.ai_providers;
create trigger trg_ai_providers_updated_at
before update on public.ai_providers
for each row execute function public.set_ai_engine_updated_at();

drop trigger if exists trg_ai_task_templates_updated_at on public.ai_task_templates;
create trigger trg_ai_task_templates_updated_at
before update on public.ai_task_templates
for each row execute function public.set_ai_engine_updated_at();

drop trigger if exists trg_ai_analysis_records_updated_at on public.ai_analysis_records;
create trigger trg_ai_analysis_records_updated_at
before update on public.ai_analysis_records
for each row execute function public.set_ai_engine_updated_at();

drop trigger if exists trg_perplexity_reports_updated_at on public.perplexity_reports;
create trigger trg_perplexity_reports_updated_at
before update on public.perplexity_reports
for each row execute function public.set_ai_engine_updated_at();

drop trigger if exists trg_ai_generated_tasks_updated_at on public.ai_generated_tasks;
create trigger trg_ai_generated_tasks_updated_at
before update on public.ai_generated_tasks
for each row execute function public.set_ai_engine_updated_at();

alter table public.ai_providers enable row level security;
alter table public.ai_task_templates enable row level security;
alter table public.ai_analysis_records enable row level security;
alter table public.perplexity_reports enable row level security;
alter table public.ai_generated_tasks enable row level security;

drop policy if exists "ai_providers_select_own" on public.ai_providers;
create policy "ai_providers_select_own"
on public.ai_providers
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "ai_providers_insert_own" on public.ai_providers;
create policy "ai_providers_insert_own"
on public.ai_providers
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "ai_providers_update_own" on public.ai_providers;
create policy "ai_providers_update_own"
on public.ai_providers
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "ai_task_templates_select_own" on public.ai_task_templates;
create policy "ai_task_templates_select_own"
on public.ai_task_templates
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "ai_task_templates_insert_own" on public.ai_task_templates;
create policy "ai_task_templates_insert_own"
on public.ai_task_templates
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "ai_task_templates_update_own" on public.ai_task_templates;
create policy "ai_task_templates_update_own"
on public.ai_task_templates
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "ai_analysis_records_select_own" on public.ai_analysis_records;
create policy "ai_analysis_records_select_own"
on public.ai_analysis_records
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "ai_analysis_records_insert_own" on public.ai_analysis_records;
create policy "ai_analysis_records_insert_own"
on public.ai_analysis_records
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "perplexity_reports_select_own" on public.perplexity_reports;
create policy "perplexity_reports_select_own"
on public.perplexity_reports
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "perplexity_reports_insert_own" on public.perplexity_reports;
create policy "perplexity_reports_insert_own"
on public.perplexity_reports
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "ai_generated_tasks_select_own" on public.ai_generated_tasks;
create policy "ai_generated_tasks_select_own"
on public.ai_generated_tasks
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "ai_generated_tasks_insert_own" on public.ai_generated_tasks;
create policy "ai_generated_tasks_insert_own"
on public.ai_generated_tasks
for insert
to authenticated
with check (auth.uid() = user_id);
