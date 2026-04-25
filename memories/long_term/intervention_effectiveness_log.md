# 干预效果日志

> 记录每次干预的效果，用于系统学习什么方式对你更有效。
> 每次干预后主动记录，不要依赖回忆。

---

## 记录格式

```yaml
- date: YYYY-MM-DD
  dimension: xxx
  intervention_type: "深度干预/标准干预/微反馈"
  action_assigned: "给的具体行动（描述）"
  deadline: "截止时间（24小时内）"
  what_i_said: "我当时说了什么（摘要）"
  user_response: "用户怎么回应的"
  user_mentioned: true/false  # 用户是否主动提到该行动
  action_taken: true/false    # 用户是否执行了
  action_result: "已发布/没做/部分完成"  # 执行结果
  behavior_change: "none/small/significant"
  effectiveness_score: 1-5
  strategy_switch: true/false  # 是否触发了策略切换
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

### action_taken 说明

| 值 | 含义 |
|----|------|
| true | 用户明确执行了指定行动 |
| false | 用户没有执行或未完成 |

### strategy_switch 说明

| 值 | 含义 |
|----|------|
| true | 触发了策略切换（第3次无效后转换方式） |
| false | 未触发策略切换 |

---

## 策略切换规则

当同一卡点满足以下条件时，触发策略切换：
- 干预次数 >= 3
- 平均 effectiveness_score < 2

切换方式：
- 从"给行动"改为"追问深层恐惧"
- 从"建议"改为"挑战"
- 输出格式变化但仍然1个问题+1个行动

示例：
- 卡点：知道但不做-execution
- 第3次无效后输出：
  "你的'知道但不做'说了很多次了，但你从来没真正改变过。
  你是在等什么？还是你其实不想变？"

---

## 字段说明

- **dimension**: 执行维度（execution/communication/strategic_thinking等）
- **intervention_type**:
  - 深度干预 = 1个问题+1个行动
  - 标准干预 = 1个问题 或 1个行动
  - 微反馈 = 1句话观察
- **action_assigned**: 给出的具体行动描述（如"发布第一条帖子"、"给3个人发消息"）
- **deadline**: 行动截止时间，默认为24小时内
- **what_i_said**: 核心干预内容的摘要（不需要完整引用）
- **user_response**: 用户当场怎么回的（情绪/语言/行为）
- **user_mentioned**: 用户是否主动提到该行动（哪怕只提一句也算true）
- **action_taken**: 用户是否实际执行了（哪怕部分完成也算true）
- **action_result**: 执行结果的具体描述（已发布/没做/部分完成/其他）
- **behavior_change**:
  - none = 之后没有任何改变
  - small = 有一点点改变但不算完整
  - significant = 完整执行了行动或明显进步
- **effectiveness_score**: 基于整体效果给1-5分
- **strategy_switch**: 是否触发了策略切换（true时说明用了更挑战的方式）
- **notes**: 什么条件下有效/无效，下次怎么调整

---

## 最近记录

<!-- 新记录追加在这里 -->