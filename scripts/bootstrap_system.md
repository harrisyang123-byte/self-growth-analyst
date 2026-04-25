# Bootstrap System — 一次性启动序列

## 目的
让系统从零数据状态激活。检查历史数据，决定是否执行首轮分析。

## 执行流程

### Step 1: 检查当前状态
读取 `.orchestrator_state.json`，检查是否有 `data_accumulation_start` 字段。
- 如果有 → 系统已经初始化，直接输出状态，终止
- 如果没有 → 继续 Step 2

### Step 2: 检查历史碎碎念
扫描 `memories/daily_raw/` 目录，检查过去7天内是否有碎碎念文件。
- 如果有（至少1条）→ 跳到 Step 3
- 如果没有 → 跳到 Step 4

### Step 3: 执行首轮分析
执行完整7步工作流（模拟一次碎碎念）：
1. 加载记忆（读取 short_term/ 文件）
2. 调用 linguistic_analyzer
3. 写入 daily_raw（标记为 BOOTSTRAP 分析）
4. 调用 auto_insight_generator
5. 更新 capability_baseline（如果有数据）
6. 输出第一份评分报告
7. 更新 .orchestrator_state.json（设置 data_accumulation_start: <today>）

输出格式：
```markdown
## 系统就绪

- data_accumulation_start: <today>
- first_analysis_completed: true
- daily_raw_count: <过去7天的碎碎念条数>
- status: 系统就绪

### 首轮分析结果
[评分报告]
```

### Step 4: 进入待数据积累状态
如果过去7天没有任何碎碎念：
1. 在 .orchestrator_state.json 设置 data_accumulation_start: <today>
2. 输出"待数据积累状态"，提醒用户开始碎碎念

输出格式：
```markdown
## 待数据积累

- data_accumulation_start: <today>
- status: 待数据积累
- message: 系统已就位，等待你的第一句碎碎念

### 建议的下一步
- 每天有任何想法都可以发给我
- 一周后系统会生成第一份周报
```

### Step 5: 手动触发支持
如果用户说"跑系统健康检查"或"bootstrap"，执行上述完整流程。

## 关键文件路径
- `.orchestrator_state.json`: memories/.orchestrator_state.json
- `daily_raw/`: memories/daily_raw/
- `short_term/`: memories/short_term/
- `capability_baseline.json`: config/capability_baseline.json
```

## 验证
完成后检查文件存在且包含：
- "data_accumulation_start"
- "系统就绪" 或 "待数据积累"
- "首轮分析" 或 "first_analysis"