/**
 * predictor.js — the prediction pipeline
 * ========================================
 * The core flow that turns raw user input into actionable output:
 *
 *   what user ate + how they feel
 *     → nutrition facts (via nutritionDB)
 *       → prediction models (population prior + personal history)
 *         → suggestions for doctors
 *
 * Three tiers of output based on how much data the user has:
 *
 *   Tier 1 (day 0–14):  population prior only.
 *     "Based on patterns in similar users, seed oils are commonly associated
 *      with increased joint pain ~2 days later (seen in 78% of users)."
 *
 *   Tier 2 (weeks 2–8):  blended (shrinkage) estimate.
 *     "Early signal from YOUR data + population: this meal's seed-oil load
 *      may raise your joint pain. Confidence: moderate (62% personal weight)."
 *
 *   Tier 3 (150+ days):  validated personal signal.
 *     "Confirmed in your own data: seed oil intake raises your joint pain
 *      at a 2-day lag (r=+0.33, 99% confidence, 157 observations)."
 *
 * The doctor-ready output is a structured JSON summary a clinician can
 * actually use: what was eaten (with nutrient breakdown), what was predicted,
 * the evidence tier, and specific discussion points.
 */

const { parseFoods, dailyNutrients } = require("./nutritionDB");

// ── nutrient → engine-input mapping ──────────────────────────────────────────
// The population prior uses abstract "input names" (seed_oil, omega3, sugar,
// turmeric). This maps daily nutrient totals to those same dimensions so the
// prior can score today's intake.
const NUTRIENT_TO_INPUT = {
  seed_oil:  (n) => n.seed_oil_load,
  omega3:    (n) => n.omega3_epa_dha,
  sugar:     (n) => n.added_sugar_g / 10,  // scale to ~0-5 like the synthetic data
  turmeric:  (n) => n.curcumin,
  // extensible: add ginger, lions_mane, anthocyanins, etc. as the prior grows
};

// ── symptom labels ───────────────────────────────────────────────────────────
const SYMPTOM_LABELS = {
  joint_pain: "Joint Pain",
  mood: "Mood (lower = worse)",
  fatigue: "Fatigue",
  cognitive_clarity: "Cognitive Clarity",
  sleep_quality: "Sleep Quality",
};

// ── the predictor ────────────────────────────────────────────────────────────
class AugurPredictor {
  /**
   * @param {object} populationPrior — the saved prior from population_prior.json
   * @param {object} [userProfile] — { medications, allergies, conditions, daysLogged }
   * @param {Array}  [personalSignals] — validated signals from the engine (tier 3)
   */
  constructor(populationPrior, userProfile = {}, personalSignals = []) {
    this.prior = this._indexPrior(populationPrior);
    this.profile = {
      medications: userProfile.medications || [],
      allergies: userProfile.allergies || [],
      pollenSensitivities: userProfile.pollenSensitivities || userProfile.environmentalAllergies || [],
      conditions: userProfile.conditions || [],
      daysLogged: userProfile.daysLogged || 0,
    };
    this.personalSignals = personalSignals;
  }

  /**
   * Main entry point. Takes what the user ate and how they feel right now,
   * returns predictions + doctor-ready suggestions.
   *
   * @param {string} foodText — free text: "salmon and rice, side salad"
   * @param {object} symptoms — current ratings: { joint_pain: 6, mood: 3, ... }
   * @param {object} [personalEstimates] — from the engine's partial-correlation
   *   for the current user: { "seed_oil->joint_pain": { r, se }, ... }
   * @returns {object} full prediction output
   */
  predict(foodText, symptoms = {}, personalEstimates = {}, environmentalContext = {}) {
    // 1. Parse food → nutrients
    const foods = parseFoods(foodText);
    const nutrients = dailyNutrients(foods);
    const tier = this._dataTier();

    // 2. For each known relationship, score today's intake
    const predictions = [];
    for (const [key, priorEntry] of Object.entries(this.prior)) {
      const [inputName, symptomName] = key.split("->");
      const mapper = NUTRIENT_TO_INPUT[inputName];
      if (!mapper) continue;

      const todayLevel = mapper(nutrients);
      const isElevated = todayLevel > 2.0;  // meaningful intake threshold
      const isLow = todayLevel < 0.5;

      // get the effect estimate (population, blended, or personal)
      const pe = personalEstimates[key];
      const estimate = this._getEstimate(key, priorEntry, pe);

      // generate a prediction only if intake is notable
      if (!isElevated && !isLow) continue;

      const direction = estimate.mu > 0 ? "aggravates" : "relieves";
      const verb = direction === "aggravates"
        ? (isElevated ? "may increase" : "reduction may help")
        : (isElevated ? "may help reduce" : "absence may worsen");

      predictions.push({
        input: inputName,
        symptom: symptomName,
        symptomLabel: SYMPTOM_LABELS[symptomName] || symptomName,
        direction,
        lagDays: priorEntry.lag,
        todayIntake: +todayLevel.toFixed(2),
        intakeLevel: isElevated ? "elevated" : "low",
        effect: {
          estimate: +estimate.estimate.toFixed(3),
          weightPersonal: +estimate.weightPersonal.toFixed(2),
          source: estimate.source,
          populationMu: +estimate.mu.toFixed(3),
          populationPrevalence: +((priorEntry.prevalence || 0) * 100).toFixed(0) + "%",
          nUsersInPrior: priorEntry.n_users,
        },
        prediction: `Today's ${inputName.replace("_", " ")} intake ${verb} your ${SYMPTOM_LABELS[symptomName] || symptomName} in ~${priorEntry.lag} day(s).`,
        tier: tier.label,
        confidence: tier.confidence,
      });
    }

    // 3. Flag any nutrient concerns not in the prior
    const flags = this._nutritionFlags(nutrients);

    // 4. Add allergy/environment warnings from food allergies + pollen API context
    const allergyWarnings = this._allergyWarnings(foods, environmentalContext);

    // 5. Generate positive recommendations, not just bad-food detection
    const recommendations = this._recommendations(foods, nutrients, predictions, symptoms, flags, allergyWarnings);

    // 6. Assemble doctor-ready output
    const doctorSummary = this._doctorSummary(foods, nutrients, predictions, symptoms, flags, recommendations, allergyWarnings, environmentalContext);

    return {
      timestamp: new Date().toISOString(),
      tier: tier,
      foodsParsed: foods,
      dailyNutrients: nutrients,
      predictions,
      nutritionFlags: flags,
      allergyWarnings,
      environmentalContext,
      recommendations,
      doctorSummary,
    };
  }

  // ── internals ──────────────────────────────────────────────────────────────
  _indexPrior(saved) {
    const idx = {};
    for (const p of (saved.priors || [])) {
      idx[`${p.input}->${p.symptom}`] = p;
    }
    return idx;
  }

  _dataTier() {
    const d = this.profile.daysLogged;
    if (d >= 150) return { label: "personal", confidence: "high",
      note: "Validated against your own longitudinal data." };
    if (d >= 14) return { label: "blended", confidence: "moderate",
      note: "Early personal signal blended with population patterns." };
    return { label: "population", confidence: "low",
      note: "Based on patterns in similar users. Log more days to personalize." };
  }

  _getEstimate(key, priorEntry, personalEst) {
    if (this.profile.daysLogged >= 150) {
      // check for a validated personal signal
      const ps = this.personalSignals.find(
        s => `${s.input || s.inputName}->${s.symptom || s.symptomName}` === key
      );
      if (ps) return {
        estimate: ps.effect_r || ps.effectSize || priorEntry.mu,
        weightPersonal: 1.0, source: "validated_personal",
        mu: priorEntry.mu,
      };
    }

    if (personalEst && personalEst.r != null && personalEst.se != null) {
      const tau2 = priorEntry.tau ** 2;
      const w = tau2 / (tau2 + personalEst.se ** 2 + 1e-9);
      return {
        estimate: w * personalEst.r + (1 - w) * priorEntry.mu,
        weightPersonal: w, source: "blended", mu: priorEntry.mu,
      };
    }

    return {
      estimate: priorEntry.mu, weightPersonal: 0,
      source: "population_prior", mu: priorEntry.mu,
    };
  }

  _nutritionFlags(nutrients) {
    const flags = [];
    if (nutrients.added_sugar_g > 25)
      flags.push({ level: "warning", category: "sugar",
        message: `High added sugar today (${nutrients.added_sugar_g}g). Associated with fatigue and inflammation.` });
    if (nutrients.seed_oil_load > 5)
      flags.push({ level: "warning", category: "seed_oil",
        message: `High seed-oil load today (${nutrients.seed_oil_load}/10). Associated with inflammatory markers.` });
    if (nutrients.processed_score > 5)
      flags.push({ level: "caution", category: "processed",
        message: `Highly processed meals today (score ${nutrients.processed_score}/10).` });
    if (nutrients.omega3_epa_dha < 0.5 && nutrients.n_items >= 3)
      flags.push({ level: "info", category: "omega3",
        message: `Low omega-3 intake today. Consider fish or supplementation if consistent.` });
    if (nutrients.fiber_g < 5 && nutrients.n_items >= 3)
      flags.push({ level: "info", category: "fiber",
        message: `Low fiber today (${nutrients.fiber_g}g). May affect digestion and satiety.` });
    if (nutrients.alcohol_units > 2)
      flags.push({ level: "warning", category: "alcohol",
        message: `Elevated alcohol (${nutrients.alcohol_units} units). May affect sleep quality and mood.` });
    return flags;
  }


  _hasMedication(pattern) {
    return this.profile.medications
      .map(m => String(m).toLowerCase())
      .some(m => pattern.test(m));
  }

  _hasAllergy(pattern) {
    return this.profile.allergies
      .map(a => String(a).toLowerCase())
      .some(a => pattern.test(a));
  }

  _recommendations(foods, nutrients, predictions, symptoms, flags, allergyWarnings = []) {
    return {
      tier1_lifestyle_suggestions: this._tier1Lifestyle(nutrients, symptoms),
      tier2_food_substitutions: this._tier2FoodSubstitutions(foods, nutrients, symptoms),
      tier3_otc_supplement_considerations: this._tier3SupplementConsiderations(nutrients, symptoms),
      tier4_physician_escalation_flags: this._tier4EscalationFlags(symptoms, nutrients, flags, allergyWarnings),
      allergy_environment_guidance: this._allergyEnvironmentGuidance(allergyWarnings),
      predictedInterventionImpact: this._predictedInterventionImpact(predictions, nutrients),
    };
  }

  _allergyWarnings(foods, environmentalContext = {}) {
    const warnings = [];

    // Food allergy hard blocks from the user's profile.
    const allergyTerms = this.profile.allergies.map(a => String(a).toLowerCase());
    for (const food of foods) {
      const raw = `${food.raw || ""} ${food.matched || ""} ${food.nutrients.category || ""}`.toLowerCase();
      for (const allergy of allergyTerms) {
        if (!allergy) continue;
        const broadFish = /fish|seafood|shellfish/.test(allergy) && /salmon|tuna|sardine|mackerel|fish|seafood|shellfish/.test(raw);
        const broadDairy = /dairy|milk/.test(allergy) && /milk|cheese|yogurt|dairy|ice cream/.test(raw);
        const broadLegume = /legume|pea|chickpea|peanut/.test(allergy) && /bean|lentil|chickpea|pea|peanut|tofu|soy/.test(raw);
        if (raw.includes(allergy) || broadFish || broadDairy || broadLegume) {
          warnings.push({
            type: "food_allergy",
            riskLevel: "urgent",
            trigger: `Logged food may conflict with allergy: ${allergy}`,
            message: `The logged item "${food.raw}" may conflict with the user's recorded ${allergy} allergy.`,
            recommendedAction: "Do not recommend this item. Suggest an allergen-safe substitute and verify with the user before logging as safe.",
            source: "user_profile",
          });
        }
      }
    }

    // Environmental pollen warnings. Expects a normalized pollen object from pollenClient.
    const pollen = environmentalContext.pollen || environmentalContext;
    if (pollen && pollen.status === "ok" && pollen.byType) {
      const sensitivities = (this.profile.pollenSensitivities.length ? this.profile.pollenSensitivities : ["grass", "ragweed", "birch"])
        .map(x => String(x).toLowerCase().replace(/_pollen$/, ""));

      for (const sensitivity of sensitivities) {
        const entry = pollen.byType[sensitivity];
        if (!entry) continue;
        if (["moderate", "high", "very_high"].includes(entry.level)) {
          warnings.push({
            type: "pollen_allergy",
            riskLevel: entry.level,
            trigger: `${sensitivity} pollen ${entry.level}`,
            message: `${sensitivity} pollen is ${entry.level} in the local forecast with a peak of ${entry.peak} ${entry.units || "grains/m³"}.`,
            recommendedAction: entry.level === "very_high" || entry.level === "high"
              ? "Consider lower-exposure routines today: keep windows closed, shower/change clothes after outdoor activity, and discuss OTC antihistamine/nasal spray options with a clinician or pharmacist if symptoms are recurring."
              : "Monitor allergy symptoms and compare congestion, headache, sleep, and fatigue scores against pollen exposure.",
            source: pollen.source || "pollen_api",
          });
        }
      }
    } else if (pollen && pollen.status && pollen.status !== "missing_location") {
      warnings.push({
        type: "pollen_api_status",
        riskLevel: "unknown",
        trigger: "Pollen forecast unavailable",
        message: pollen.message || "Pollen API did not return usable forecast data.",
        recommendedAction: "Continue with food/symptom recommendations and retry pollen lookup later.",
        source: pollen.source || "pollen_api",
      });
    }

    if (!warnings.length) {
      warnings.push({
        type: "allergy_status",
        riskLevel: "none_detected",
        trigger: "No food or pollen allergy warning detected",
        message: "No allergy warning was generated from the current food log and environmental context.",
        recommendedAction: "Continue tracking symptoms against foods and local pollen exposure.",
        source: "augur_allergy_layer",
      });
    }

    return warnings;
  }

  _allergyEnvironmentGuidance(allergyWarnings = []) {
    const active = allergyWarnings.filter(w => !["none_detected", "unknown"].includes(w.riskLevel));
    if (!active.length) {
      return [{
        priority: "maintain",
        suggestion: "Track allergy symptoms alongside meals, sleep, and pollen exposure.",
        reasoning: "Environmental confounders can look like food-trigger signals unless they are logged separately.",
        confidence: "moderate",
      }];
    }

    return active.map(w => ({
      priority: w.riskLevel === "urgent" ? "hard_block" : "environmental_caution",
      suggestion: w.recommendedAction,
      reasoning: w.message,
      confidence: w.riskLevel === "urgent" ? "high" : "moderate",
      trigger: w.trigger,
    }));
  }

  _tier1Lifestyle(nutrients, symptoms) {
    const out = [];

    if ((symptoms.fatigue || 0) >= 6 || nutrients.added_sugar_g > 25) {
      out.push({
        priority: "high",
        suggestion: "Stabilize energy with earlier hydration and lower-sugar meals before mid-afternoon.",
        reasoning: nutrients.added_sugar_g > 25
          ? `Added sugar is elevated today (${nutrients.added_sugar_g}g), and the model links sugar load with same-day fatigue risk.`
          : "Fatigue is elevated, so start with low-risk routine changes before adding higher-risk interventions.",
        confidence: nutrients.added_sugar_g > 25 ? "moderate" : "low",
        expectedLagDays: 0,
      });
    }

    if ((symptoms.sleep_quality || 10) <= 4 || nutrients.caffeine_mg > 150 || nutrients.alcohol_units > 0) {
      out.push({
        priority: "moderate",
        suggestion: "Protect sleep consistency by moving caffeine earlier and avoiding alcohol close to bedtime.",
        reasoning: "Sleep quality is sensitive to stimulant timing, alcohol timing, and schedule drift.",
        confidence: "moderate",
        expectedLagDays: 1,
      });
    }

    if (nutrients.processed_score > 5 || nutrients.seed_oil_load > 5) {
      out.push({
        priority: "moderate",
        suggestion: "Add a 10 to 15 minute walk after the most processed meal of the day.",
        reasoning: "This is a low-risk adherence nudge that can reduce post-meal energy swings without asking the user to change everything at once.",
        confidence: "emerging",
        expectedLagDays: 0,
      });
    }

    if (out.length === 0) {
      out.push({
        priority: "maintain",
        suggestion: "Continue logging meals, symptoms, sleep, hydration, and activity to improve personalization.",
        reasoning: "More longitudinal data improves the model's ability to separate real user-specific patterns from noise.",
        confidence: "high",
      });
    }

    return out;
  }

  _tier2FoodSubstitutions(foods, nutrients, symptoms) {
    const categories = new Set(foods.map(f => f.nutrients.category).filter(Boolean));
    const out = [];

    if (categories.has("snack") || foods.some(f => /chips|crackers/.test(f.raw))) {
      out.push({
        replace: "chips or salty processed snacks",
        with: this._hasAllergy(/legume|chickpea|pea/) ? "air-popped popcorn with olive oil and seasoning" : "roasted chickpeas or air-popped popcorn",
        reasoning: "Keeps the crunchy/salty behavior while increasing fiber and lowering seed-oil load.",
        confidence: "moderate",
      });
    }

    if (categories.has("sugary_drink") || nutrients.added_sugar_g > 25) {
      out.push({
        replace: "soda or sweet drinks",
        with: "sparkling citrus water, unsweet tea, or a gradual caffeine taper",
        reasoning: "Targets added sugar while preserving the beverage ritual.",
        confidence: "high",
      });
    }

    if (categories.has("fried") || categories.has("fast_food") || nutrients.seed_oil_load > 5) {
      out.push({
        replace: "fried fast-food meal",
        with: this._hasAllergy(/fish|seafood|salmon/) ? "chicken or tofu rice bowl with vegetables" : "salmon rice bowl with vegetables",
        reasoning: "Raises protein, omega-3 potential, and fiber while lowering processed-score burden.",
        confidence: "moderate",
      });
    }

    if (nutrients.fiber_g < 5 && nutrients.n_items >= 3) {
      out.push({
        replace: "low-fiber side dish",
        with: "beans, lentils, oatmeal, berries, broccoli, or avocado",
        reasoning: "Fiber is low today and may affect satiety, gut regularity, and energy stability.",
        confidence: "high",
      });
    }

    if (out.length === 0) {
      out.push({
        replace: "next low-nutrient meal component",
        with: "one protein source plus one fiber-rich plant food",
        reasoning: "Keeps recommendations positive and easy to follow even when no major food risk is detected.",
        confidence: "low",
      });
    }

    return out;
  }

  _tier3SupplementConsiderations(nutrients, symptoms) {
    const out = [];
    const anticoagulant = this._hasMedication(/warfarin|coumadin|eliquis|xarelto|blood thin|aspirin|clopidogrel/);
    const sedative = this._hasMedication(/ambien|zolpidem|benzodiazepine|xanax|ativan|klonopin|sedative/);

    if (nutrients.omega3_epa_dha < 0.5 && nutrients.n_items >= 3 && !this._hasAllergy(/fish|seafood/)) {
      out.push({
        supplement: "Omega-3 fish oil or food-first fatty fish",
        status: anticoagulant ? "doctor_review_first" : "consider",
        reasoning: "Omega-3 intake is low today, and the prior links omega-3 exposure with better mood-related patterns.",
        evidenceTier: "moderate",
        interactionRisk: anticoagulant ? "elevated" : "low",
        physicianDiscussionRecommended: anticoagulant,
      });
    }

    if (((symptoms.sleep_quality || 10) <= 4 || (symptoms.fatigue || 0) >= 6) && nutrients.n_items >= 2) {
      out.push({
        supplement: "Magnesium glycinate",
        status: "consider",
        reasoning: "Sleep quality or fatigue is currently flagged. This should be framed as a conservative wellness discussion, not treatment.",
        evidenceTier: "moderate",
        interactionRisk: "low_to_moderate",
        physicianDiscussionRecommended: false,
      });
    }

    if (nutrients.fiber_g < 5 && nutrients.n_items >= 3) {
      out.push({
        supplement: "Psyllium husk or other fiber supplement",
        status: "consider_food_first",
        reasoning: "Fiber is chronically important and today's logged intake is low. Prefer food-first options, then consider OTC fiber if adherence is hard.",
        evidenceTier: "strong",
        interactionRisk: "low",
        physicianDiscussionRecommended: false,
      });
    }

    if ((symptoms.sleep_quality || 10) <= 3) {
      out.push({
        supplement: "Melatonin",
        status: sedative ? "doctor_review_first" : "caution_optional",
        reasoning: "Only consider for short-term sleep timing support. Avoid presenting it as a cure for insomnia.",
        evidenceTier: "moderate",
        interactionRisk: sedative ? "elevated" : "low_to_moderate",
        physicianDiscussionRecommended: sedative,
      });
    }

    if (out.length === 0) {
      out.push({
        supplement: "No supplement suggested from today's data",
        status: "not_needed",
        reasoning: "The current pattern is better handled with food, hydration, sleep, and logging first.",
        evidenceTier: "not_applicable",
        interactionRisk: "not_applicable",
        physicianDiscussionRecommended: false,
      });
    }

    return out;
  }

  _tier4EscalationFlags(symptoms, nutrients, flags, allergyWarnings = []) {
    const out = [];
    const severe = Object.entries(symptoms).filter(([, v]) => typeof v === "number" && v >= 8);

    for (const [name, value] of severe) {
      out.push({
        priority: "routine_followup",
        trigger: `High ${SYMPTOM_LABELS[name] || name} score`,
        reasoning: `Current ${name} is ${value}/10. If persistent, worsening, or unusual for the user, it should be discussed with a clinician.`,
        recommendedAction: "Bring the symptom trend and food log summary to a qualified clinician.",
      });
    }

    if ((symptoms.fatigue || 0) >= 7 && (symptoms.mood || 10) <= 3) {
      out.push({
        priority: "routine_followup",
        trigger: "Fatigue plus low mood pattern",
        reasoning: "The combination may deserve clinician review if it persists beyond short-term lifestyle causes.",
        recommendedAction: "Discuss sleep, mood, fatigue, medication, and lab-work context with a clinician.",
      });
    }

    if (nutrients.alcohol_units > 3) {
      out.push({
        priority: "monitor",
        trigger: "Elevated alcohol exposure",
        reasoning: "Alcohol may confound sleep, mood, fatigue, and inflammation signals.",
        recommendedAction: "Track alcohol timing and symptoms; seek clinical support if reduction is difficult.",
      });
    }

    const activeAllergy = allergyWarnings.filter(w => ["moderate", "high", "very_high", "urgent"].includes(w.riskLevel));
    for (const w of activeAllergy) {
      out.push({
        priority: w.riskLevel === "urgent" ? "urgent" : "monitor",
        trigger: w.trigger,
        reasoning: w.message,
        recommendedAction: w.recommendedAction,
      });
    }

    if (out.length === 0) {
      out.push({
        priority: "none_detected",
        trigger: "No escalation flag from current inputs",
        reasoning: "No high-severity pattern was detected in this single entry.",
        recommendedAction: "Continue tracking and escalate if symptoms become severe, persistent, or unusual.",
      });
    }

    return out;
  }

  _predictedInterventionImpact(predictions, nutrients) {
    const out = [];

    if (nutrients.fiber_g < 10) {
      out.push({
        intervention: "Increase fiber toward 25g/day using food-first options",
        predictedOutcome: "Improved satiety and reduced energy volatility",
        estimatedEffectSize: "moderate",
      });
    }

    if (nutrients.added_sugar_g > 25 || predictions.some(p => p.input === "sugar" && p.intakeLevel === "elevated")) {
      out.push({
        intervention: "Reduce added sugar and replace sweet drinks first",
        predictedOutcome: "Lower same-day fatigue risk and better energy stability",
        estimatedEffectSize: "high",
      });
    }

    if (nutrients.seed_oil_load > 5) {
      out.push({
        intervention: "Replace fried/seed-oil-heavy meals with grilled, baked, or bowl-style meals",
        predictedOutcome: "Lower inflammatory meal burden and potential joint-pain risk",
        estimatedEffectSize: "moderate",
      });
    }

    if (nutrients.omega3_epa_dha < 0.5 && nutrients.n_items >= 3) {
      out.push({
        intervention: "Add fatty fish or a clinician-reviewed omega-3 option",
        predictedOutcome: "Potential mood and recovery support over repeated exposure",
        estimatedEffectSize: "moderate",
      });
    }

    return out;
  }

  _doctorSummary(foods, nutrients, predictions, symptoms, flags, recommendations = {}, allergyWarnings = [], environmentalContext = {}) {
    const tier = this._dataTier();
    const recognized = foods.filter(f => f.recognized).map(f => f.matched);
    const unrecognized = foods.filter(f => !f.recognized).map(f => f.raw);

    const discussionPoints = [];

    // symptom-diet connections worth discussing
    for (const p of predictions) {
      if (p.direction === "aggravates" && p.intakeLevel === "elevated") {
        discussionPoints.push({
          priority: "discuss",
          point: `Patient's ${p.input.replace("_"," ")} intake is elevated. ` +
            `${p.effect.source === "validated_personal" ? "Their own data confirms" : "Population data suggests"} ` +
            `this ${p.prediction.toLowerCase()}`,
          evidence: `Effect size: r=${p.effect.estimate}, ` +
            `${p.effect.source === "population_prior" ? `seen in ${p.effect.populationPrevalence} of similar users` : `${Math.round(p.effect.weightPersonal*100)}% weighted to personal data`}.`,
          lagWindow: `Expected ${p.lagDays}-day lag before symptom change.`,
        });
      }
      if (p.direction === "relieves" && p.intakeLevel === "low") {
        discussionPoints.push({
          priority: "consider",
          point: `Patient has LOW intake of ${p.input.replace("_"," ")}, which ` +
            `${p.effect.source === "validated_personal" ? "their data shows" : "population data suggests"} ` +
            `helps reduce ${p.symptomLabel}.`,
          evidence: `Effect: r=${p.effect.estimate}. Consider dietary counseling or supplementation.`,
        });
      }
    }

    // medication interaction flags
    const medWarnings = [];
    const meds = this.profile.medications.map(m => m.toLowerCase());
    if (nutrients.curcumin > 0 && meds.some(m => /warfarin|coumadin|eliquis|blood thin/.test(m)))
      medWarnings.push("Turmeric/curcumin intake noted — may interact with anticoagulant medication.");
    if (nutrients.omega3_epa_dha > 2 && meds.some(m => /warfarin|coumadin|eliquis|aspirin/.test(m)))
      medWarnings.push("High omega-3 intake noted — may potentiate anticoagulant/antiplatelet effects.");

    return {
      patientDataTier: tier.label,
      dataTierNote: tier.note,
      reportDate: new Date().toISOString().slice(0, 10),
      daysOfData: this.profile.daysLogged,
      foodsRecognized: recognized,
      foodsUnrecognized: unrecognized,
      keyNutrients: {
        omega3_g: +nutrients.omega3_epa_dha.toFixed(1),
        added_sugar_g: nutrients.added_sugar_g,
        seed_oil_load: nutrients.seed_oil_load + "/10",
        fiber_g: +nutrients.fiber_g.toFixed(0),
        processed_score: nutrients.processed_score + "/10",
      },
      currentSymptoms: symptoms,
      discussionPoints,
      medicationWarnings: medWarnings,
      nutritionFlags: flags.map(f => f.message),
      allergyWarnings,
      environmentalContext,
      recommendations,
      disclaimer: "Generated by Augur (prototype). Correlational patterns, not causal claims. " +
        "Intended as a discussion aid for clinical encounters, not as medical advice.",
    };
  }
}

module.exports = { AugurPredictor };
