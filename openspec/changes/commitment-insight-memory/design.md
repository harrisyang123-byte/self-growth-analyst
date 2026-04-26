# 设计方案：承诺追踪 + 洞察持久化 + 时间权重

## 1. 承诺追踪（commitments/）

### 目录结构
```
memories/commitments/
├── active.json       # 当前活跃承诺
└── history.json      # 历史承诺（完成/违约/放弃）
```

### active.json 格式
```json
{
  "commitments": [
    {
      "id": "c_2026-04-26_energy_account_001",
      "content": "周五、周六凌晨1点是硬性截止时间",
      "source": {
        "date": "2026-04-26",
        "analysis_ref": "insights/2026-04-26.json",
        "user_quote": "好，你的建议我觉得很中肯，采纳。"
      },
      "dimensions": ["health_management", "execution"],
      "verification": {
        "type": "recurrence",
        "condition": "周五、六连续2周达标",
        "check_interval": "weekly"
      },
      "created_at": "2026-04-26T13:30:00+08:00",
      "next_check": "2026-05-03",
      "status": "active",
      "history": [
        {"date": "2026-04-26", "event": "created"}
      ]
    }
  ]
}
```

### history.json 格式
```json
{
  "completed": [
    {
      "id": "c_2026-04-12_xxx",
      "content": "...",
      "created_at": "...",
      "completed_at": "...",
      "completion_quality": "full|partial|minimal"
    }
  ],
  "violated": [
    {
      "id": "...",
      "content": "...",
      "created_at": "...",
      "violated_at": "...",
      "violation_context": "...",
      "new_insight": "..."
    }
  ]
}
```

### 承诺生命周期
1. **创建**：用户同意建议 → 生成 id → 写入 active.json → 设置 next_check
2. **验证**：每次周复盘时检查 → 达标则移入 completed → 未达标则分析原因
3. **违约**：到期未达成 → 写入 violated → 触发新洞察生成 → 更新 retrieval_index
4. **放弃**：用户主动放弃 → 记录放弃原因 → 区别于违约

---

## 2. 洞察持久化（insights/）

### 目录结构
```
memories/insights/
└── YYYY-MM-DD.json   # 每次深度分析的结论归档
```

### YYYY-MM-DD.json 格式
```json
{
  "date": "2026-04-26",
  "source_message": "om_xxx",
  "depth_trigger": "signal_depth_gate v2, score=9.5",
  "dimensions_triggered": ["execution", "health_management", "time_management"],
  "root_cause": "三套心理账户（工作/放纵/表现）导致精力透支无法被感知",
  "user_agreed_changes": [
    "合并为统一的精力账户",
    "凌晨1点是硬性截止（周、五周六）"
  ],
  "new_commitments": ["c_2026-04-26_energy_account_001"],
  "cross_period_links": [
    {
      "type": "same_root_cause",
      "linked_date": "2026-04-12",
      "note": "那次分析的'知道但不做'根因也是三账本问题"
    }
  ],
  "linguistic_signals": {
    "tone_markers": ["justification", "deflection"],
    "defense_mechanisms": ["rationalization", "deflection"]
  },
  "time_pattern": {
    "bucket": "00:00-06:00 凌晨",
    "inferred_state": "亢奋/失眠/逃避",
    "weekend_factor": 1.5
  }
}
```

---

## 3. 时间权重（retrieval_index.json）

### 现有问题
```json
"know_but_not_do": {"frequency": 10}  // 3个月前10次 + 上周10次，权重相同
```

### 升级后格式
```json
"know_but_not_do": {
  "occurrences": [
    {"date": "2026-04-25", "context": "验证失败但没改"},
    {"date": "2026-04-22", "context": "补偿机制定了但没执行"},
    {"date": "2026-04-14", "context": "健身计划被工作打断就跳过"}
  ],
  "frequency": 10,
  "recency_decay": {
    "lambda": 0.05,
    "last_occurrence": "2026-04-25"
  },
  "pattern_score": 8.2  // 计算值，用于排序
}
```

### 计算公式
```
decay_factor = e^(-λ × days_since_last)
pattern_score = frequency_current_window × decay_factor + frequency_historical × (1-decay_factor)

λ=0.05 时：
  7天前 → 0.70
  30天前 → 0.22
  90天前 → 0.011
```

### 触发时机
- 每次写入新的 daily_raw 时重新计算
- 周复盘时展示 pattern_score 排名，而非原始 frequency

---

## 4. 跨期关联（cross_period_links）

### 关联类型
1. **same_root_cause**：本次根因与历史某次相同
2. **escalation**：本次是历史问题的升级
3. **new_pattern**：本次是新发现的模式

### 关联发现逻辑
- 当新洞察的 root_cause 与历史 insights 的 root_cause 语义相似度 > 阈值时
- 由分析 agent 在生成洞察时主动标注，不是自动推断

### 示例
```json
"cross_period_links": [
  {
    "type": "same_root_cause",
    "linked_date": "2026-04-12",
    "linked_insight_id": "ins_2026-04-12_001",
    "note": "两件事的根因都是'用多账户系统规避自我问责'"
  }
]
```

---

## 5. 实施优先级

### 第一期（本次实现）
- 精力账户承诺 → 直接复用 commitments/ 体系
- 洞察持久化 → insights/ 归档
- retrieval_index 时间权重升级

### 第二期（后续维度）
- execution 维度的承诺追踪（know_but_not_do 模式）
- communication 维度的承诺追踪
- 其他19个维度的承诺平移

### 精力账户示例数据
```
commitment id: c_2026-04-26_energy_account_001
content: 周五、周六凌晨1点是硬性截止时间
verification: 连续2周周五、六达标
check: 2026-05-03（周日复盘时验证）
```
