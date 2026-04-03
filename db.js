const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const DB_PATH = path.join(__dirname, 'creative_os.db');

function getDb() {
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  return db;
}

function init() {
  const db = getDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS creatives (
      id TEXT PRIMARY KEY,
      persona TEXT,
      funnel_stage TEXT CHECK(funnel_stage IN ('problem_aware','solution_aware','product_aware','most_aware')),
      offer TEXT,
      angle TEXT,
      hook_type TEXT,
      format TEXT CHECK(format IN ('static','video','ugc','carousel')),
      hook_lines TEXT DEFAULT '[]',
      headlines TEXT DEFAULT '[]',
      primary_text TEXT,
      script TEXT,
      status TEXT DEFAULT 'draft' CHECK(status IN ('draft','in_review','approved','live','paused','killed')),
      classification TEXT DEFAULT 'unvalidated' CHECK(classification IN ('winner','near_winner','loser','unvalidated')),
      date_created TEXT DEFAULT (date('now')),
      date_launched TEXT,
      spend REAL DEFAULT 0,
      cpa REAL,
      ctr REAL,
      hook_rate REAL,
      hold_rate REAL,
      created_by TEXT,
      week_number INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_creatives_status ON creatives(status);
    CREATE INDEX IF NOT EXISTS idx_creatives_classification ON creatives(classification);
    CREATE INDEX IF NOT EXISTS idx_creatives_funnel_stage ON creatives(funnel_stage);
    CREATE INDEX IF NOT EXISTS idx_creatives_persona ON creatives(persona);
    CREATE INDEX IF NOT EXISTS idx_creatives_format ON creatives(format);
    CREATE INDEX IF NOT EXISTS idx_creatives_week_number ON creatives(week_number);
  `);

  // Migration: add ad_name column if missing
  const cols = db.prepare("PRAGMA table_info(creatives)").all().map(c => c.name);
  if (!cols.includes('ad_name')) {
    db.exec("ALTER TABLE creatives ADD COLUMN ad_name TEXT");
    db.exec("CREATE INDEX IF NOT EXISTS idx_creatives_ad_name ON creatives(ad_name)");
  }
  db.close();
}

function generateId() {
  return crypto.randomUUID();
}

module.exports = { getDb, init, generateId, DB_PATH };
