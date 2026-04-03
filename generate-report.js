#!/usr/bin/env node
// Generate a self-contained static report for GitHub Pages
// Usage: node generate-report.js
// Output: docs/index.html (ready for GitHub Pages)

const fs = require('fs');
const path = require('path');
const { getDb, init } = require('./db');

init();

const db = getDb();

function parseRow(row) {
  if (!row) return null;
  for (const f of ['hook_lines', 'headlines']) {
    if (row[f]) {
      try { row[f] = JSON.parse(row[f]); } catch { /* leave as string */ }
    }
  }
  return row;
}

const creatives = db.prepare('SELECT * FROM creatives ORDER BY created_at DESC').all().map(parseRow);
const byStatus = db.prepare('SELECT status, COUNT(*) as count FROM creatives GROUP BY status').all();
const byClassification = db.prepare('SELECT classification, COUNT(*) as count FROM creatives GROUP BY classification').all();
const byFormat = db.prepare('SELECT format, COUNT(*) as count FROM creatives GROUP BY format').all();
const byFunnel = db.prepare('SELECT funnel_stage, COUNT(*) as count FROM creatives GROUP BY funnel_stage').all();
const byWeek = db.prepare('SELECT week_number, COUNT(*) as count, SUM(spend) as total_spend, AVG(cpa) as avg_cpa FROM creatives WHERE week_number IS NOT NULL GROUP BY week_number ORDER BY week_number').all();
const total = db.prepare('SELECT COUNT(*) as count, SUM(spend) as total_spend, AVG(cpa) as avg_cpa, AVG(ctr) as avg_ctr FROM creatives').get();

db.close();

const data = JSON.stringify({
  exported_at: new Date().toISOString(),
  summary: { count: total.count, total_spend: total.total_spend || 0, avg_cpa: total.avg_cpa, avg_ctr: total.avg_ctr },
  by_status: byStatus,
  by_classification: byClassification,
  by_format: byFormat,
  by_funnel_stage: byFunnel,
  by_week: byWeek,
  creatives
});

const template = fs.readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf8');
const report = template.replace('__REPORT_DATA__', data);

// Write to both locations
fs.writeFileSync(path.join(__dirname, 'docs', 'index.html'), report);
fs.writeFileSync(path.join(__dirname, 'public', 'report.html'), report);

console.log(`Report generated: ${creatives.length} creatives`);
console.log('  -> docs/index.html (GitHub Pages)');
console.log('  -> public/report.html (local)');
