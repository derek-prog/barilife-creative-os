const express = require('express');
const path = require('path');
const { getDb, init, generateId } = require('./db');

init();

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3456;

// JSON array fields that are stored as text
const JSON_FIELDS = ['hook_lines', 'headlines'];

function parseRow(row) {
  if (!row) return null;
  for (const f of JSON_FIELDS) {
    if (row[f]) {
      try { row[f] = JSON.parse(row[f]); } catch { /* leave as string */ }
    }
  }
  return row;
}

function serializeJsonFields(body) {
  const out = { ...body };
  for (const f of JSON_FIELDS) {
    if (Array.isArray(out[f])) out[f] = JSON.stringify(out[f]);
  }
  return out;
}

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'creative-os' }));

// CREATE
app.post('/api/creatives', (req, res) => {
  const db = getDb();
  try {
    const id = req.body.id || generateId();
    const data = serializeJsonFields(req.body);

    const fields = ['id'];
    const placeholders = ['?'];
    const values = [id];

    const allowedFields = [
      'ad_name', 'persona', 'funnel_stage', 'offer', 'angle', 'hook_type', 'format',
      'hook_lines', 'headlines', 'primary_text', 'script', 'status',
      'classification', 'date_created', 'date_launched', 'spend', 'cpa',
      'ctr', 'hook_rate', 'hold_rate', 'created_by', 'week_number'
    ];

    for (const f of allowedFields) {
      if (data[f] !== undefined) {
        fields.push(f);
        placeholders.push('?');
        values.push(data[f]);
      }
    }

    db.prepare(`INSERT INTO creatives (${fields.join(',')}) VALUES (${placeholders.join(',')})`).run(...values);
    const row = db.prepare('SELECT * FROM creatives WHERE id = ?').get(id);
    res.status(201).json(parseRow(row));
  } catch (err) {
    res.status(400).json({ error: err.message });
  } finally {
    db.close();
  }
});

// READ ONE
app.get('/api/creatives/:id', (req, res) => {
  const db = getDb();
  try {
    const row = db.prepare('SELECT * FROM creatives WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(parseRow(row));
  } finally {
    db.close();
  }
});

// LIST with filters
app.get('/api/creatives', (req, res) => {
  const db = getDb();
  try {
    const filters = [];
    const values = [];
    const filterableFields = ['status', 'classification', 'funnel_stage', 'persona', 'format', 'created_by', 'week_number', 'ad_name'];

    for (const f of filterableFields) {
      if (req.query[f]) {
        filters.push(`${f} = ?`);
        values.push(req.query[f]);
      }
    }

    const where = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';
    const rawLimit = parseInt(req.query.limit);
    const limit = Math.min(Math.max(Number.isNaN(rawLimit) ? 100 : rawLimit, 0), 1000);
    const rawOffset = parseInt(req.query.offset);
    const offset = Math.max(Number.isNaN(rawOffset) ? 0 : rawOffset, 0);

    const rows = db.prepare(`SELECT * FROM creatives ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...values, limit, offset);
    const countRow = db.prepare(`SELECT COUNT(*) as total FROM creatives ${where}`).get(...values);

    res.json({
      data: rows.map(parseRow),
      total: countRow.total,
      limit,
      offset
    });
  } finally {
    db.close();
  }
});

// UPDATE
app.patch('/api/creatives/:id', (req, res) => {
  const db = getDb();
  try {
    const existing = db.prepare('SELECT * FROM creatives WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Not found' });

    const data = serializeJsonFields(req.body);
    const allowedFields = [
      'ad_name', 'persona', 'funnel_stage', 'offer', 'angle', 'hook_type', 'format',
      'hook_lines', 'headlines', 'primary_text', 'script', 'status',
      'classification', 'date_created', 'date_launched', 'spend', 'cpa',
      'ctr', 'hook_rate', 'hold_rate', 'created_by', 'week_number'
    ];

    const sets = ['updated_at = datetime(\'now\')'];
    const values = [];

    for (const f of allowedFields) {
      if (data[f] !== undefined) {
        sets.push(`${f} = ?`);
        values.push(data[f]);
      }
    }

    if (sets.length === 1) return res.status(400).json({ error: 'No valid fields to update' });

    values.push(req.params.id);
    db.prepare(`UPDATE creatives SET ${sets.join(',')} WHERE id = ?`).run(...values);
    const row = db.prepare('SELECT * FROM creatives WHERE id = ?').get(req.params.id);
    res.json(parseRow(row));
  } catch (err) {
    res.status(400).json({ error: err.message });
  } finally {
    db.close();
  }
});

// DELETE
app.delete('/api/creatives/:id', (req, res) => {
  const db = getDb();
  try {
    const result = db.prepare('DELETE FROM creatives WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ deleted: true });
  } finally {
    db.close();
  }
});

// WEEKLY ROLLUP
app.get('/api/rollup/weekly', (req, res) => {
  const db = getDb();
  try {
    const weekNum = req.query.week_number ? parseInt(req.query.week_number) : null;

    let where = '';
    const values = [];
    if (weekNum) {
      where = 'WHERE week_number = ?';
      values.push(weekNum);
    }

    const created = db.prepare(`SELECT COUNT(*) as count FROM creatives ${where}`).get(...values);

    const launchedWhere = weekNum
      ? "WHERE date_launched IS NOT NULL AND week_number = ?"
      : "WHERE date_launched IS NOT NULL";
    const launched = db.prepare(`SELECT COUNT(*) as count FROM creatives ${launchedWhere}`).get(...values);

    const killedWhere = weekNum
      ? "WHERE status = 'killed' AND week_number = ?"
      : "WHERE status = 'killed'";
    const killed = db.prepare(`SELECT COUNT(*) as count FROM creatives ${killedWhere}`).get(...values);

    const byStatus = db.prepare(`SELECT status, COUNT(*) as count FROM creatives ${where} GROUP BY status`).all(...values);
    const byClassification = db.prepare(`SELECT classification, COUNT(*) as count FROM creatives ${where} GROUP BY classification`).all(...values);

    res.json({
      week_number: weekNum || 'all',
      concepts_created: created.count,
      concepts_launched: launched.count,
      concepts_killed: killed.count,
      by_status: byStatus,
      by_classification: byClassification
    });
  } finally {
    db.close();
  }
});

// EXPORT: dump all data as JSON (for static report generation)
app.get('/api/export', (req, res) => {
  const db = getDb();
  try {
    const creatives = db.prepare('SELECT * FROM creatives ORDER BY created_at DESC').all().map(parseRow);

    const byStatus = db.prepare('SELECT status, COUNT(*) as count FROM creatives GROUP BY status').all();
    const byClassification = db.prepare('SELECT classification, COUNT(*) as count FROM creatives GROUP BY classification').all();
    const byFormat = db.prepare('SELECT format, COUNT(*) as count FROM creatives GROUP BY format').all();
    const byFunnel = db.prepare('SELECT funnel_stage, COUNT(*) as count FROM creatives GROUP BY funnel_stage').all();
    const byWeek = db.prepare('SELECT week_number, COUNT(*) as count, SUM(spend) as total_spend, AVG(cpa) as avg_cpa, AVG(ctr) as avg_ctr FROM creatives WHERE week_number IS NOT NULL GROUP BY week_number ORDER BY week_number').all();
    const total = db.prepare('SELECT COUNT(*) as count, SUM(spend) as total_spend, AVG(cpa) as avg_cpa, AVG(ctr) as avg_ctr FROM creatives').get();

    res.json({
      exported_at: new Date().toISOString(),
      summary: { total: total.count, total_spend: total.total_spend || 0, avg_cpa: total.avg_cpa, avg_ctr: total.avg_ctr },
      by_status: byStatus,
      by_classification: byClassification,
      by_format: byFormat,
      by_funnel_stage: byFunnel,
      by_week: byWeek,
      creatives
    });
  } finally {
    db.close();
  }
});

// GENERATE STATIC REPORT: writes a self-contained HTML report to public/report.html
app.post('/api/generate-report', (req, res) => {
  const db = getDb();
  const fs = require('fs');
  try {
    const creatives = db.prepare('SELECT * FROM creatives ORDER BY created_at DESC').all().map(parseRow);
    const byStatus = db.prepare('SELECT status, COUNT(*) as count FROM creatives GROUP BY status').all();
    const byClassification = db.prepare('SELECT classification, COUNT(*) as count FROM creatives GROUP BY classification').all();
    const byFormat = db.prepare('SELECT format, COUNT(*) as count FROM creatives GROUP BY format').all();
    const byFunnel = db.prepare('SELECT funnel_stage, COUNT(*) as count FROM creatives GROUP BY funnel_stage').all();
    const byWeek = db.prepare('SELECT week_number, COUNT(*) as count, SUM(spend) as total_spend, AVG(cpa) as avg_cpa FROM creatives WHERE week_number IS NOT NULL GROUP BY week_number ORDER BY week_number').all();
    const total = db.prepare('SELECT COUNT(*) as count, SUM(spend) as total_spend, AVG(cpa) as avg_cpa FROM creatives').get();

    const data = JSON.stringify({
      exported_at: new Date().toISOString(),
      summary: total,
      by_status: byStatus,
      by_classification: byClassification,
      by_format: byFormat,
      by_funnel_stage: byFunnel,
      by_week: byWeek,
      creatives
    });

    const template = fs.readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf8');
    const report = template.replace('__REPORT_DATA__', data);
    fs.writeFileSync(path.join(__dirname, 'public', 'report.html'), report);

    res.json({ status: 'ok', path: 'public/report.html', creatives_count: creatives.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    db.close();
  }
});

// Error-handling middleware — catches malformed JSON and other unhandled errors
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON in request body' });
  }
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Creative OS API running on port ${PORT}`);
});

module.exports = app;
