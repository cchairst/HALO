/**
 * pollenClient.js — optional pollen API adapter
 * ==============================================
 * Uses the Open-Meteo Air Quality API when latitude/longitude are provided.
 * Open-Meteo supports pollen variables such as alder, birch, grass, mugwort,
 * olive, and ragweed and does not require an API key for non-commercial use.
 *
 * This module is intentionally optional: if the API is unavailable, the main
 * predictor still works and returns a clear unavailable status instead of
 * crashing the app.
 */

const DEFAULT_POLLEN_VARIABLES = [
  "alder_pollen",
  "birch_pollen",
  "grass_pollen",
  "mugwort_pollen",
  "olive_pollen",
  "ragweed_pollen",
];

function average(nums) {
  const valid = nums.filter(v => typeof v === "number" && Number.isFinite(v));
  if (!valid.length) return null;
  return +(valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(2);
}

function max(nums) {
  const valid = nums.filter(v => typeof v === "number" && Number.isFinite(v));
  if (!valid.length) return null;
  return +Math.max(...valid).toFixed(2);
}

function pollenLevel(value) {
  if (value == null) return "unknown";
  // Conservative proof-of-concept buckets. In production, calibrate by region,
  // source, pollen type, and clinical/allergy specialist guidance.
  if (value >= 100) return "very_high";
  if (value >= 50) return "high";
  if (value >= 20) return "moderate";
  if (value > 0) return "low";
  return "none_detected";
}

function normalizeOpenMeteoPollen(payload) {
  const hourly = payload && payload.hourly ? payload.hourly : {};
  const byType = {};

  for (const variable of DEFAULT_POLLEN_VARIABLES) {
    const values = Array.isArray(hourly[variable]) ? hourly[variable] : [];
    const avg = average(values);
    const peak = max(values);
    byType[variable.replace("_pollen", "")] = {
      units: payload && payload.hourly_units ? payload.hourly_units[variable] || "grains/m³" : "grains/m³",
      average: avg,
      peak,
      level: pollenLevel(peak),
    };
  }

  const peakEntries = Object.entries(byType)
    .filter(([, v]) => v.peak != null)
    .sort((a, b) => b[1].peak - a[1].peak);

  return {
    source: "open-meteo-air-quality",
    latitude: payload.latitude,
    longitude: payload.longitude,
    timezone: payload.timezone,
    fetchedAt: new Date().toISOString(),
    forecastDays: payload.hourly && payload.hourly.time ? Math.ceil(payload.hourly.time.length / 24) : null,
    dominantPollen: peakEntries.length ? peakEntries[0][0] : null,
    overallLevel: peakEntries.length ? pollenLevel(peakEntries[0][1].peak) : "unknown",
    byType,
  };
}

async function fetchPollenForecast({ latitude, longitude, forecastDays = 3, timezone = "auto" }) {
  if (latitude == null || longitude == null) {
    return { status: "missing_location", message: "latitude and longitude are required for pollen forecast lookup." };
  }

  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    hourly: DEFAULT_POLLEN_VARIABLES.join(","),
    forecast_days: String(forecastDays),
    timezone,
  });

  const url = `https://air-quality-api.open-meteo.com/v1/air-quality?${params.toString()}`;

  try {
    const res = await fetch(url, { headers: { "Accept": "application/json" } });
    if (!res.ok) {
      return { status: "api_error", source: "open-meteo-air-quality", statusCode: res.status, message: `Pollen API returned HTTP ${res.status}.` };
    }
    const payload = await res.json();
    return { status: "ok", ...normalizeOpenMeteoPollen(payload) };
  } catch (err) {
    return { status: "network_error", source: "open-meteo-air-quality", message: err.message };
  }
}

module.exports = {
  fetchPollenForecast,
  normalizeOpenMeteoPollen,
  pollenLevel,
  DEFAULT_POLLEN_VARIABLES,
};
