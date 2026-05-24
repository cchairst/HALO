/**
 * nutritionDB.js — food → nutrient/ingredient mapping
 * ====================================================
 * Maps what a user types ("salmon and rice", "burger and fries") into the
 * nutrient categories the prediction engine actually cares about. This is NOT
 * a full USDA database — it's a focused mapping of the ~30 nutrient dimensions
 * that have evidence for HRQoL-relevant effects:
 *
 *   inflammatory markers:  omega6_ratio, seed_oil_load, added_sugar_g, trans_fat
 *   anti-inflammatory:     omega3_epa_dha, curcumin, gingerol, anthocyanins
 *   gut-relevant:          fiber_g, fermented, artificial_sweetener
 *   neuro-relevant:        lions_mane, caffeine_mg, alcohol_units
 *   general:               sodium_mg, processed_score (0-10)
 *
 * The matching is fuzzy and conservative: if a food isn't recognized, it returns
 * a neutral profile rather than guessing — bad data is worse than no data for
 * the prediction engine.
 *
 * In production this wraps a real API (USDA FoodData Central, Nutritionix, or
 * Edamam). The built-in table is enough for the PoC and covers the foods that
 * matter most for the engine's known relationships.
 */

const NUTRIENT_PROFILES = {
  // ── proteins ───────────────────────────────────────────────────────────────
  salmon:       { omega3_epa_dha: 2.2, omega6_ratio: 0.1, seed_oil_load: 0, added_sugar_g: 0, processed_score: 1, fiber_g: 0, protein_g: 25, category: "fish" },
  tuna:         { omega3_epa_dha: 1.5, omega6_ratio: 0.2, seed_oil_load: 0, added_sugar_g: 0, processed_score: 1, fiber_g: 0, protein_g: 26, category: "fish" },
  sardines:     { omega3_epa_dha: 2.0, omega6_ratio: 0.1, seed_oil_load: 0, added_sugar_g: 0, processed_score: 1, fiber_g: 0, protein_g: 21, category: "fish" },
  mackerel:     { omega3_epa_dha: 2.6, omega6_ratio: 0.1, seed_oil_load: 0, added_sugar_g: 0, processed_score: 1, fiber_g: 0, protein_g: 19, category: "fish" },
  chicken:      { omega3_epa_dha: 0.1, omega6_ratio: 3.0, seed_oil_load: 0, added_sugar_g: 0, processed_score: 1, fiber_g: 0, protein_g: 27, category: "poultry" },
  "fried chicken": { omega3_epa_dha: 0.05, omega6_ratio: 8.0, seed_oil_load: 6, added_sugar_g: 2, processed_score: 6, fiber_g: 0.5, protein_g: 22, category: "fried" },
  steak:        { omega3_epa_dha: 0.1, omega6_ratio: 5.0, seed_oil_load: 0, added_sugar_g: 0, processed_score: 1, fiber_g: 0, protein_g: 26, category: "red_meat" },
  eggs:         { omega3_epa_dha: 0.2, omega6_ratio: 3.0, seed_oil_load: 0, added_sugar_g: 0, processed_score: 0, fiber_g: 0, protein_g: 13, category: "eggs" },
  tofu:         { omega3_epa_dha: 0.1, omega6_ratio: 4.0, seed_oil_load: 0, added_sugar_g: 0, processed_score: 2, fiber_g: 1, protein_g: 17, category: "plant_protein" },

  // ── grains & starches ──────────────────────────────────────────────────────
  rice:         { omega3_epa_dha: 0, omega6_ratio: 1.0, seed_oil_load: 0, added_sugar_g: 0, processed_score: 1, fiber_g: 1.5, category: "grain" },
  "brown rice": { omega3_epa_dha: 0, omega6_ratio: 1.0, seed_oil_load: 0, added_sugar_g: 0, processed_score: 0, fiber_g: 3.5, category: "grain" },
  pasta:        { omega3_epa_dha: 0, omega6_ratio: 1.0, seed_oil_load: 0, added_sugar_g: 0, processed_score: 2, fiber_g: 2, category: "grain" },
  bread:        { omega3_epa_dha: 0, omega6_ratio: 2.0, seed_oil_load: 1, added_sugar_g: 2, processed_score: 3, fiber_g: 2, category: "grain" },
  oatmeal:      { omega3_epa_dha: 0, omega6_ratio: 1.0, seed_oil_load: 0, added_sugar_g: 0, processed_score: 0, fiber_g: 4, category: "grain" },
  "french fries": { omega3_epa_dha: 0, omega6_ratio: 9.0, seed_oil_load: 8, added_sugar_g: 0, processed_score: 7, fiber_g: 2, category: "fried" },
  fries:        { omega3_epa_dha: 0, omega6_ratio: 9.0, seed_oil_load: 8, added_sugar_g: 0, processed_score: 7, fiber_g: 2, category: "fried" },

  // ── fast food / processed ──────────────────────────────────────────────────
  burger:       { omega3_epa_dha: 0.05, omega6_ratio: 7.0, seed_oil_load: 5, added_sugar_g: 5, processed_score: 7, fiber_g: 1, category: "fast_food" },
  pizza:        { omega3_epa_dha: 0.1, omega6_ratio: 5.0, seed_oil_load: 4, added_sugar_g: 4, processed_score: 6, fiber_g: 2, category: "fast_food" },
  "hot dog":    { omega3_epa_dha: 0, omega6_ratio: 6.0, seed_oil_load: 3, added_sugar_g: 3, processed_score: 8, fiber_g: 0, category: "processed_meat" },
  chips:        { omega3_epa_dha: 0, omega6_ratio: 10.0, seed_oil_load: 9, added_sugar_g: 0, processed_score: 7, fiber_g: 1, category: "snack" },
  crackers:     { omega3_epa_dha: 0, omega6_ratio: 6.0, seed_oil_load: 5, added_sugar_g: 2, processed_score: 5, fiber_g: 1, category: "snack" },

  // ── sugary ─────────────────────────────────────────────────────────────────
  soda:         { omega3_epa_dha: 0, omega6_ratio: 0, seed_oil_load: 0, added_sugar_g: 39, processed_score: 9, fiber_g: 0, caffeine_mg: 35, category: "sugary_drink" },
  candy:        { omega3_epa_dha: 0, omega6_ratio: 0, seed_oil_load: 0, added_sugar_g: 45, processed_score: 9, fiber_g: 0, category: "sweets" },
  "ice cream":  { omega3_epa_dha: 0, omega6_ratio: 1.0, seed_oil_load: 0, added_sugar_g: 24, processed_score: 5, fiber_g: 0, category: "sweets" },
  cookies:      { omega3_epa_dha: 0, omega6_ratio: 4.0, seed_oil_load: 3, added_sugar_g: 20, processed_score: 6, fiber_g: 0.5, category: "sweets" },
  cake:         { omega3_epa_dha: 0, omega6_ratio: 3.0, seed_oil_load: 2, added_sugar_g: 30, processed_score: 6, fiber_g: 0.5, category: "sweets" },

  // ── fruits & vegetables ────────────────────────────────────────────────────
  salad:        { omega3_epa_dha: 0, omega6_ratio: 1.0, seed_oil_load: 0, added_sugar_g: 0, processed_score: 0, fiber_g: 3, anthocyanins: 0.2, category: "vegetable" },
  spinach:      { omega3_epa_dha: 0.1, omega6_ratio: 0.5, seed_oil_load: 0, added_sugar_g: 0, processed_score: 0, fiber_g: 4, category: "vegetable" },
  broccoli:     { omega3_epa_dha: 0.1, omega6_ratio: 0.5, seed_oil_load: 0, added_sugar_g: 0, processed_score: 0, fiber_g: 5, category: "vegetable" },
  banana:       { omega3_epa_dha: 0, omega6_ratio: 1.0, seed_oil_load: 0, added_sugar_g: 0, processed_score: 0, fiber_g: 3, category: "fruit" },
  berries:      { omega3_epa_dha: 0, omega6_ratio: 0.5, seed_oil_load: 0, added_sugar_g: 0, processed_score: 0, fiber_g: 4, anthocyanins: 3.5, category: "fruit" },
  blueberries:  { omega3_epa_dha: 0, omega6_ratio: 0.5, seed_oil_load: 0, added_sugar_g: 0, processed_score: 0, fiber_g: 4, anthocyanins: 4.0, category: "fruit" },
  "tart cherry":{ omega3_epa_dha: 0, omega6_ratio: 0.3, seed_oil_load: 0, added_sugar_g: 0, processed_score: 0, fiber_g: 2, anthocyanins: 5.0, category: "fruit" },
  avocado:      { omega3_epa_dha: 0.1, omega6_ratio: 2.0, seed_oil_load: 0, added_sugar_g: 0, processed_score: 0, fiber_g: 7, category: "fruit" },

  // ── dairy ──────────────────────────────────────────────────────────────────
  yogurt:       { omega3_epa_dha: 0.05, omega6_ratio: 1.5, seed_oil_load: 0, added_sugar_g: 4, processed_score: 1, fiber_g: 0, fermented: true, category: "dairy" },
  cheese:       { omega3_epa_dha: 0.1, omega6_ratio: 2.0, seed_oil_load: 0, added_sugar_g: 0, processed_score: 2, fiber_g: 0, category: "dairy" },
  milk:         { omega3_epa_dha: 0.05, omega6_ratio: 2.0, seed_oil_load: 0, added_sugar_g: 0, processed_score: 0, fiber_g: 0, category: "dairy" },

  // ── functional / supplements ───────────────────────────────────────────────
  turmeric:     { omega3_epa_dha: 0, omega6_ratio: 0, seed_oil_load: 0, added_sugar_g: 0, processed_score: 0, fiber_g: 0, curcumin: 5.0, category: "supplement" },
  ginger:       { omega3_epa_dha: 0, omega6_ratio: 0, seed_oil_load: 0, added_sugar_g: 0, processed_score: 0, fiber_g: 0, gingerol: 3.0, category: "supplement" },
  "lions mane": { omega3_epa_dha: 0, omega6_ratio: 0, seed_oil_load: 0, added_sugar_g: 0, processed_score: 0, fiber_g: 0, lions_mane: 1.0, category: "supplement" },
  "lion's mane":{ omega3_epa_dha: 0, omega6_ratio: 0, seed_oil_load: 0, added_sugar_g: 0, processed_score: 0, fiber_g: 0, lions_mane: 1.0, category: "supplement" },
  "fish oil":   { omega3_epa_dha: 3.0, omega6_ratio: 0, seed_oil_load: 0, added_sugar_g: 0, processed_score: 0, fiber_g: 0, category: "supplement" },
  "omega 3":    { omega3_epa_dha: 3.0, omega6_ratio: 0, seed_oil_load: 0, added_sugar_g: 0, processed_score: 0, fiber_g: 0, category: "supplement" },

  // ── beverages ──────────────────────────────────────────────────────────────
  coffee:       { omega3_epa_dha: 0, omega6_ratio: 0, seed_oil_load: 0, added_sugar_g: 0, processed_score: 0, fiber_g: 0, caffeine_mg: 95, category: "beverage" },
  "green tea":  { omega3_epa_dha: 0, omega6_ratio: 0, seed_oil_load: 0, added_sugar_g: 0, processed_score: 0, fiber_g: 0, caffeine_mg: 30, anthocyanins: 0.5, category: "beverage" },
  alcohol:      { omega3_epa_dha: 0, omega6_ratio: 0, seed_oil_load: 0, added_sugar_g: 5, processed_score: 3, fiber_g: 0, alcohol_units: 1.5, category: "beverage" },
  beer:         { omega3_epa_dha: 0, omega6_ratio: 0, seed_oil_load: 0, added_sugar_g: 5, processed_score: 3, fiber_g: 0, alcohol_units: 1.0, category: "beverage" },
  wine:         { omega3_epa_dha: 0, omega6_ratio: 0, seed_oil_load: 0, added_sugar_g: 2, processed_score: 2, fiber_g: 0, alcohol_units: 1.5, anthocyanins: 0.8, category: "beverage" },

  // ── fermented ──────────────────────────────────────────────────────────────
  kimchi:       { omega3_epa_dha: 0, omega6_ratio: 0.5, seed_oil_load: 0, added_sugar_g: 0, processed_score: 0, fiber_g: 2, fermented: true, category: "fermented" },
  sauerkraut:   { omega3_epa_dha: 0, omega6_ratio: 0.5, seed_oil_load: 0, added_sugar_g: 0, processed_score: 0, fiber_g: 3, fermented: true, category: "fermented" },
  kombucha:     { omega3_epa_dha: 0, omega6_ratio: 0, seed_oil_load: 0, added_sugar_g: 4, processed_score: 1, fiber_g: 0, fermented: true, caffeine_mg: 15, category: "fermented" },

  // ── oils (the seed-oil question) ───────────────────────────────────────────
  "olive oil":  { omega3_epa_dha: 0.1, omega6_ratio: 1.5, seed_oil_load: 0, added_sugar_g: 0, processed_score: 0, fiber_g: 0, category: "oil" },
  "canola oil": { omega3_epa_dha: 0.1, omega6_ratio: 4.0, seed_oil_load: 5, added_sugar_g: 0, processed_score: 3, fiber_g: 0, category: "oil" },
  "soybean oil":{ omega3_epa_dha: 0.05, omega6_ratio: 8.0, seed_oil_load: 8, added_sugar_g: 0, processed_score: 4, fiber_g: 0, category: "oil" },
  "vegetable oil":{ omega3_epa_dha: 0.02, omega6_ratio: 9.0, seed_oil_load: 9, added_sugar_g: 0, processed_score: 5, fiber_g: 0, category: "oil" },
  "coconut oil":{ omega3_epa_dha: 0, omega6_ratio: 0.5, seed_oil_load: 0, added_sugar_g: 0, processed_score: 1, fiber_g: 0, category: "oil" },
};

const NEUTRAL = {
  omega3_epa_dha: 0, omega6_ratio: 2, seed_oil_load: 0, added_sugar_g: 0,
  processed_score: 3, fiber_g: 1, category: "unknown",
};

// ── public API ───────────────────────────────────────────────────────────────
/**
 * Parse a free-text food string ("salmon and rice", "burger with fries")
 * into an array of recognized items with their nutrient profiles.
 */
function parseFoods(text) {
  const normalized = text.toLowerCase()
    .replace(/[,;]/g, " and ")
    .replace(/\bwith\b/g, "and")
    .replace(/\ba\b/g, "")
    .replace(/\bsome\b/g, "")
    .replace(/\bhad\b/g, "")
    .replace(/\bate\b/g, "")
    .trim();

  const items = normalized.split(/\s+and\s+|\s*\+\s*/).map(s => s.trim()).filter(Boolean);
  const results = [];

  for (const item of items) {
    // try exact match, then partial
    let profile = NUTRIENT_PROFILES[item];
    let matchedAs = item;
    if (!profile) {
      for (const [key, val] of Object.entries(NUTRIENT_PROFILES)) {
        if (item.includes(key) || key.includes(item)) {
          profile = val;
          matchedAs = key;
          break;
        }
      }
    }
    results.push({
      raw: item,
      matched: profile ? matchedAs : null,
      recognized: !!profile,
      nutrients: profile ? { ...profile } : { ...NEUTRAL },
    });
  }
  return results;
}

/**
 * Aggregate an array of parsed food items into daily nutrient totals —
 * the features the prediction engine consumes.
 */
function dailyNutrients(parsedFoods) {
  const totals = {
    omega3_epa_dha: 0, seed_oil_load: 0, added_sugar_g: 0,
    fiber_g: 0, processed_score: 0, curcumin: 0, gingerol: 0,
    anthocyanins: 0, lions_mane: 0, caffeine_mg: 0, alcohol_units: 0,
    fermented_count: 0, n_items: parsedFoods.length,
    n_recognized: parsedFoods.filter(f => f.recognized).length,
    recognition_rate: 0,
  };
  for (const f of parsedFoods) {
    const n = f.nutrients;
    totals.omega3_epa_dha += n.omega3_epa_dha || 0;
    totals.seed_oil_load += n.seed_oil_load || 0;
    totals.added_sugar_g += n.added_sugar_g || 0;
    totals.fiber_g += n.fiber_g || 0;
    totals.processed_score += n.processed_score || 0;
    totals.curcumin += n.curcumin || 0;
    totals.gingerol += n.gingerol || 0;
    totals.anthocyanins += n.anthocyanins || 0;
    totals.lions_mane += n.lions_mane || 0;
    totals.caffeine_mg += n.caffeine_mg || 0;
    totals.alcohol_units += n.alcohol_units || 0;
    if (n.fermented) totals.fermented_count++;
  }
  // average the score, not sum
  totals.processed_score = parsedFoods.length
    ? +(totals.processed_score / parsedFoods.length).toFixed(1) : 0;
  totals.recognition_rate = parsedFoods.length
    ? +(totals.n_recognized / parsedFoods.length).toFixed(2) : 0;
  return totals;
}

module.exports = { parseFoods, dailyNutrients, NUTRIENT_PROFILES, NEUTRAL };
