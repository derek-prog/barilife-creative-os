#!/usr/bin/env node
// Seed the Creative OS database with a realistic set of creatives
const { getDb, init, generateId } = require('./db');

init();
const db = getDb();

// Clear existing data
db.exec('DELETE FROM creatives');

const creatives = [
  // === WINNERS (proven performers) ===
  {
    ad_name: 'BL-V-001 Vitamin Deficiency Fear',
    persona: 'Post-Op Patient', funnel_stage: 'problem_aware', offer: '20% off Starter Kit',
    angle: 'Vitamin deficiency consequences', hook_type: 'pain', format: 'video',
    hook_lines: JSON.stringify(['Are you getting enough vitamins after surgery?', 'The silent danger after bariatric surgery']),
    headlines: JSON.stringify(['Don\'t Let Deficiency Win', 'Your Surgeon Won\'t Tell You This']),
    primary_text: 'After bariatric surgery, your body absorbs up to 70% fewer nutrients. Bari Life was formulated by bariatric surgeons specifically for patients like you.',
    status: 'live', classification: 'winner', date_created: '2026-02-10', date_launched: '2026-02-17',
    spend: 4250, cpa: 16.50, ctr: 0.045, hook_rate: 0.38, hold_rate: 0.24, created_by: 'creative-strategist', week_number: 7
  },
  {
    ad_name: 'BL-S-002 Hair Loss Testimonial',
    persona: 'Post-Op Patient', funnel_stage: 'problem_aware', offer: 'Free Shipping',
    angle: 'Hair loss reversal story', hook_type: 'social_proof', format: 'static',
    hook_lines: JSON.stringify(['I thought losing my hair was just part of the journey']),
    headlines: JSON.stringify(['She Got Her Hair Back', 'Real Results, Real Patients']),
    primary_text: '"I was losing clumps of hair 3 months post-op. My surgeon recommended Bari Life and within 6 weeks the shedding stopped." — Maria T.',
    status: 'live', classification: 'winner', date_created: '2026-02-03', date_launched: '2026-02-10',
    spend: 3800, cpa: 14.20, ctr: 0.052, hook_rate: 0.41, hold_rate: 0.28, created_by: 'creative-strategist', week_number: 6
  },
  {
    ad_name: 'BL-U-003 Morning Routine UGC',
    persona: 'Post-Op Patient', funnel_stage: 'solution_aware', offer: 'Subscribe & Save 15%',
    angle: 'Easy daily routine', hook_type: 'benefit', format: 'ugc',
    hook_lines: JSON.stringify(['My post-op morning routine in 60 seconds', 'How I take all my vitamins in one step']),
    headlines: JSON.stringify(['Simplify Your Supplement Routine']),
    primary_text: 'No more 8 different bottles. Bari Life combines everything bariatric patients need in one delicious shake.',
    script: 'Hook: Let me show you my morning routine post-surgery.\nMeat: I used to have 8 bottles on my counter. Now I just mix one scoop of Bari Life.\nCTA: Link in bio for 15% off your first subscription.',
    status: 'live', classification: 'winner', date_created: '2026-01-20', date_launched: '2026-01-27',
    spend: 6100, cpa: 12.80, ctr: 0.058, hook_rate: 0.44, hold_rate: 0.31, created_by: 'ugc-creator', week_number: 4
  },
  {
    ad_name: 'BL-C-004 Before/After Carousel',
    persona: 'Post-Op Patient', funnel_stage: 'product_aware', offer: '20% off Starter Kit',
    angle: 'Transformation results', hook_type: 'social_proof', format: 'carousel',
    hook_lines: JSON.stringify(['Swipe to see the difference proper nutrition makes']),
    headlines: JSON.stringify(['3 Months With Bari Life', 'The Proof Is In The Results']),
    primary_text: 'These patients committed to proper bariatric nutrition. See what happened next.',
    status: 'live', classification: 'winner', date_created: '2026-02-24', date_launched: '2026-03-03',
    spend: 2900, cpa: 15.30, ctr: 0.039, hook_rate: 0.35, hold_rate: 0.22, created_by: 'creative-strategist', week_number: 9
  },
  {
    ad_name: 'BL-V-005 Surgeon Endorsement',
    persona: 'Pre-Op Researcher', funnel_stage: 'solution_aware', offer: 'Free Sample Pack',
    angle: 'Doctor authority', hook_type: 'authority', format: 'video',
    hook_lines: JSON.stringify(['What I recommend to every patient before surgery', 'A bariatric surgeon\'s honest supplement review']),
    headlines: JSON.stringify(['Doctor Recommended', 'Formulated By Surgeons, For Patients']),
    primary_text: 'Dr. Matthew Weiner, bariatric surgeon, explains why he formulated Bari Life and recommends it to every patient.',
    status: 'live', classification: 'winner', date_created: '2026-03-03', date_launched: '2026-03-10',
    spend: 5200, cpa: 13.90, ctr: 0.048, hook_rate: 0.42, hold_rate: 0.29, created_by: 'creative-strategist', week_number: 10
  },

  // === NEAR WINNERS (showing promise) ===
  {
    ad_name: 'BL-V-006 Energy Crash Story',
    persona: 'Post-Op Patient', funnel_stage: 'problem_aware', offer: '20% off Starter Kit',
    angle: 'Energy and fatigue', hook_type: 'pain', format: 'video',
    hook_lines: JSON.stringify(['Why you feel exhausted 6 months after surgery', 'The energy crash nobody warned you about']),
    headlines: JSON.stringify(['Get Your Energy Back']),
    primary_text: 'Fatigue after bariatric surgery isn\'t normal — it\'s a sign your body needs targeted nutrition.',
    status: 'live', classification: 'near_winner', date_created: '2026-03-10', date_launched: '2026-03-17',
    spend: 1800, cpa: 22.40, ctr: 0.036, hook_rate: 0.32, hold_rate: 0.19, created_by: 'creative-strategist', week_number: 11
  },
  {
    ad_name: 'BL-S-007 Comparison Chart',
    persona: 'Post-Op Patient', funnel_stage: 'product_aware', offer: 'Subscribe & Save 15%',
    angle: 'Product comparison', hook_type: 'logic', format: 'static',
    hook_lines: JSON.stringify(['How Bari Life stacks up against generic vitamins']),
    headlines: JSON.stringify(['Not All Bariatric Vitamins Are Equal']),
    primary_text: 'Generic vitamins weren\'t designed for malabsorption. See how Bari Life\'s bioavailable forms compare.',
    status: 'live', classification: 'near_winner', date_created: '2026-03-10', date_launched: '2026-03-17',
    spend: 1500, cpa: 24.10, ctr: 0.033, hook_rate: 0.29, hold_rate: 0.17, created_by: 'creative-strategist', week_number: 11
  },
  {
    ad_name: 'BL-U-008 Taste Test UGC',
    persona: 'Post-Op Patient', funnel_stage: 'product_aware', offer: 'Free Shipping',
    angle: 'Taste and palatability', hook_type: 'curiosity', format: 'ugc',
    hook_lines: JSON.stringify(['Honest taste test of bariatric vitamins', 'I tried every bariatric vitamin brand — here\'s the truth']),
    headlines: JSON.stringify(['Finally, Vitamins That Don\'t Taste Terrible']),
    primary_text: 'Post-op patients struggle with vitamin compliance because most taste awful. Watch this honest comparison.',
    script: 'Hook: I bought every bariatric vitamin I could find and I\'m trying them all today.\nMeat: Brand A — chalky. Brand B — too sweet. Bari Life — actually tastes like a real shake.\nCTA: Link below to try it yourself.',
    status: 'live', classification: 'near_winner', date_created: '2026-03-17', date_launched: '2026-03-24',
    spend: 900, cpa: 21.00, ctr: 0.041, hook_rate: 0.36, hold_rate: 0.21, created_by: 'ugc-creator', week_number: 12
  },

  // === LOSERS (killed or poor performance) ===
  {
    ad_name: 'BL-S-009 Clinical Data Static',
    persona: 'Pre-Op Researcher', funnel_stage: 'solution_aware', offer: '20% off Starter Kit',
    angle: 'Clinical evidence', hook_type: 'logic', format: 'static',
    hook_lines: JSON.stringify(['The science behind bariatric nutrition']),
    headlines: JSON.stringify(['Clinically Formulated', 'Backed By Research']),
    primary_text: 'Bari Life contains chelated minerals and methylated B vitamins for maximum absorption post-surgery.',
    status: 'killed', classification: 'loser', date_created: '2026-02-17', date_launched: '2026-02-24',
    spend: 1200, cpa: 48.00, ctr: 0.012, hook_rate: 0.15, hold_rate: 0.08, created_by: 'creative-strategist', week_number: 8
  },
  {
    ad_name: 'BL-V-010 Generic Lifestyle',
    persona: 'Post-Op Patient', funnel_stage: 'most_aware', offer: 'Subscribe & Save 15%',
    angle: 'Lifestyle aspirational', hook_type: 'benefit', format: 'video',
    hook_lines: JSON.stringify(['Living your best life after surgery']),
    headlines: JSON.stringify(['Your New Chapter Starts Here']),
    primary_text: 'You did the hard part. Now give your body the nutrition it deserves.',
    status: 'killed', classification: 'loser', date_created: '2026-01-27', date_launched: '2026-02-03',
    spend: 2100, cpa: 52.50, ctr: 0.011, hook_rate: 0.14, hold_rate: 0.07, created_by: 'creative-strategist', week_number: 5
  },
  {
    ad_name: 'BL-S-011 Price Anchor',
    persona: 'Post-Op Patient', funnel_stage: 'most_aware', offer: '30% off First Order',
    angle: 'Price vs hospital visits', hook_type: 'logic', format: 'static',
    hook_lines: JSON.stringify(['$2/day vs $2,000 ER visit for deficiency']),
    headlines: JSON.stringify(['The Real Cost of Skipping Vitamins']),
    primary_text: 'A single hospitalization for nutrient deficiency costs more than 3 years of Bari Life.',
    status: 'killed', classification: 'loser', date_created: '2026-02-03', date_launched: '2026-02-10',
    spend: 950, cpa: 47.50, ctr: 0.015, hook_rate: 0.18, hold_rate: 0.09, created_by: 'creative-strategist', week_number: 6
  },
  {
    ad_name: 'BL-V-012 Scare Tactic',
    persona: 'Post-Op Patient', funnel_stage: 'problem_aware', offer: '20% off Starter Kit',
    angle: 'Health consequences fear', hook_type: 'pain', format: 'video',
    hook_lines: JSON.stringify(['You could end up in the hospital if you skip this']),
    headlines: JSON.stringify(['Don\'t Ignore These Warning Signs']),
    primary_text: 'Severe vitamin deficiency after bariatric surgery can lead to nerve damage, bone loss, and hospitalization.',
    status: 'killed', classification: 'loser', date_created: '2026-03-03', date_launched: '2026-03-10',
    spend: 800, cpa: 53.30, ctr: 0.010, hook_rate: 0.12, hold_rate: 0.06, created_by: 'creative-strategist', week_number: 10
  },
  {
    ad_name: 'BL-C-013 Ingredient Breakdown',
    persona: 'Pre-Op Researcher', funnel_stage: 'product_aware', offer: 'Free Sample Pack',
    angle: 'Ingredient transparency', hook_type: 'logic', format: 'carousel',
    hook_lines: JSON.stringify(['What\'s actually inside bariatric vitamins?']),
    headlines: JSON.stringify(['Full Ingredient Transparency']),
    primary_text: 'Swipe through to see every ingredient in Bari Life and why it matters for bariatric patients.',
    status: 'paused', classification: 'loser', date_created: '2026-03-17', date_launched: '2026-03-24',
    spend: 600, cpa: 40.00, ctr: 0.018, hook_rate: 0.20, hold_rate: 0.11, created_by: 'creative-strategist', week_number: 12
  },

  // === UNPROVEN / UNVALIDATED (new, not enough data yet) ===
  {
    ad_name: 'BL-U-014 Day In My Life',
    persona: 'Post-Op Patient', funnel_stage: 'solution_aware', offer: '20% off Starter Kit',
    angle: 'Relatable daily life', hook_type: 'curiosity', format: 'ugc',
    hook_lines: JSON.stringify(['Day in my life 8 months post-gastric sleeve']),
    headlines: JSON.stringify(['Life After Surgery']),
    primary_text: 'Follow along as a real patient shows how Bari Life fits into their daily routine.',
    script: 'Hook: 8 months post-sleeve and here\'s what a normal day looks like.\nMeat: Breakfast is my Bari Life shake — it has everything I need. Then gym, work, dinner prep.\nCTA: Get 20% off your starter kit with my link.',
    status: 'approved', classification: 'unvalidated', date_created: '2026-03-24', date_launched: null,
    spend: 0, cpa: null, ctr: null, hook_rate: null, hold_rate: null, created_by: 'ugc-creator', week_number: 13
  },
  {
    ad_name: 'BL-V-015 Protein Myth Buster',
    persona: 'Post-Op Patient', funnel_stage: 'problem_aware', offer: 'Subscribe & Save 15%',
    angle: 'Protein misconceptions', hook_type: 'curiosity', format: 'video',
    hook_lines: JSON.stringify(['The protein myth that\'s hurting your recovery', '60g of protein isn\'t enough after surgery']),
    headlines: JSON.stringify(['Are You Getting Enough Protein?']),
    primary_text: 'Most bariatric patients underestimate their protein needs. Bari Life protein shakes deliver 27g of easily absorbed protein per serving.',
    status: 'approved', classification: 'unvalidated', date_created: '2026-03-24', date_launched: null,
    spend: 0, cpa: null, ctr: null, hook_rate: null, hold_rate: null, created_by: 'creative-strategist', week_number: 13
  },
  {
    ad_name: 'BL-S-016 Amazon Review Highlight',
    persona: 'Post-Op Patient', funnel_stage: 'most_aware', offer: 'Free Shipping',
    angle: 'Social proof from reviews', hook_type: 'social_proof', format: 'static',
    hook_lines: JSON.stringify(['4.7 stars from 2,000+ bariatric patients']),
    headlines: JSON.stringify(['Trusted By Thousands']),
    primary_text: 'Over 2,000 verified bariatric patients rate Bari Life 4.7/5 on Amazon. See why they switched.',
    status: 'in_review', classification: 'unvalidated', date_created: '2026-03-31', date_launched: null,
    spend: 0, cpa: null, ctr: null, hook_rate: null, hold_rate: null, created_by: 'creative-strategist', week_number: 14
  },
  {
    ad_name: 'BL-V-017 Spouse Perspective',
    persona: 'Support Network', funnel_stage: 'problem_aware', offer: '20% off Starter Kit',
    angle: 'Caregiver worry', hook_type: 'pain', format: 'video',
    hook_lines: JSON.stringify(['Watching my wife struggle after surgery was the hardest part', 'What I wish I\'d known as a bariatric spouse']),
    headlines: JSON.stringify(['Support Their Recovery']),
    primary_text: 'If someone you love had bariatric surgery, their nutrition is your concern too. Bari Life makes it simple.',
    status: 'draft', classification: 'unvalidated', date_created: '2026-03-31', date_launched: null,
    spend: 0, cpa: null, ctr: null, hook_rate: null, hold_rate: null, created_by: 'creative-strategist', week_number: 14
  },
  {
    ad_name: 'BL-C-018 Flavor Lineup',
    persona: 'Post-Op Patient', funnel_stage: 'product_aware', offer: 'Free Sample Pack',
    angle: 'Product variety', hook_type: 'benefit', format: 'carousel',
    hook_lines: JSON.stringify(['5 flavors, zero compromise on nutrition']),
    headlines: JSON.stringify(['Find Your Favorite Flavor']),
    primary_text: 'Chocolate, vanilla, strawberry, mocha, and unflavored. Every Bari Life shake has the same complete nutrition profile.',
    status: 'draft', classification: 'unvalidated', date_created: '2026-03-31', date_launched: null,
    spend: 0, cpa: null, ctr: null, hook_rate: null, hold_rate: null, created_by: 'creative-strategist', week_number: 14
  },
  {
    ad_name: 'BL-U-019 1 Year Post-Op',
    persona: 'Post-Op Patient', funnel_stage: 'solution_aware', offer: 'Subscribe & Save 15%',
    angle: 'Long-term journey', hook_type: 'social_proof', format: 'ugc',
    hook_lines: JSON.stringify(['My 1-year bariatric surgery anniversary — here\'s what I learned']),
    headlines: JSON.stringify(['One Year Later']),
    primary_text: 'A real patient shares her 1-year journey and how consistent nutrition made the difference.',
    script: 'Hook: One year ago today I had gastric bypass surgery.\nMeat: The first 3 months were brutal — hair loss, fatigue, mood swings. Then I found Bari Life and everything changed.\nCTA: If you\'re on this journey, the link is in my bio.',
    status: 'draft', classification: 'unvalidated', date_created: '2026-04-01', date_launched: null,
    spend: 0, cpa: null, ctr: null, hook_rate: null, hold_rate: null, created_by: 'ugc-creator', week_number: 14
  },
  {
    ad_name: 'BL-S-020 Nutrient Checklist',
    persona: 'Pre-Op Researcher', funnel_stage: 'solution_aware', offer: 'Free Guide Download',
    angle: 'Educational content', hook_type: 'curiosity', format: 'static',
    hook_lines: JSON.stringify(['The 12 nutrients every bariatric patient must track']),
    headlines: JSON.stringify(['Your Post-Op Nutrition Checklist']),
    primary_text: 'Iron, B12, calcium citrate, vitamin D, zinc... are you tracking all 12? Download our free checklist.',
    status: 'draft', classification: 'unvalidated', date_created: '2026-04-01', date_launched: null,
    spend: 0, cpa: null, ctr: null, hook_rate: null, hold_rate: null, created_by: 'creative-strategist', week_number: 14
  },
];

const stmt = db.prepare(`INSERT INTO creatives (id, ad_name, persona, funnel_stage, offer, angle, hook_type, format, hook_lines, headlines, primary_text, script, status, classification, date_created, date_launched, spend, cpa, ctr, hook_rate, hold_rate, created_by, week_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

const insertMany = db.transaction((items) => {
  for (const c of items) {
    stmt.run(
      generateId(), c.ad_name, c.persona, c.funnel_stage, c.offer, c.angle, c.hook_type, c.format,
      c.hook_lines || '[]', c.headlines || '[]', c.primary_text || null, c.script || null,
      c.status, c.classification, c.date_created, c.date_launched || null,
      c.spend || 0, c.cpa || null, c.ctr || null, c.hook_rate || null, c.hold_rate || null,
      c.created_by, c.week_number
    );
  }
});

insertMany(creatives);
db.close();

console.log(`Seeded ${creatives.length} creatives:`);
console.log(`  Winners: ${creatives.filter(c => c.classification === 'winner').length}`);
console.log(`  Near winners: ${creatives.filter(c => c.classification === 'near_winner').length}`);
console.log(`  Losers: ${creatives.filter(c => c.classification === 'loser').length}`);
console.log(`  Unvalidated: ${creatives.filter(c => c.classification === 'unvalidated').length}`);
