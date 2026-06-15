# Korea E-commerce AI Product Intelligence System

## 1. 系统定位

Korea E-commerce AI Product Intelligence System 是韩国电商 AI 选品开发情报系统。

它不是 ERP。
它不是传统 BI 数据大屏。
它不是只展示漂亮图表的运营后台。

系统核心目标是帮助老板和产品团队回答五个问题：

1. 这个产品能不能做？
2. 为什么能做？
3. 应该怎么做？
4. 风险是什么？
5. 如何优化成更赚钱的产品？

## 2. 核心业务对象

系统围绕“产品机会”而不是“库存单据”设计。

核心对象包括：

- 热销商品
- 商品来源平台
- 商品历史指标
- 用户评论
- 评论问题分析
- AI 单品情报报告
- 产品开发方案
- AI 评分
- 采集任务
- AI Agent 执行记录

## 3. 服务平台

第一阶段支持：

- Coupang
- Naver Shopping
- 오늘의집
- 11번가
- Gmarket
- AliExpress Korea

后期扩展：

- Amazon
- Shopee
- Temu

## 4. 第一阶段核心模块

第一阶段只做五个高价值模块：

1. 爆款产品采集库
2. 单品 AI 情报报告
3. 评论差评分析中心
4. 产品开发建议中心
5. AI 选品决策中心

## 5. 系统原则

所有页面必须实用。

禁止：

- 空图表
- 假大屏
- 无意义雷达图
- 装饰性内容
- 为了视觉效果牺牲判断效率

每个模块必须直接服务决策：

- 能不能做
- 为什么能做
- 怎么做
- 风险是什么
- 如何优化

## 6. 技术栈

前端：

- Next.js 15
- TypeScript
- Tailwind CSS
- Shadcn UI 风格组件

后端与数据：

- Supabase Postgres
- Supabase Storage
- Supabase Auth
- Supabase Edge Functions 或 Next.js Route Handlers

AI：

- OpenAI API

预留：

- Claude
- Gemini
- Perplexity
- Grok
- 自定义 AI API

## 7. 设计风格

视觉参考：

- Apple
- Linear
- Notion
- Stripe
- Vercel

设计要求：

- 白色背景
- 极简高级
- 干净整洁
- 信息层级清楚
- 老板一眼看懂

禁止：

- 黑色背景
- 深蓝背景
- 炫酷科技风
- 复杂动画
- 无业务意义的装饰

## 8. AI 结果保存原则

所有 AI 生成内容必须保存数据库。

必须支持：

- 重新生成
- 版本记录
- 结果对比
- 使用模型记录
- Prompt 版本记录
- 输入数据快照
- 执行日志
- 失败重试

AI 结果不能只停留在前端状态或临时响应里。

## 9. 第一阶段交付目标

第一阶段必须可完成以下闭环：

1. 新增商品
2. 导入商品
3. 导入评论
4. 生成 AI 报告
5. 生成差评分析
6. 生成开发建议
7. 生成 AI 评分
8. 保存所有分析结果
9. 展示排行榜

## 10. 最终目标

打造韩国电商 AI 情报中枢：

- AI 选品中心
- AI 竞品分析中心
- AI 产品开发中心
- AI 决策中心

最终帮助用户发现产品、分析产品、开发产品、赚钱产品。
