## Why

当前系统是"事件驱动"而非"积累驱动"：每次分析只解决当次问题，历史结论只存在于聊天记录里，不参与下次分析。

具体问题：
- 承诺过要改的事没有追踪机制，下次分析时不知道"上次说好了要改的"
- 分析洞察是即用即抛，下次遇到同维度问题从头推理，不复用
- retrieval_index.json 的 frequency 是简单累加，不区分"3个月前发生10次"和"上周发生10次"
- 精力账户只是第一个需要这个能力的维度，后续追踪"沟通表达改进"又要另起一套

## What Changes

### 承诺追踪体系（Task 1）
- `pending_actions.json` → 升级为 `memories/commitments/active.json` + `history.json`
- 每条承诺记录包含：承诺内容、来源分析日期、触发维度、验证关键词/条件、用户原始引用、下次检查时间
- 承诺到期后：完成则移入 history.json + 记录完成质量；违约则记录违约原因 + 分析新洞察

### 洞察持久化（Task 2）
- 新增 `memories/insights/YYYY-MM-DD.json`
- 每次深度分析后自动归档：根因结论、建议方向、用户同意的改法、关联历史洞察
- 下次分析同维度时，加载历史洞察作为上下文，不是从零开始

### 时间权重（Task 3）
- retrieval_index.json 的 frequency 字段升级为带 recency_decay 的 pattern_score
- `pattern_score = frequency × recency_decay_factor`
- decay_factor = e^(-λ × days_since_last_occurrence)，λ 可调（默认 0.05）
- 历史数据不丢，只是权重自然衰减

### 跨期关联图谱（Task 4）
- 在 insights 中记录"这个模式的根因可能和 X 模式根因相同"
- 形成关联链：知道 A 问题的根因，可以推断 B 问题是同一根源
- 精力账户三账本问题就是第一个跨期关联案例

### 现有文件整合（Task 5）
- 精力账户结算 → 直接写入 memories/commitments/active.json（不再另建 energy_account/）
- 当前 daily_raw 碎碎念格式 → 补充 commitment 字段，指向本次新承诺

## Capabilities

### New Capabilities

- `commitment_tracker`：承诺的创建、验证、到期处理、违约分析全链路
- `insight_persistence`：分析结论归档 + 历史洞察加载
- `recency_weighted_patterns`：带时间衰减的跨期模式识别
- `cross_period_correlator`：跨时间维度的根因关联

### Modified Capabilities

- `碎碎念处理流程`（修改）：每次深度分析后必须归档 insights + 更新 commitments
- `retrieval_index.json`（修改）：frequency → pattern_score with recency decay
- `周/月末复盘`（修改）：加载历史 commitments + insights 作为上下文

## Impact

- 新增 `memories/commitments/` 目录（active.json + history.json）
- 新增 `memories/insights/` 目录
- 修改 `retrieval_index.json` 的 pattern scoring 算法
- daily_raw 格式补充 commitment 引用字段
- 精力账户是第一期实现，其他维度（execution、communication 等）后续平移
