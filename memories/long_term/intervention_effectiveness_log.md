# 干预效果日志

> 记录每次干预的效果，用于系统学习什么方式对你更有效。
> 每次干预后主动记录，不要依赖回忆。

---

## 记录格式

```yaml
- date: YYYY-MM-DD
  dimension: xxx
  intervention_type: "深度干预/标准干预/微反馈"
  what_i_said: "我当时说了什么（摘要）"
  user_response: "用户怎么回应的"
  behavior_change: "none/small/significant"
  effectiveness_score: 1-5
  notes: "学到了什么"
```

---

## 评分标准

| 分数 | 含义 |
|------|------|
| 1 | 完全无效，用户完全没反应 |
| 2 | 用户有反应但无行为改变 |
| 3 | 有短期行为改变但未持续 |
| 4 | 有持续行为改变 |
| 5 | 显著且持久的行为改变 |

---

## 字段说明

- **dimension**: 执行维度（execution/communication/strategic_thinking等）
- **intervention_type**: 
  - 深度干预 = 1个问题+1个行动
  - 标准干预 = 1个问题 或 1个行动
  - 微反馈 = 1句话观察
- **what_i_said**: 核心干预内容的摘要（不需要完整引用）
- **user_response**: 用户当场怎么回的（情绪/语言/行为）
- **behavior_change**: 
  - none = 之后没有任何改变
  - small = 有一点点改变但不算完整
  - significant = 完整执行了行动或明显进步
- **effectiveness_score**: 基于整体效果给1-5分
- **notes**: 什么条件下有效/无效，下次怎么调整

---

## 最近记录

<!-- 新记录追加在这里 -->