# Patient status patch — drop-in files

Every file here is ready to overwrite. No editing required.

## Files

- `prisma/schema.prisma` — adds `status` field to CareRecipient
- `src/lib/recipient-status.ts` — status definitions and side-effect map
- `src/components/status-pill.tsx` — pill chip
- `src/components/status-picker.tsx` — nurse-only dropdown
- `src/app/actions.ts` — full file with new `changeRecipientStatus` and updated `createCareReport`
- `src/app/(app)/recipients/[id]/page.tsx` — patient chart with pill, picker, lock banner
- `src/app/(app)/recipients/page.tsx` — patient list with status pill on cards, hides discharged for family

## Apply

1. Drop these files into your repo, overwriting the existing ones with the same paths. The two new files (`recipient-status.ts`, `status-pill.tsx`, `status-picker.tsx`) just get added.
2. Push the schema change:
   ```
   npx prisma db push
   npx prisma generate
   ```
3. Commit and push your branch. Railway will redeploy.

## What each status does

- **Stable** → posts a system message in the chat
- **Monitoring** → posts a message + AI generates a daily check-in schedule (added as a Resource on the chart)
- **Critical** → posts a message + sends an extra `[APS notice]` to APS members
- **Discharged** → posts a message + hides the patient from family lists + AI generates a discharge care plan
- **Deceased** → posts a message + locks the chart (no new reports) + AI generates a bereavement support note

If `OPENAI_API_KEY` is set, the AI runs for real. Otherwise each AI helper falls back to a clearly-labeled "AI draft" template so the demo still works.

## Demo flow

1. As **caregiver** Sofia, open Monkey D. Luffy's chart.
2. Click the new pill dropdown next to "Open chat" → pick **Discharged** → confirm.
3. Page refreshes — see a "Discharge care plan (AI draft)" Resource in the reports list.
4. Open Messages → the family thread has a new `[Status update]` line.
5. Switch to **family** role for that patient — patient is gone from the recipients list (hidden).
6. As Sofia, change Luffy's status to **Deceased** — chart shows lock banner, "Add report" form disappears, bereavement note appears in reports.

## Halo Augur Wellness Module

This build includes the Augur prediction engine from `augur-combined-final(1).zip` as an integrated Next.js module.

### New routes

- `/wellness` — interactive UI for meal/symptom prediction, tiered recommendations, allergy warnings, medication cautions, and pollen sensitivity checks.
- `POST /api/augur/predict` — prediction endpoint.
- `GET /api/augur/nutrition?food=...` — food parsing and nutrient summary.
- `GET /api/augur/prior` — bundled population prior.

### Example prediction request

```bash
curl -X POST http://localhost:3000/api/augur/predict \
  -H "Content-Type: application/json" \
  -d '{
    "food":"burger and fries, soda",
    "symptoms":{"joint_pain":6,"fatigue":7,"mood":3},
    "userDaysLogged":14,
    "medications":["warfarin"],
    "allergies":["fish"],
    "conditions":["hypertension"],
    "pollenSensitivities":["grass","ragweed"]
  }'
```

The module is wellness-support software, not a diagnostic or prescribing system. Physician escalation is preserved for high-risk cases.
