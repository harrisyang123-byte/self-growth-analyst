# Tasks

## Task 1: 目录结构创建 + 初始数据迁移

- [ ] 创建 `memories/commitments/` 目录
- [ ] 创建 `memories/insights/` 目录
- [ ] 将 pending_actions.json 内容迁移到 memories/commitments/active.json（格式转换）
- [ ] 创建 memories/commitments/history.json（空文件 + schema）

Owner: agent

---

## Task 2: commitment_tracker 实现

- [ ] 实现 createCommitment()
- [ ] 实现 checkCommitment()
- [ ] 实现 getActiveCommitments()
- [ ] 实现 runCommitmentCheck()
- [ ] 周复盘时自动触发 runCommitmentCheck()
- [ ] 精力账户承诺写入（第一期用例）

Owner: agent

---

## Task 3: insight_persistence 实现

- [ ] 实现 archiveInsight()
- [ ] 实现 loadRelatedInsights()
- [ ] 实现 findCrossPeriodLinks()
- [ ] Signal Depth Gate 触发时自动归档
- [ ] 分析启动时加载历史洞察作为上下文

Owner: agent

---

## Task 4: retrieval_index 时间权重升级

- [ ] 实现 calculatePatternScore()
- [ ] 实现 updateRecencyDecay()
- [ ] 升级 retrieval_index.json schema
- [ ] daily_raw 更新时触发 score 重算
- [ ] 周复盘展示 pattern_rank

Owner: agent

---

## Task 5: 第一期用例验证

- [ ] 用精力账户承诺走完完整流程
- [ ] 验证承诺到期检查正确工作
- [ ] 验证 insights 归档和加载
- [ ] 验证 pattern_score 计算正确

Owner: agent + 用户确认

---

## Task 6: GitHub 推送

- [ ] commit 所有变更
- [ ] push 到 master
- [ ] 用户验证
