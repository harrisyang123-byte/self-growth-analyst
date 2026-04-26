/**
 * insight_persistence.js
 * 洞察持久化工具
 * 
 * 用法：
 *   node insight_persistence.js archive <json_payload>
 *   node insight_persistence.js load [--dimensions <dims>] [--limit <n>]
 *   node insight_persistence.js link <date> <link_type> <linked_date> <note>
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
  const seq = getNextSeq(date);
  const id = `ins_${date}_${String(seq).padStart(3, '0')}`;
  
  const insight = {
    id,
    ...payload,
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
      if (!dimensions) {
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

// ---------- find links ----------
function findCrossPeriodLinks(newRootCause, dimensions) {
  const related = loadRelatedInsights({ dimensions, limit: 20 });
  const links = [];
  
  for (const insight of related) {
    if (insight.root_cause && newRootCause !== insight.root_cause) {
      // 简单的关键词匹配作为相似度代理
      const newWords = new Set(newRootCause.match(/\w{2,}/g) || []);
      const oldWords = new Set(insight.root_cause.match(/\w{2,}/g) || []);
      const intersection = [...newWords].filter(w => oldWords.has(w));
      const similarity = intersection.length / Math.max(newWords.size, oldWords.size);
      
      if (similarity > 0.4) {
        links.push({
          type: 'same_root_cause',
          linked_date: insight.date,
          linked_insight_id: insight.id,
          similarity,
          note: `两件事的根因都是：${insight.root_cause.substring(0, 50)}...`
        });
      }
    }
  }
  
  return links;
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
} else if (cmd === 'links') {
  const [newRootCause, dimsStr] = args;
  const dimensions = dimsStr ? dimsStr.split(',') : null;
  console.log(JSON.stringify(findCrossPeriodLinks(newRootCause, dimensions), null, 2));
} else {
  console.log('Usage: node insight_persistence.js archive|load|links');
}
