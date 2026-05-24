/**
 * server.js — prediction API endpoint
 * =====================================
 * A zero-dependency HTTP server (pure Node `http` module) that exposes the
 * prediction pipeline as a REST endpoint. No Express, no npm install needed.
 *
 * POST /predict
 *   body: { food: "salmon and rice", symptoms: { joint_pain: 6, mood: 3 }, userDaysLogged: 14 }
 *   returns: predictions + nutrition breakdown + tiered recommendations + doctor summary
 *
 * GET /prior
 *   returns: the loaded population prior (the "weights")
 *
 * GET /nutrition?food=burger+and+fries
 *   returns: parsed food → nutrient breakdown (useful for the app's food-log UI)
 *
 * Start: node server.js [port]
 * Default port: 3000
 */

const http = require("http");
const fs = require("fs");
const path = require("path");
const { AugurPredictor } = require("./predictor");
const { parseFoods, dailyNutrients } = require("./nutritionDB");
const { fetchPollenForecast } = require("./pollenClient");

// ── load the saved population prior ──────────────────────────────────────────
const PRIOR_PATH = path.join(__dirname, "..", "population_prior.json");
let savedPrior;
try {
  savedPrior = JSON.parse(fs.readFileSync(PRIOR_PATH, "utf8"));
  console.log(`Loaded population prior: ${savedPrior.n_relationships} relationships`);
} catch (e) {
  console.log("No population_prior.json found — using built-in default.");
  savedPrior = {
    model: "PopulationPrior (empirical-Bayes shrinkage)",
    n_relationships: 4,
    priors: [
      { input: "sugar", symptom: "fatigue", lag: 0, mu: 0.40, tau: 0.20, n_users: 60, prevalence: 0.85 },
      { input: "seed_oil", symptom: "joint_pain", lag: 2, mu: 0.35, tau: 0.17, n_users: 60, prevalence: 0.78 },
      { input: "omega3", symptom: "mood", lag: 2, mu: -0.31, tau: 0.18, n_users: 60, prevalence: 0.82 },
      { input: "turmeric", symptom: "joint_pain", lag: 4, mu: -0.17, tau: 0.14, n_users: 60, prevalence: 0.65 },
    ],
  };
}

// ── HTTP server ──────────────────────────────────────────────────────────────
function readBody(req) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => {
      try { resolve(JSON.parse(data)); } catch { resolve({}); }
    });
  });
}

function respond(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(JSON.stringify(body, null, 2));
}

const server = http.createServer(async (req, res) => {
  // CORS preflight
  if (req.method === "OPTIONS") { respond(res, 204, ""); return; }

  const url = new URL(req.url, `http://${req.headers.host}`);

  // ── POST /predict ──────────────────────────────────────────────────────────
  if (req.method === "POST" && url.pathname === "/predict") {
    const body = await readBody(req);
    const { food, symptoms, userDaysLogged, medications, allergies, conditions,
            pollenSensitivities, latitude, longitude, forecastDays, pollenForecast,
            personalEstimates, personalSignals } = body;

    if (!food) {
      respond(res, 400, { error: "Missing 'food' field (what the user ate)." });
      return;
    }

    const predictor = new AugurPredictor(savedPrior, {
      medications: medications || [],
      allergies: allergies || [],
      pollenSensitivities: pollenSensitivities || [],
      conditions: conditions || [],
      daysLogged: userDaysLogged || 0,
    }, personalSignals || []);

    const pollen = pollenForecast || (latitude != null && longitude != null
      ? await fetchPollenForecast({ latitude, longitude, forecastDays: forecastDays || 3 })
      : { status: "missing_location", message: "No latitude/longitude supplied; pollen warning layer skipped." });

    const result = predictor.predict(
      food,
      symptoms || {},
      personalEstimates || {},
      { pollen },
    );
    respond(res, 200, result);
    return;
  }

  // ── GET /prior ─────────────────────────────────────────────────────────────
  if (req.method === "GET" && url.pathname === "/prior") {
    respond(res, 200, savedPrior);
    return;
  }

  // ── GET /nutrition?food=... ────────────────────────────────────────────────
  if (req.method === "GET" && url.pathname === "/nutrition") {
    const foodText = url.searchParams.get("food");
    if (!foodText) {
      respond(res, 400, { error: "Missing ?food= query parameter." });
      return;
    }
    const foods = parseFoods(foodText);
    const totals = dailyNutrients(foods);
    respond(res, 200, { foods, dailyTotals: totals });
    return;
  }

  // ── GET / (health check + docs) ────────────────────────────────────────────
  if (req.method === "GET" && url.pathname === "/") {
    respond(res, 200, {
      service: "Augur Prediction API",
      status: "ok",
      prior_loaded: savedPrior.n_relationships + " relationships",
      endpoints: {
        "POST /predict": "food + symptoms + optional latitude/longitude → predictions + tiered recommendations + allergy warnings + doctor summary",
        "GET /nutrition?food=...": "food text → nutrient breakdown",
        "GET /prior": "view the loaded population prior",
      },
      example: {
        method: "POST",
        url: "/predict",
        body: {
          food: "burger and fries, soda",
          symptoms: { joint_pain: 6, mood: 3, fatigue: 7 },
          userDaysLogged: 14,
          medications: ["Warfarin"],
          allergies: ["fish"],
          pollenSensitivities: ["grass", "ragweed"],
          latitude: 29.7604,
          longitude: -95.3698,
        },
      },
    });
    return;
  }

  respond(res, 404, { error: "Not found. GET / for docs." });
});

// ── start ────────────────────────────────────────────────────────────────────
const PORT = parseInt(process.argv[2]) || 3000;
server.listen(PORT, () => {
  console.log(`Augur prediction API running on http://localhost:${PORT}`);
  console.log(`  POST /predict      food + symptoms → predictions + recommendations + doctor summary`);
  console.log(`  GET  /nutrition     food → nutrient breakdown`);
  console.log(`  GET  /prior         view population prior`);
});

module.exports = { server };  // for testing
