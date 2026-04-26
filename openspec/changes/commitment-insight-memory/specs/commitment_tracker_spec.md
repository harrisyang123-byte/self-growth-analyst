# Commitment Tracker Spec

## 功能描述

管理用户承诺的创建、验证、到期处理全生命周期。

## 数据结构

### commitment 对象
| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 格式：c_{date}_{type}_{seq}，如 c_2026-04-26_energy_001 |
| content | string | 承诺内容（用户原话或摘要） |
| source | object | 来源信息：date, analysis_ref, user_quote |
| dimensions | string[] | 关联的维度列表 |
| verification | object | 验证类型和条件 |
| created_at | ISO8601 | 创建时间 |
| next_check | date | 下次检查时间 |
| status | enum | active/completed/violated/abandoned |
| history | array | 状态变更历史 |

### verification.type
| type | 说明 | condition 示例 |
|------|------|----------------|
| recurrence | 周期性验证 | 连续N周达标 |
| milestone | 里程碑验证 | 达成某个具体目标 |
| one_time | 一次性 | 指定日期前完成 |

## API 操作

### 创建承诺
```typescript
createCommitment(params: {
  content: string
  source: Source
  dimensions: string[]
  verification: Verification
  userQuote: string
}): Commitment
```

### 验证承诺
```typescript
checkCommitment(id: string, result: 'success' | 'violated'): {
  action: 'move_to_completed' | 'move_to_violated' | 'update_next_check'
  new_insight?: string
}
```

### 获取活跃承诺
```typescript
getActiveCommitments(dimensions?: string[]): Commitment[]
```

### 承诺到期检查（周复盘时触发）
```typescript
runCommitmentCheck(): {
  due: Commitment[]
  upcoming: Commitment[]
  completed: Commitment[]
}
```

## 触发时机

1. **创建**：用户说"好，采纳"并制定具体计划时
2. **检查**：周复盘（Sunday 20:00）时自动检查所有 active 承诺
3. **到期**：到达 next_check 日期时触发验证
4. **违约**：用户再次出现承诺相关的负面模式时，标注违约

## 存储位置
- `memories/commitments/active.json`
- `memories/commitments/history.json`
