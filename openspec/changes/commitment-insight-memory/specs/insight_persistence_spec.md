# Insight Persistence Spec

## 功能描述

将每次深度分析的结论归档，供后续分析复用。

## 数据结构

### insight 对象
```typescript
interface Insight {
  id: string                    // ins_{date}_{seq}
  date: string                  // YYYY-MM-DD
  source_message: string        // 原始消息ID
  depth_trigger: string         // 触发深度分析的原因
  dimensions_triggered: string[] // 涉及的维度
  root_cause: string             // 根因结论
  user_agreed_changes: string[] // 用户同意的改变
  new_commitments: string[]     // 本次生成的承诺ID列表
  cross_period_links: CrossPeriodLink[]
  linguistic_signals: LinguisticSignals
  time_pattern: TimePattern
  created_at: string             // ISO8601
}

interface CrossPeriodLink {
  type: 'same_root_cause' | 'escalation' | 'new_pattern'
  linked_date: string
  linked_insight_id?: string
  note: string
}
```

## 触发时机

每次 Signal Depth Gate 触发深度分析（score ≥ 8）时，分析完成后自动归档。

## 加载逻辑

### 分析启动时
```
1. 根据 dimensions_triggered 加载相关历史 insights
2. 将历史 root_cause 和 user_agreed_changes 作为上下文注入
3. 分析 agent 需要明确回应："上次同类问题的结论是X，你这次怎么看"
```

### 关联发现时
```
当新 insight 的 root_cause 语义相似于历史时，生成 cross_period_links
相似度阈值：0.7（人工确认后可自动标注）
```

## 存储位置
- `memories/insights/YYYY-MM-DD.json`

## 加载顺序
1. `memories/insights/` 下所有文件
2. 按 date 倒序排列
3. 只加载 dimensions_triggered 有重叠的
4. 最多加载最近 10 条相关 insight
