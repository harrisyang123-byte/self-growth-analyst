/**
 * insight_persistence.js
 * 洞察持久化工具
 *
 * 用法：
 *   node insight_persistence.js archive <json_payload>
 *   node insight_persistence.js load [--dimensions <dims>] [--limit <n>]
 *
 * 注意：cross_period_links 由 agent 手动标注，不做自动推断。
 * 相似度匹配已移除——links 字段在归档时由分析 agent 填写。
 */

const fs = require('fs');
const path = require('path');

const INSIGHTS_DIR = path.join(__dirname, '../memories/insights');

function ensureInsightsDir() {
  if (!fs.existsSync(INSIGHTS_DIR)) {
    fs.mkdirSync(INSIGHTS_DIR, { recursive: true });
  }
}

function getNextSeq(date) {
  if (!fs.existsSync(INSIGHTS_DIR)) return 1;
  const existing = fs.readdirSync(INSIGHTS_DIR)
    .filter(f => f.startsWith(date))
    .map(f => {
      const match = f.match(/_(\d+)\.json$/);
      return match ? parseInt(match[1]) : 0;
    });
  return existing.length === 0 ? 1 : Math.max(...existing) + 1;
}

// ---------- archive ----------
function archiveInsight(payload) {
  ensureInsightsDir();
  const date = payload.date || new Date().toISOString().split('T')[0];
  const seq = payload.id ? parseInt(payload.id.split('_')[2]) : getNextSeq(date);
  const id = payload.id || `ins_${date}_${String(seq).padStart(3, '0')}`;

  const insight = {
    id,
    ...payload,
    date,
    created_at: new Date().toISOString()
  };

  const filePath = path.join(INSIGHTS_DIR, `${date}.json`);
  let existing = [];
  if (fs.existsSync(filePath)) {
    existing = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    if (!Array.isArray(existing)) existing = [existing];
  }

  // 如果当天已有同名id，更新；否则追加
  const idx = existing.findIndex(i => i.id === id);
  if (idx >= 0) {
    existing[idx] = insight;
  } else {
    existing.push(insight);
  }

  fs.writeFileSync(filePath, JSON.stringify(existing, null, 2), 'utf-8');
  return { ok: true, id, insight };
}

// ---------- load ----------
function loadRelatedInsights({ dimensions, limit = 10 }) {
  ensureInsightsDir();
  const files = fs.readdirSync(INSIGHTS_DIR).sort();
  const results = [];

  for (const file of files.reverse()) {
    if (!file.endsWith('.json')) continue;
    const content = JSON.parse(fs.readFileSync(path.join(INSIGHTS_DIR, file), 'utf-8'));
    const insights = Array.isArray(content) ? content : [content];

    for (const insight of insights) {
      if (!dimensions || dimensions.length === 0) {
        results.push(insight);
      } else {
        const hasOverlap = insight.dimensions_triggered?.some(d => dimensions.includes(d));
        if (hasOverlap) results.push(insight);
      }
      if (results.length >= limit) break;
    }
    if (results.length >= limit) break;
  }

  return results;
}

// ---------- CLI ----------
const [,, cmd, ...args] = process.argv;

if (cmd === 'archive') {
  const payload = JSON.parse(args.join(' '));
  console.log(JSON.stringify(archiveInsight(payload), null, 2));
} else if (cmd === 'load') {
  const dimsIdx = args.indexOf('--dimensions');
  const limIdx = args.indexOf('--limit');
  const dimensions = dimsIdx >= 0 ? args[dimsIdx + 1].split(',') : null;
  const limit = limIdx >= 0 ? parseInt(args[limIdx + 1]) : 10;
  console.log(JSON.stringify(loadRelatedInsights({ dimensions, limit }), null, 2));
} else {
  console.log('Usage: node insight_persistence.js archive <json> | load [--dimensions <dims>] [--limit <n>]');
}
