# Augur Predict: Tiered Recommendation Implementation

Implemented positive recommendation output in addition to bad-food detection.

## Added output fields

`POST /predict` now returns:

- `recommendations.tier1_lifestyle_suggestions`
- `recommendations.tier2_food_substitutions`
- `recommendations.tier3_otc_supplement_considerations`
- `recommendations.tier4_physician_escalation_flags`
- `recommendations.predictedInterventionImpact`

The same recommendation object is also embedded in `doctorSummary.recommendations` so the frontend can consume either the full product response or clinician-facing report.

## Safety behavior

- Supplement suggestions are conservative and framed as considerations, not treatment.
- Medication checks flag anticoagulants and sedatives where relevant.
- Allergy checks alter food suggestions, such as avoiding fish or chickpea recommendations.
- Escalation flags recommend clinician discussion for severe or combined symptom patterns.

## How to run

```bash
node demo.js
node src/server.js 3000
```

Example API call:

```bash
curl -X POST http://localhost:3000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "food": "fried chicken, fries, soda",
    "symptoms": {"joint_pain": 7, "mood": 2, "fatigue": 8, "sleep_quality": 3},
    "userDaysLogged": 45,
    "medications": ["Metformin"],
    "allergies": []
  }'
```

## Allergy Warning Layer + Pollen API

Added an optional allergy/environment warning layer.

### New files

- `src/pollenClient.js`
  - Calls the Open-Meteo Air Quality API when `latitude` and `longitude` are supplied.
  - Requests: `alder_pollen`, `birch_pollen`, `grass_pollen`, `mugwort_pollen`, `olive_pollen`, `ragweed_pollen`.
  - Normalizes pollen into: `dominantPollen`, `overallLevel`, and `byType`.
  - Fails safely with `missing_location`, `api_error`, or `network_error` instead of crashing prediction.

### New request fields for `POST /predict`

```json
{
  "food": "salmon rice bowl and soda",
  "symptoms": { "fatigue": 6, "sleep_quality": 4, "congestion": 7 },
  "userDaysLogged": 30,
  "allergies": ["fish"],
  "pollenSensitivities": ["grass", "ragweed"],
  "latitude": 29.7604,
  "longitude": -95.3698
}
```

You can also inject a mocked or cached pollen forecast instead of calling the API:

```json
{
  "pollenForecast": {
    "status": "ok",
    "source": "open-meteo-air-quality",
    "byType": {
      "grass": { "units": "grains/m³", "average": 42, "peak": 72, "level": "high" }
    }
  }
}
```

### New response fields

- `allergyWarnings`
  - Food allergy hard-block warnings.
  - Pollen warnings based on user pollen sensitivities.
- `environmentalContext`
  - The normalized pollen forecast or fallback status.
- `recommendations.allergy_environment_guidance`
  - User-facing allergy guidance.
- `doctorSummary.allergyWarnings`
  - Clinician-ready allergy/environment warning summary.

### Safety behavior

- Food allergy conflicts are treated as `urgent` hard blocks.
- Pollen warnings are framed as environmental risk guidance, not diagnosis.
- OTC allergy medication is only suggested as a clinician/pharmacist discussion, not an autonomous medical instruction.
