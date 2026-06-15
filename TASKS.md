# Tasks

## 1. 当前优先级

按照用户要求，先完成文档，再继续开发。

当前阶段：

- Phase 0: 架构与文档

## 2. Phase 0 文档任务

- [x] 创建 `SYSTEM.md`
- [x] 创建 `PRODUCT_REQUIREMENTS.md`
- [x] 创建 `DATABASE.md`
- [x] 创建 `AI_AGENTS.md`
- [x] 创建 `UI_STRUCTURE.md`
- [x] 创建 `ROADMAP.md`
- [x] 创建 `TASKS.md`

## 3. Phase 1 开发任务

### 3.1 路由重构

- [ ] 新建 `/dashboard`
- [ ] 将当前首页迁移到 `/products`
- [ ] 将 `/reports/[id]` 迁移到 `/products/[id]`
- [ ] 将 `/decisions` 调整为 `/decision`
- [ ] 新建 `/tasks`
- [ ] 新建 `/settings`
- [ ] 更新左侧导航

### 3.2 数据库

- [ ] 创建 Supabase Schema SQL
- [ ] 创建 `platforms`
- [ ] 创建 `categories`
- [ ] 创建 `products`
- [ ] 创建 `product_sources`
- [ ] 创建 `product_metrics`
- [ ] 创建 `reviews`
- [ ] 创建 `review_analysis`
- [ ] 创建 `ai_reports`
- [ ] 创建 `development_plans`
- [ ] 创建 `ai_scores`
- [ ] 创建 `collection_tasks`
- [ ] 创建 `ai_agents`
- [ ] 创建 `ai_logs`
- [ ] 添加索引
- [ ] 添加 RLS 策略草案

### 3.3 商品采集库

- [ ] 新增商品表单
- [ ] 手动录入商品
- [ ] CSV 导入商品
- [ ] 批量导入商品
- [ ] 商品收藏
- [ ] 商品标签
- [ ] 平台筛选
- [ ] 类目筛选
- [ ] 销量筛选
- [ ] 评论筛选
- [ ] 评分筛选
- [ ] 价格筛选

### 3.4 评论导入与分析

- [ ] 评论 CSV 导入
- [ ] 评论原文保存
- [ ] 负面评论识别
- [ ] 问题类型统计
- [ ] 问题次数计算
- [ ] 问题占比计算
- [ ] 严重程度判断
- [ ] 是否影响购买判断
- [ ] 优化建议生成
- [ ] 评论证据展示

### 3.5 AI 报告

- [ ] OpenAI Provider 接入
- [ ] AI Provider 抽象层
- [ ] Data Collector AI
- [ ] Trend Analyzer AI
- [ ] Review Analyzer AI
- [ ] Product Developer AI
- [ ] Profit Risk AI
- [ ] Listing Optimizer AI
- [ ] AI 报告保存
- [ ] AI 报告重新生成
- [ ] AI 报告版本记录
- [ ] AI 执行日志

### 3.6 产品开发中心

- [ ] 产品定位展示
- [ ] 目标客户展示
- [ ] 市场机会展示
- [ ] 核心痛点展示
- [ ] 产品改进方向展示
- [ ] 建议尺寸展示
- [ ] 建议颜色展示
- [ ] 建议材质展示
- [ ] 建议包装展示
- [ ] 建议售价展示
- [ ] 建议采购价展示
- [ ] 建议首批数量展示
- [ ] 预计利润率展示
- [ ] 竞争强度展示
- [ ] 风险等级展示
- [ ] 执行优先级展示
- [ ] 状态管理

### 3.7 AI 决策中心

- [ ] 市场需求评分
- [ ] 竞争强度评分
- [ ] 利润空间评分
- [ ] 差评优化空间评分
- [ ] 供应链可行性评分
- [ ] 物流友好度评分
- [ ] 认证风险评分
- [ ] 季节风险评分
- [ ] 综合推荐指数
- [ ] S/A/B/C 等级
- [ ] 今日发现爆款排行榜
- [ ] 本周高潜力产品排行榜
- [ ] 低竞争高利润产品排行榜
- [ ] 可优化差评产品排行榜
- [ ] 适合中国供应链产品排行榜
- [ ] 高风险产品排行榜

### 3.8 采集任务中心

- [ ] 创建采集任务
- [ ] 任务列表
- [ ] 手动运行任务
- [ ] 定时任务配置
- [ ] 任务状态展示
- [ ] 错误日志展示

### 3.9 系统设置

- [ ] 平台管理
- [ ] 类目管理
- [ ] AI Provider 配置
- [ ] AI Agent 配置
- [ ] Prompt 版本管理
- [ ] 评分规则配置
- [ ] 导入模板管理

## 4. 验收标准

Phase 1 完成时必须满足：

- [ ] 可以新增商品
- [ ] 可以导入商品
- [ ] 可以导入评论
- [ ] 可以生成 AI 报告
- [ ] 可以生成差评分析
- [ ] 可以生成开发建议
- [ ] 可以生成 AI 评分
- [ ] 所有 AI 结果保存数据库
- [ ] 可以重新生成 AI 结果
- [ ] 可以查看历史版本
- [ ] 排行榜可展示
- [ ] 页面结构符合 `/dashboard`、`/products`、`/products/[id]`、`/reviews`、`/development`、`/decision`、`/tasks`、`/settings`
