# Creative OS Database

The central creative asset database for Bari Life's AI creative assembly line. Every agent and team member reads from and writes to this system.

## Quick Start

```bash
npm install
npm start
# Server runs on http://localhost:3456
```

Set `PORT` env var to change the port (default: 3456).

## Schema

Each row represents a creative asset:

| Field | Type | Description | Constraints |
|---|---|---|---|
| id | UUID | Unique identifier | Auto-generated if not provided |
| persona | string | Target customer segment (e.g. "post-op bariatric patient") | |
| funnel_stage | enum | Awareness level | `problem_aware`, `solution_aware`, `product_aware`, `most_aware` |
| offer | string | The offer or promo tied to this creative | |
| angle | string | The emotional/logical lever | |
| hook_type | string | Type of hook | e.g. `pain`, `benefit`, `curiosity`, `social_proof` |
| format | enum | Creative format | `static`, `video`, `ugc`, `carousel` |
| hook_lines | text[] | Array of hook line variants | JSON array |
| headlines | text[] | Headline options | JSON array |
| primary_text | text | Primary ad text | |
| script | text | UGC script (hook/meat/CTA structure) | |
| status | enum | Lifecycle status | `draft`, `in_review`, `approved`, `live`, `paused`, `killed` |
| classification | enum | Performance classification | `winner`, `near_winner`, `loser`, `unvalidated` |
| date_created | date | When the concept was created | Auto-set to today |
| date_launched | date | When it went live | |
| spend | decimal | Total spend on this creative | Default: 0 |
| cpa | decimal | Cost per acquisition | |
| ctr | decimal | Click-through rate | |
| hook_rate | decimal | 3-second video view rate | |
| hold_rate | decimal | ThruPlay rate | |
| created_by | string | Agent or human who created it | |
| week_number | int | Production week number | |

## API Endpoints

### Health Check
```
GET /health
```
Returns `{ "status": "ok", "service": "creative-os" }`

### Create a Creative
```bash
POST /api/creatives
Content-Type: application/json

{
  "persona": "post-op bariatric patient",
  "funnel_stage": "problem_aware",
  "offer": "20% off starter kit",
  "angle": "vitamin deficiency fear",
  "hook_type": "pain",
  "format": "video",
  "hook_lines": ["Are you getting enough vitamins after surgery?"],
  "headlines": ["Don't Let Deficiency Win"],
  "primary_text": "After bariatric surgery, your body absorbs fewer nutrients...",
  "script": "Hook: Are you struggling?\nMeat: Most patients don't realize...\nCTA: Try our starter kit.",
  "status": "draft",
  "created_by": "creative-strategist",
  "week_number": 14
}
```
Returns the created creative with auto-generated `id`, `date_created`, timestamps.

### Get a Creative
```bash
GET /api/creatives/:id
```

### List Creatives (with Filters)
```bash
GET /api/creatives?status=draft&funnel_stage=problem_aware&format=video&limit=50&offset=0
```

**Filterable fields:** `status`, `classification`, `funnel_stage`, `persona`, `format`, `created_by`, `week_number`

**Pagination:** `limit` (default 100, max 1000), `offset` (default 0)

Returns:
```json
{
  "data": [...],
  "total": 42,
  "limit": 100,
  "offset": 0
}
```

### Update a Creative
```bash
PATCH /api/creatives/:id
Content-Type: application/json

{
  "status": "approved",
  "classification": "winner",
  "spend": 1500.00,
  "cpa": 24.50,
  "ctr": 0.032
}
```

### Delete a Creative
```bash
DELETE /api/creatives/:id
```

### Weekly Rollup
```bash
GET /api/rollup/weekly?week_number=14
```

Returns:
```json
{
  "week_number": 14,
  "concepts_created": 12,
  "concepts_launched": 5,
  "concepts_killed": 2,
  "by_status": [{"status": "draft", "count": 4}, ...],
  "by_classification": [{"status": "winner", "count": 1}, ...]
}
```

Omit `week_number` to get totals across all weeks.

## Common Workflows

### Creative Strategist: Submit a new concept
```bash
curl -X POST http://localhost:3456/api/creatives \
  -H "Content-Type: application/json" \
  -d '{"persona":"pre-op researcher","funnel_stage":"solution_aware","offer":"Free guide","angle":"surgery prep anxiety","hook_type":"curiosity","format":"static","hook_lines":["What your surgeon wishes you knew"],"headlines":["The Pre-Op Checklist"],"primary_text":"Preparing for surgery?...","created_by":"creative-strategist","week_number":14}'
```

### CMO: Review this week's output
```bash
# All creatives from week 14
curl http://localhost:3456/api/creatives?week_number=14

# Weekly summary
curl http://localhost:3456/api/rollup/weekly?week_number=14

# Only winners
curl http://localhost:3456/api/creatives?classification=winner
```

### Performance Update: Mark winners/losers after data comes in
```bash
curl -X PATCH http://localhost:3456/api/creatives/{id} \
  -H "Content-Type: application/json" \
  -d '{"classification":"winner","spend":2400,"cpa":18.50,"ctr":0.041,"hook_rate":0.35,"hold_rate":0.22}'
```

### Kill underperformers
```bash
curl -X PATCH http://localhost:3456/api/creatives/{id} \
  -H "Content-Type: application/json" \
  -d '{"status":"killed","classification":"loser"}'
```

## Tech Stack

- **Runtime:** Node.js + Express
- **Database:** SQLite (via better-sqlite3), WAL mode
- **Storage:** Local file `creative_os.db` in project root
- **No external dependencies** beyond npm packages

## File Structure

```
server.js        # Express API server
db.js            # Database schema, init, helpers
creative_os.db   # SQLite database (auto-created on first run)
package.json     # Dependencies and scripts
README.md        # This file
```
