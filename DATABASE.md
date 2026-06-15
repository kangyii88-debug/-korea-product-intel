# Database Design

## 1. 数据库原则

数据库重新设计，不使用旧 EGO 数据库。

设计原则：

- 支持多平台
- 支持历史记录
- 支持 AI 报告版本
- 支持状态管理
- 支持评论与分析结果分离
- 支持采集任务和 AI 执行日志追踪
- 支持未来 Amazon、Shopee、Temu 扩展

## 2. 核心表

核心表：

- `platforms`
- `categories`
- `products`
- `product_sources`
- `product_metrics`
- `reviews`
- `review_analysis`
- `ai_reports`
- `development_plans`
- `ai_scores`
- `collection_tasks`
- `ai_agents`
- `ai_logs`

## 3. 表结构草案

### 3.1 platforms

平台表。

字段：

- `id uuid primary key`
- `name text not null`
- `code text unique not null`
- `country text default 'KR'`
- `base_url text`
- `is_active boolean default true`
- `created_at timestamptz`
- `updated_at timestamptz`

### 3.2 categories

类目表，支持平台类目映射。

字段：

- `id uuid primary key`
- `platform_id uuid references platforms(id)`
- `parent_id uuid references categories(id)`
- `name text not null`
- `path text`
- `external_id text`
- `created_at timestamptz`
- `updated_at timestamptz`

### 3.3 products

标准产品机会表。

字段：

- `id uuid primary key`
- `canonical_name text not null`
- `brand text`
- `category_id uuid references categories(id)`
- `primary_image_url text`
- `status text`
- `decision text`
- `bookmark boolean default false`
- `notes text`
- `created_at timestamptz`
- `updated_at timestamptz`

状态建议：

- `pending_analysis`
- `analyzed`
- `developable`
- `watching`
- `not_recommended`

### 3.4 product_sources

商品平台来源表。同一个产品机会可以来自多个平台或多个链接。

字段：

- `id uuid primary key`
- `product_id uuid references products(id)`
- `platform_id uuid references platforms(id)`
- `source_url text not null`
- `external_product_id text`
- `source_title text`
- `source_brand text`
- `seller_name text`
- `seller_type text`
- `delivery_type text`
- `image_urls jsonb`
- `raw_payload jsonb`
- `first_collected_at timestamptz`
- `last_collected_at timestamptz`
- `created_at timestamptz`
- `updated_at timestamptz`

### 3.5 product_metrics

商品历史指标表。每次采集生成一条历史记录。

字段：

- `id uuid primary key`
- `product_id uuid references products(id)`
- `product_source_id uuid references product_sources(id)`
- `collected_at timestamptz not null`
- `price numeric`
- `discount_price numeric`
- `estimated_monthly_sales int`
- `review_count int`
- `rating numeric`
- `rank int`
- `favorites int`
- `keyword_rankings jsonb`
- `size text`
- `colors text[]`
- `material text`
- `weight text`
- `package_size text`
- `selling_points text[]`
- `keywords text[]`
- `raw_metrics jsonb`
- `created_at timestamptz`

### 3.6 reviews

评论原始数据表。

字段：

- `id uuid primary key`
- `product_id uuid references products(id)`
- `product_source_id uuid references product_sources(id)`
- `platform_id uuid references platforms(id)`
- `external_review_id text`
- `rating numeric`
- `review_text text`
- `review_images text[]`
- `review_date date`
- `option_name text`
- `helpful_count int`
- `is_negative boolean`
- `language text default 'ko'`
- `raw_payload jsonb`
- `created_at timestamptz`

### 3.7 review_analysis

评论分析结果表，支持版本。

字段：

- `id uuid primary key`
- `product_id uuid references products(id)`
- `ai_report_id uuid references ai_reports(id)`
- `version int not null`
- `issue_type text not null`
- `issue_count int`
- `issue_ratio numeric`
- `severity text`
- `affects_purchase boolean`
- `evidence_review_ids uuid[]`
- `summary text`
- `optimization_suggestion text`
- `created_by_agent_id uuid references ai_agents(id)`
- `created_at timestamptz`

问题类型：

- `size`
- `material`
- `installation`
- `color`
- `packaging`
- `logistics`
- `quality`
- `price`
- `manual`
- `photo_mismatch`

### 3.8 ai_reports

AI 单品情报报告表。

字段：

- `id uuid primary key`
- `product_id uuid references products(id)`
- `version int not null`
- `report_type text not null`
- `title text`
- `content jsonb not null`
- `input_snapshot jsonb`
- `model_provider text`
- `model_name text`
- `prompt_version text`
- `status text`
- `created_by_agent_id uuid references ai_agents(id)`
- `created_at timestamptz`

报告类型：

- `product_intelligence`
- `sales_analysis`
- `competitor_analysis`
- `review_summary`
- `listing_optimization`

### 3.9 development_plans

产品开发方案表。

字段：

- `id uuid primary key`
- `product_id uuid references products(id)`
- `ai_report_id uuid references ai_reports(id)`
- `version int not null`
- `positioning text`
- `target_customer text`
- `market_opportunity text`
- `core_pain_points text[]`
- `improvement_directions text[]`
- `suggested_size text`
- `suggested_colors text[]`
- `suggested_material text`
- `suggested_packaging text`
- `suggested_sale_price numeric`
- `suggested_purchase_price numeric`
- `suggested_first_batch_qty int`
- `estimated_margin_rate numeric`
- `competition_strength text`
- `risk_level text`
- `execution_priority text`
- `status text`
- `created_at timestamptz`
- `updated_at timestamptz`

状态：

- `idea`
- `confirmed`
- `sourcing`
- `sampling`
- `test_selling`
- `abandoned`

### 3.10 ai_scores

AI 评分表，支持历史版本。

字段：

- `id uuid primary key`
- `product_id uuid references products(id)`
- `version int not null`
- `market_demand_score int`
- `competition_score int`
- `profit_score int`
- `review_optimization_score int`
- `supply_chain_score int`
- `logistics_score int`
- `certification_risk_score int`
- `seasonality_risk_score int`
- `recommendation_index int`
- `final_grade text`
- `reasoning jsonb`
- `created_by_agent_id uuid references ai_agents(id)`
- `created_at timestamptz`

最终等级：

- `S`
- `A`
- `B`
- `C`

### 3.11 collection_tasks

采集任务表。

字段：

- `id uuid primary key`
- `platform_id uuid references platforms(id)`
- `task_type text`
- `keyword text`
- `category_id uuid references categories(id)`
- `status text`
- `schedule_cron text`
- `last_run_at timestamptz`
- `next_run_at timestamptz`
- `config jsonb`
- `result_summary jsonb`
- `created_at timestamptz`
- `updated_at timestamptz`

### 3.12 ai_agents

AI Agent 配置表。

字段：

- `id uuid primary key`
- `name text not null`
- `code text unique not null`
- `description text`
- `provider text`
- `model_name text`
- `system_prompt text`
- `prompt_version text`
- `is_active boolean default true`
- `created_at timestamptz`
- `updated_at timestamptz`

### 3.13 ai_logs

AI 执行日志表。

字段：

- `id uuid primary key`
- `agent_id uuid references ai_agents(id)`
- `product_id uuid references products(id)`
- `task_type text`
- `input jsonb`
- `output jsonb`
- `status text`
- `error_message text`
- `token_usage jsonb`
- `cost numeric`
- `latency_ms int`
- `created_at timestamptz`

## 4. 历史记录策略

历史数据不覆盖，采用追加写入：

- 商品价格、销量、评论数写入 `product_metrics`
- 评论分析写入 `review_analysis` 新版本
- AI 报告写入 `ai_reports` 新版本
- 开发方案写入 `development_plans` 新版本
- AI 评分写入 `ai_scores` 新版本

## 5. 版本规则

每个产品下同类型 AI 结果按 `version` 递增。

重新生成时：

1. 读取最新输入数据
2. 保存输入快照
3. 生成新版本
4. 不覆盖旧版本
5. 页面默认展示最新版本
6. 用户可查看历史版本

## 6. 索引建议

建议索引：

- `products(status)`
- `products(decision)`
- `product_sources(platform_id)`
- `product_sources(product_id)`
- `product_metrics(product_id, collected_at desc)`
- `reviews(product_id)`
- `reviews(is_negative)`
- `review_analysis(product_id, version desc)`
- `ai_reports(product_id, report_type, version desc)`
- `development_plans(product_id, version desc)`
- `ai_scores(product_id, version desc)`
- `ai_scores(final_grade)`
- `collection_tasks(status)`
- `ai_logs(agent_id, created_at desc)`
