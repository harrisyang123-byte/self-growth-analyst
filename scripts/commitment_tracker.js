/**
 * commitment_tracker.js
 * 承诺追踪工具
 * 
 * 用法：
 *   node commitment_tracker.js create <content> <dimensions> <verification_type> <condition>
 *   node commitment_tracker.js check <id> <result>
 *   node commitment_tracker.js list [--dimension <dim>]
 *   node commitment_tracker.js due
 */

const fs = require('fs');
const path = require('path');

const COMMITMENTS_DIR = path.join(__dirname, '../memories/commitments');
const ACTIVE_PATH = path.join(COMMITMENTS_DIR, 'active.json');
const HISTORY_PATH = path.join(COMMITMENTS_DIR, 'history.json');

function loadJSON(file) {
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

function saveJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
}

function generateId(date, type, seq) {
  return `c_${date}_${type}_${String(seq).padStart(3, '0')}`;
}

function getNextSeq(type) {
  try {
    const active = loadJSON(ACTIVE_PATH);
    const existing = active.commitments.filter(c => c.id.includes(type));
    if (existing.length === 0) return 1;
    const seqs = existing.map(c => parseInt(c.id.split('_')[3]));
    return Math.max(...seqs) + 1;
  } catch {
    return 1;
  }
}

// ---------- create ----------
function createCommitment({ content, source, dimensions, verification, userQuote }) {
  const active = loadJSON(ACTIVE_PATH);
  const date = new Date().toISOString().split('T')[0];
  const type = dimensions[0] || 'misc';
  const id = generateId(date, type, getNextSeq(type));
  
  // 计算 next_check
  let nextCheck;
  if (verification.type === 'recurrence') {
    const days = verification.check_interval === 'weekly' ? 7 : verification.check_interval === 'daily' ? 1 : 7;
    const d = new Date();
    d.setDate(d.getDate() + days);
    nextCheck = d.toISOString().split('T')[0];
  } else {
    nextCheck = '2026-05-01';
  }
  
  const commitment = {
    id,
    content,
    source,
    dimensions,
    verification,
    created_at: new Date().toISOString(),
    next_check: nextCheck,
    status: 'active',
    history: [{ date, event: 'created' }]
  };
  
  active.commitments.push(commitment);
  active.meta.total_active = active.commitments.length;
  active.meta.last_updated = new Date().toISOString();
  saveJSON(ACTIVE_PATH, active);
  
  return { ok: true, id, commitment };
}

// ---------- check ----------
function checkCommitment(id, result) {
  const active = loadJSON(ACTIVE_PATH);
  const history = loadJSON(HISTORY_PATH);
  const idx = active.commitments.findIndex(c => c.id === id);
  
  if (idx === -1) return { ok: false, error: 'commitment not found' };
  
  const commitment = active.commitments[idx];
  const now = new Date().toISOString();
  
  if (result === 'success') {
    commitment.history.push({ date: now.split('T')[0], event: 'check_passed' });
    active.commitments.splice(idx, 1);
    history.completed.push({ ...commitment, completed_at: now, completion_quality: 'full' });
    history.meta.total_completed++;
  } else if (result === 'violated') {
    commitment.history.push({ date: now.split('T')[0], event: 'check_failed' });
    active.commitments.splice(idx, 1);
    history.violated.push({ ...commitment, violated_at: now });
    history.meta.total_violated++;
  } else {
    // update next_check
    const days = commitment.verification.check_interval === 'weekly' ? 7 : 1;
    const d = new Date();
    d.setDate(d.getDate() + days);
    commitment.next_check = d.toISOString().split('T')[0];
    commitment.history.push({ date: now.split('T')[0], event: 'next_check_updated' });
  }
  
  active.meta.last_updated = now;
  history.meta.last_updated = now;
  saveJSON(ACTIVE_PATH, active);
  saveJSON(HISTORY_PATH, history);
  
  return { ok: true, id };
}

// ---------- list ----------
function listCommitments(dimension) {
  const active = loadJSON(ACTIVE_PATH);
  let list = active.commitments;
  if (dimension) {
    list = list.filter(c => c.dimensions.includes(dimension));
  }
  return list;
}

// ---------- due ----------
function getDueCommitments() {
  const active = loadJSON(ACTIVE_PATH);
  const today = new Date().toISOString().split('T')[0];
  const due = active.commitments.filter(c => c.next_check <= today);
  const upcoming = active.commitments
    .filter(c => c.next_check > today)
    .sort((a, b) => a.next_check.localeCompare(b.next_check))
    .slice(0, 5);
  return { due, upcoming };
}

// ---------- CLI ----------
const [,, cmd, ...args] = process.argv;

if (cmd === 'create') {
  const [content, dimensionsStr, vType, condition] = args;
  console.log(JSON.stringify(createCommitment({
    content,
    source: { date: new Date().toISOString().split('T')[0] },
    dimensions: dimensionsStr ? dimensionsStr.split(',') : ['misc'],
    verification: { type: vType || 'one_time', condition: condition || '' },
    userQuote: ''
  }), null, 2));
} else if (cmd === 'check') {
  const [id, result] = args;
  console.log(JSON.stringify(checkCommitment(id, result), null, 2));
} else if (cmd === 'list') {
  const dim = args.includes('--dimension') ? args[args.indexOf('--dimension') + 1] : null;
  console.log(JSON.stringify(listCommitments(dim), null, 2));
} else if (cmd === 'due') {
  console.log(JSON.stringify(getDueCommitments(), null, 2));
} else {
  console.log('Usage: node commitment_tracker.js create|check|list|due');
}
