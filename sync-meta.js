#!/usr/bin/env node
// Sync ad performance data from Meta Ads API into Creative OS
// Usage: node sync-meta.js [--days 30] [--status ACTIVE,PAUSED]
// Cron: run weekly to keep data fresh

const { getDb, init, generateId } = require('./db');
const https = require('https');

const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const RAW_ACCOUNT_ID = process.env.META_AD_ACCOUNT_ID || '10748070';
const AD_ACCOUNT_ID = RAW_ACCOUNT_ID.startsWith('act_') ? RAW_ACCOUNT_ID : `act_${RAW_ACCOUNT_ID}`;
const API_VERSION = 'v21.0';

// Parse args
const args = process.argv.slice(2);
const daysBack = parseInt(args[args.indexOf('--days') + 1]) || 90;
const dateFrom = new Date(Date.now() - daysBack * 86400000).toISOString().split('T')[0];
const dateTo = new Date().toISOString().split('T')[0];

if (!ACCESS_TOKEN) {
  console.error('META_ACCESS_TOKEN env var required');
  process.exit(1);
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { timeout: 30000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error(`Parse error: ${data.slice(0, 200)}`)); }
      });
    }).on('error', reject);
  });
}

async function fetchAllPages(baseUrl) {
  let results = [];
  let url = baseUrl;
  while (url) {
    const resp = await fetchJson(url);
    if (resp.error) throw new Error(`Meta API: ${resp.error.message}`);
    results = results.concat(resp.data || []);
    url = resp.paging?.next || null;
    // Safety limit
    if (results.length > 5000) break;
  }
  return results;
}

// Scale/Watch/Kill thresholds
const THRESHOLDS = {
  scale: { maxCpa: 25, minSpend: 100, minPurchases: 5 },
  watch: { maxCpa: 40, minSpend: 50, minPurchases: 2 },
  // Everything else with enough data is "kill"
  minSpendForClassification: 30,
};

function classify(ad) {
  const { spend, cpa, purchases } = ad;
  if (spend < THRESHOLDS.minSpendForClassification) return 'unvalidated';
  if (purchases >= THRESHOLDS.scale.minPurchases && cpa && cpa <= THRESHOLDS.scale.maxCpa && spend >= THRESHOLDS.scale.minSpend) return 'winner';
  if (purchases >= THRESHOLDS.watch.minPurchases && cpa && cpa <= THRESHOLDS.watch.maxCpa && spend >= THRESHOLDS.watch.minSpend) return 'near_winner';
  if (spend >= THRESHOLDS.minSpendForClassification && (cpa > THRESHOLDS.watch.maxCpa || purchases === 0)) return 'loser';
  return 'unvalidated';
}

function mapStatus(metaStatus) {
  const map = { ACTIVE: 'live', PAUSED: 'paused', DELETED: 'killed', ARCHIVED: 'killed' };
  return map[metaStatus] || 'draft';
}

async function main() {
  console.log(`Syncing Meta Ads from ${dateFrom} to ${dateTo}...`);

  // Step 1: Get ad insights with performance data
  const insightsUrl = `https://graph.facebook.com/${API_VERSION}/${AD_ACCOUNT_ID}/insights?fields=ad_id,ad_name,adset_name,campaign_name,spend,impressions,clicks,ctr,actions,cost_per_action_type&level=ad&time_range={"since":"${dateFrom}","until":"${dateTo}"}&limit=500&access_token=${ACCESS_TOKEN}`;

  console.log('Fetching ad insights...');
  const insights = await fetchAllPages(insightsUrl);
  console.log(`  Got ${insights.length} ad insights`);

  // Step 2: Get ad details (status, created time)
  const adsUrl = `https://graph.facebook.com/${API_VERSION}/${AD_ACCOUNT_ID}/ads?fields=id,name,status,created_time,adset{name},campaign{name}&limit=500&access_token=${ACCESS_TOKEN}`;

  console.log('Fetching ad metadata...');
  const ads = await fetchAllPages(adsUrl);
  console.log(`  Got ${ads.length} ads`);

  // Index ads by id
  const adMap = {};
  for (const ad of ads) {
    adMap[ad.id] = ad;
  }

  // Step 3: Process and upsert into DB
  init();
  const db = getDb();

  // Clear old synced data and re-insert
  db.exec("DELETE FROM creatives WHERE created_by = 'meta-sync'");

  const upsert = db.prepare(`INSERT INTO creatives (id, ad_name, persona, funnel_stage, offer, angle, hook_type, format, hook_lines, headlines, primary_text, status, classification, date_created, date_launched, spend, cpa, ctr, hook_rate, hold_rate, created_by, week_number)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  const insertMany = db.transaction((items) => {
    for (const item of items) {
      upsert.run(
        item.id, item.ad_name, item.persona, item.funnel_stage, item.offer,
        item.angle, item.hook_type, item.format,
        JSON.stringify(item.hook_lines || []), JSON.stringify(item.headlines || []),
        item.primary_text, item.status, item.classification,
        item.date_created, item.date_launched,
        item.spend, item.cpa, item.ctr, item.hook_rate, item.hold_rate,
        item.created_by, item.week_number
      );
    }
  });

  const processedAds = [];
  for (const insight of insights) {
    const adMeta = adMap[insight.ad_id] || {};

    // Extract purchase count and CPA from actions
    const actions = insight.actions || [];
    const costPerAction = insight.cost_per_action_type || [];
    const purchases = actions.find(a => a.action_type === 'purchase');
    const purchaseCount = purchases ? parseInt(purchases.value) : 0;
    const purchaseCost = costPerAction.find(a => a.action_type === 'purchase');
    const cpa = purchaseCost ? parseFloat(purchaseCost.value) : (purchaseCount > 0 ? parseFloat(insight.spend) / purchaseCount : null);

    const spend = parseFloat(insight.spend) || 0;
    const ctr = parseFloat(insight.ctr) || 0;

    // Parse ad name for signals
    const adName = insight.ad_name || '';
    const campaignName = insight.campaign_name || adMeta.campaign?.name || '';
    const adsetName = insight.adset_name || adMeta.adset?.name || '';

    // Infer format from name
    let format = 'static';
    const nameLower = adName.toLowerCase();
    if (nameLower.includes('ugc')) format = 'ugc';
    else if (nameLower.includes('video') || nameLower.includes('vid')) format = 'video';
    else if (nameLower.includes('carousel') || nameLower.includes('car')) format = 'carousel';

    // Infer funnel stage from campaign/adset name
    let funnelStage = 'product_aware';
    const campLower = (campaignName + ' ' + adsetName).toLowerCase();
    if (campLower.includes('retarget') || campLower.includes('remarket') || campLower.includes('bot') || campLower.includes('most_aware')) funnelStage = 'most_aware';
    else if (campLower.includes('prospect') || campLower.includes('cold') || campLower.includes('tof') || campLower.includes('problem')) funnelStage = 'problem_aware';
    else if (campLower.includes('solution') || campLower.includes('mof')) funnelStage = 'solution_aware';

    const createdDate = adMeta.created_time ? adMeta.created_time.split('T')[0] : dateFrom;
    const metaStatus = adMeta.status || 'ACTIVE';

    const adData = {
      id: generateId(),
      ad_name: `META-${insight.ad_id} ${adName}`,
      persona: 'Meta Audience',
      funnel_stage: funnelStage,
      offer: null,
      angle: adsetName || null,
      hook_type: null,
      format,
      hook_lines: [],
      headlines: [],
      primary_text: `Campaign: ${campaignName}\nAd Set: ${adsetName}`,
      status: mapStatus(metaStatus),
      spend,
      cpa,
      ctr: ctr / 100, // Meta returns percentage, we store decimal
      hook_rate: null,
      hold_rate: null,
      created_by: 'meta-sync',
      date_created: createdDate,
      date_launched: createdDate,
      week_number: getWeekNumber(new Date(createdDate)),
      purchases: purchaseCount,
    };

    adData.classification = classify(adData);

    processedAds.push(adData);
  }

  insertMany(processedAds);
  db.close();

  // Stats
  const winners = processedAds.filter(a => a.classification === 'winner').length;
  const nearWinners = processedAds.filter(a => a.classification === 'near_winner').length;
  const losers = processedAds.filter(a => a.classification === 'loser').length;
  const unvalidated = processedAds.filter(a => a.classification === 'unvalidated').length;
  const totalSpend = processedAds.reduce((s, a) => s + a.spend, 0);

  console.log(`\nSynced ${processedAds.length} ads from Meta:`);
  console.log(`  Winners (scale): ${winners}`);
  console.log(`  Near winners (watch): ${nearWinners}`);
  console.log(`  Losers (kill): ${losers}`);
  console.log(`  Unvalidated (not enough data): ${unvalidated}`);
  console.log(`  Total spend: $${totalSpend.toFixed(2)}`);
  console.log(`\nClassification thresholds:`);
  console.log(`  SCALE (winner): CPA ≤ $${THRESHOLDS.scale.maxCpa}, ≥ ${THRESHOLDS.scale.minPurchases} purchases, ≥ $${THRESHOLDS.scale.minSpend} spend`);
  console.log(`  WATCH (near_winner): CPA ≤ $${THRESHOLDS.watch.maxCpa}, ≥ ${THRESHOLDS.watch.minPurchases} purchases, ≥ $${THRESHOLDS.watch.minSpend} spend`);
  console.log(`  KILL (loser): CPA > $${THRESHOLDS.watch.maxCpa} or 0 purchases with ≥ $${THRESHOLDS.minSpendForClassification} spend`);
  console.log(`  UNVALIDATED: < $${THRESHOLDS.minSpendForClassification} spend`);
}

function getWeekNumber(d) {
  const start = new Date(d.getFullYear(), 0, 1);
  const diff = d - start + ((start.getTimezoneOffset() - d.getTimezoneOffset()) * 60000);
  return Math.ceil((diff / 86400000 + start.getDay() + 1) / 7);
}

main().catch(err => {
  console.error('Sync failed:', err.message);
  process.exit(1);
});
