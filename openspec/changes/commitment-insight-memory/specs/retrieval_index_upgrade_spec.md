# Retrieval Index Upgrade Spec

## 功能描述

将简单的 frequency 计数升级为带 recency decay 的 pattern_score，用于跨期模式识别。

## 计算公式

```
decay_factor = e^(-λ × days_since_last)
pattern_score = frequency_recent × decay_factor + frequency_historical × (1 - decay_factor) × historical_decay

其中：
- λ = 0.05（可配置）
- days_since_last = 今天 - 最后一次发生的日期
- frequency_recent = 最近30天内的发生次数
- frequency_historical = 30天之前的发生次数
- historical_decay = e^(-λ × days_since_last_historical)
```

## 配置参数

```json
{
  "recency_config": {
    "lambda": 0.05,
    "recent_window_days": 30,
    "min_days_for_decay": 7
  }
}
```

## 升级前后对比

### 升级前
```json
"know_but_not_do": {
  "frequency": 10,
  "examples": [...]
}
```

### 升级后
```json
"know_but_not_do": {
  "occurrences": [
    {"date": "2026-04-25", "context": "...", "weekday": "saturday"},
    {"date": "2026-04-22", "context": "...", "weekday": "wednesday"}
  ],
  "frequency": 10,
  "recent_frequency": 3,
  "recency_decay": {
    "lambda": 0.05,
    "last_occurrence": "2026-04-25",
    "days_since_last": 1
  },
  "pattern_score": 8.2,
  "pattern_rank": 3
}
```

## 触发时机

1. **daily_raw 更新时**：每次写入新碎碎念，重新计算相关 pattern 的 score
2. **周复盘时**：展示 pattern_rank 排名（而非原始 frequency）
3. **分析启动时**：加载高 pattern_score 的模式优先

## backward compatibility

旧的 frequency 字段保留，新字段追加。老代码兼容，新分析使用新字段。
