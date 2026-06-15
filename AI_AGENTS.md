# AI Agent Architecture

## 1. 设计目标

AI Agent 架构负责把采集数据转化为可执行的选品、竞品、评论、开发、利润和上架优化情报。

所有 Agent 必须：

- 保存结果到数据库
- 保存输入快照
- 支持重新生成
- 支持版本记录
- 记录模型、Prompt 版本和执行日志
- 输出结构化 JSON
- 输出可被页面直接使用的结论

## 2. Agent 列表

### Agent 1: Data Collector AI

职责：

- 整理采集数据
- 清洗商品字段
- 合并多平台同款或相似产品
- 提取商品卖点
- 提取关键词
- 标准化尺寸、颜色、材质、重量、包装尺寸

输入：

- 商品链接
- 平台原始数据
- CSV 导入数据
- 手动录入数据

输出：

- 标准化 `products`
- 标准化 `product_sources`
- 新增 `product_metrics`

### Agent 2: Trend Analyzer AI

职责：

- 分析销量趋势
- 判断是否季节品
- 判断是否长期需求品
- 判断排名和评论增长是否健康
- 识别短期冲榜风险

输入：

- `product_metrics` 历史数据
- 平台排名
- 收藏数
- 评论增长
- 价格变化

输出：

- 趋势分析报告
- 销售机会判断
- 季节风险判断

### Agent 3: Review Analyzer AI

职责：

- 分析评论和差评
- 提取高频问题
- 判断问题严重程度
- 判断是否影响购买
- 生成优化建议

分析维度：

- 尺寸问题
- 材质问题
- 安装问题
- 颜色问题
- 包装问题
- 物流问题
- 质量问题
- 价格问题
- 说明书问题
- 照片与实物不符

输出：

- `review_analysis`
- 评论摘要
- 用户喜欢点
- 用户讨厌点
- 购买原因
- 退货原因

### Agent 4: Product Developer AI

职责：

- 把评论问题和竞品优势转成产品开发方案
- 生成产品定位
- 生成目标客户
- 生成产品改进方向
- 生成建议尺寸、颜色、材质、包装
- 生成首批采购建议

输出：

- `development_plans`
- 供应商问题清单
- 打样验收标准
- 产品改进优先级

### Agent 5: Profit Risk AI

职责：

- 判断利润空间
- 判断物流友好度
- 判断认证风险
- 判断季节风险
- 判断供应链可行性
- 生成综合推荐指数

输出：

- `ai_scores`
- 风险清单
- 利润推算
- 最终等级

### Agent 6: Listing Optimizer AI

职责：

- 生成标题建议
- 生成关键词建议
- 生成详情页结构
- 生成主图建议
- 根据评论痛点生成 FAQ
- 根据平台特性生成上架建议

输出：

- Listing 优化报告
- 标题版本
- 关键词列表
- 主图拍摄脚本
- 详情页模块建议

## 3. Agent 执行流程

标准流程：

1. Data Collector AI 整理商品数据
2. Trend Analyzer AI 分析趋势和需求
3. Review Analyzer AI 分析评论和差评
4. Product Developer AI 生成开发方案
5. Profit Risk AI 生成评分和风险判断
6. Listing Optimizer AI 生成上架优化建议

## 4. 结果保存规则

所有 Agent 输出必须写入数据库。

保存内容：

- 输入数据快照
- 结构化输出
- 文字结论
- 使用模型
- Prompt 版本
- Agent ID
- Token 用量
- 执行耗时
- 错误信息

## 5. 重新生成规则

用户点击重新生成时：

1. 创建新的 AI 执行任务
2. 读取最新商品、指标、评论数据
3. 生成新版本结果
4. 保存到对应表
5. 旧版本保留
6. 页面刷新到最新版本

## 6. Prompt 输出要求

所有 Agent 输出结构化 JSON。

必须包含：

- `summary`
- `key_findings`
- `recommendations`
- `risks`
- `confidence`
- `evidence`
- `next_actions`

不得只输出散文式文本。

## 7. AI Provider 预留

Provider 抽象层支持：

- OpenAI
- Claude
- Gemini
- Perplexity
- Grok
- Custom API

每个 Agent 可独立配置：

- provider
- model
- temperature
- system prompt
- prompt version
- max tokens
