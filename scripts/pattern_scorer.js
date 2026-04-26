/**
 * pattern_scorer.js
 * 带时间权重的模式评分计算器
 *
 * 用法：
 *   node pattern_scorer.js score [--pattern <name>]
 *   node pattern_scorer.js recalculate [--date YYYY-MM-DD]
 *   node pattern_scorer.js rank
 */

const fs = require('fs');
const path = require('path');

const INDEX_PATH = path.join(__dirname, '../memories/retrieval_index.json');

// ---------- CLI ----------
const [,, cmd, ...args] = process.argv;

// 解析 --date 参数，支持指定参考日期（测试/回填用）
const dateIdx = args.indexOf('--date');
const REFERENCE_DATE = dateIdx >= 0 && args[dateIdx + 1]
  ? new Date(args[dateIdx + 1])
  : new Date();

function loadIndex() {
  return JSON.parse(fs.readFileSync(INDEX_PATH, 'utf-8'));
}

function saveIndex(data) {
  fs.writeFileSync(INDEX_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

function calcDecay(days, lambda = 0.05) {
  return Math.exp(-lambda * days);
}

function calcPatternScore(occurrences, lambda = 0.05, recentWindow = 30, today = REFERENCE_DATE) {
  if (!occurrences || occurrences.length === 0) return 0;

  const sorted = [...occurrences].sort((a, b) => b.date.localeCompare(a.date));
  const lastDate = sorted[0].date;
  const daysSinceLast = Math.floor((today - new Date(lastDate)) / (1000 * 60 * 60 * 24));

  const recent = sorted.filter(o => {
    const d = Math.floor((today - new Date(o.date)) / (1000 * 60 * 60 * 24));
    return d <= recentWindow;
  });

  const historical = sorted.filter(o => {
    const d = Math.floor((today - new Date(o.date)) / (1000 * 60 * 60 * 24));
    return d > recentWindow;
  });

  const decayFactor = calcDecay(daysSinceLast, lambda);
  const historicalDecay = historical.length > 0
    ? calcDecay(Math.min(...historical.map(o => Math.floor((today - new Date(o.date)) / (1000 * 60 * 60 * 24)))), lambda)
    : 0;

  const recentScore = recent.length * decayFactor;
  const historicalScore = historical.length * historicalDecay * (1 - decayFactor);

  return Math.round((recentScore + historicalScore) * 100) / 100;
}

// ---------- recalculate all ----------
function recalculateAll() {
  const index = loadIndex();
  const patterns = index.patterns;
  const scored = [];

  for (const [name, data] of Object.entries(patterns)) {
    if (data.occurrences && data.occurrences.length > 0) {
      const lambda = index.recency_config?.lambda || 0.05;
      const recentWindow = index.recency_config?.recent_window_days || 30;
      const score = calcPatternScore(data.occurrences, lambda, recentWindow, REFERENCE_DATE);
      const daysSinceLast = Math.floor((REFERENCE_DATE - new Date(data.last_seen)) / (1000 * 60 * 60 * 24));

      data.pattern_score = score;
      data.recency_decay = {
        lambda,
        last_occurrence: data.last_seen,
        days_since_last: daysSinceLast,
        reference_date: REFERENCE_DATE.toISOString().split('T')[0]
      };
      data.recent_frequency = data.occurrences.filter(o => {
        const d = Math.floor((REFERENCE_DATE - new Date(o.date)) / (1000 * 60 * 60 * 24));
        return d <= recentWindow;
      }).length;

      scored.push({ name, score });
    }
  }

  // 排序并赋rank（从1开始）
  scored.sort((a, b) => b.score - a.score);
  scored.forEach((s, i) => {
    if (index.patterns[s.name]) {
      index.patterns[s.name].rank = i + 1;
    }
  });

  index.recency_config = index.recency_config || {};
  index.recency_config.reference_date = REFERENCE_DATE.toISOString().split('T')[0];
  index.metadata.last_updated = new Date().toISOString();
  saveIndex(index);

  return scored;
}

// ---------- rank ----------
function getRankedPatterns() {
  const index = loadIndex();
  return Object.entries(index.patterns)
    .map(([name, data]) => ({ name, score: data.pattern_score || 0, rank: data.rank, last_seen: data.last_seen }))
    .sort((a, b) => a.rank - b.rank);
}

// ---------- CLI actions ----------
if (cmd === 'score') {
  const patternIdx = args.indexOf('--pattern');
  if (patternIdx >= 0) {
    const name = args[patternIdx + 1];
    const index = loadIndex();
    const data = index.patterns[name];
    if (!data) { console.log('pattern not found'); process.exit(1); }
    console.log(JSON.stringify(data, null, 2));
  } else {
    const index = loadIndex();
    console.log(JSON.stringify(index.patterns, null, 2));
  }
} else if (cmd === 'recalculate') {
  console.log(JSON.stringify(recalculateAll(), null, 2));
} else if (cmd === 'rank') {
  console.log(JSON.stringify(getRankedPatterns(), null, 2));
} else {
  console.log('Usage: node pattern_scorer.js score [--pattern <name>] | recalculate [--date YYYY-MM-DD] | rank');
}
