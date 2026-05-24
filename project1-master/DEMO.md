# Halo — Hackathon Demo Brief

Post-discharge recovery companion. Doctors assign homework, patients do it on
their phone, AI fills in the gaps (local groups, products, meals) so patients
actually stick to the plan. Think Headspace x Expedia x ambient AI for
recovery.

---

## The 2-minute demo flow

> Doctor looks at vitals → doctor gives homework → patient sees homework →
> patient does homework + submits → doctor sees homework.

Plus a self-contained extension: patient taps **Ask Halo AI** → gets
personalized groups / products / meal ideas matched to their care plan.

### Storyboard (timing in seconds)

| Time | Screen | Action |
|------|--------|--------|
| 0:00–0:15 | Desktop · `/recipients/[id]` | Doctor opens patient chart. Points at vitals + clinical context. |
| 0:15–0:35 | Same | Clicks gold **Assign homework** button → form (kind + title + notes) → **Send to patient**. |
| 0:35–0:55 | iPhone · `/dashboard` (Today) | Patient refreshes. New task appears in *Today's recovery tasks*. Tap. |
| 0:55–1:25 | iPhone · `/check-in?taskId=…` | Patient walks through 4-step check-in (photo, pain, meds, mood, notes) → Submit. |
| 1:25–1:40 | Desktop · `/recipients/[id]` | Doctor refreshes. **Homework panel** shows ✅ with pain badge + note quote + photo-attached pill. |
| 1:40–2:00 | iPhone · `/plan` → `/ai` | Patient taps **Ask Halo AI** → types *"find me a walking group"* → AI streams a NearbyPlaces card with PT clinic + walking group + warm pool nearby. |

---

## What's wired end-to-end

| Piece | Notes |
|---|---|
| Privy auth + role pick | Mobile-clean. `NEXT_PUBLIC_DEMO_MODE=1` enables the demo role chooser. |
| `PatientTask` model | New Prisma model. `db push` against Railway. |
| `assignHomework` server action | Creates `PatientTask`, also broadcasts a chat message into the doctor↔patient thread. |
| `submitTaskCompletion` server action | Stamps `completedAt`, records pain / note / photo, drops a completion notice in the thread. |
| Doctor "Assign homework" + Homework panel | On `/recipients/[id]`. Caregiver-only. Lists assigned tasks with pending/done status + submission previews. |
| Patient Today screen | Pulls real `PatientTask` rows. Completed tasks strike through. Tap → `/check-in?taskId=…`. |
| Mobile Messages inbox (`/messages`) | Real thread list, last-message preview, opens existing chat thread UI. |
| AI chat (`/ai`) | Scripted: keyword triggers stream `NearbyPlaces` / `RecoveryShop` / `MealPlan` Tambo cards with a typing-dot pause. |
| 5-tab bottom nav | Today · Progress · Plan · Messages · Profile, with sliding green pill highlight. |

## What's intentionally mocked

These are seed/static so the demo never fails on flaky data or APIs. Honest
disclosure if asked:

- **Wearable snapshot** (72 bpm / 7h 45m / 4280 steps / 96% SpO₂)
- **Progress charts** — 7-day recovery / steps / pain series
- **Profile recovery info** — surgery date, procedure
- **AI chat responses** — keyword-matched, not a live agent (Tambo registry
  is in place; flip `NEXT_PUBLIC_TAMBO_API_KEY` on for live)
- **Doctor patient chart vitals + labs + meds** — desktop demo data

---

## Architecture quick hit (for judges)

- **Next.js 16** (App Router, Turbopack, RSC + server actions)
- **Prisma + Postgres** on Railway
- **Privy** for passwordless auth (email/SMS)
- **Tambo** generative-UI registry (`PatientTask`, `NearbyPlaces`,
  `RecoveryShop`, `MealPlan`, `ActivityPlan`, `MedicationReminder`,
  `CareTeamUpdate`, `Milestone`) — agent picks which card to render per
  patient context
- **HIPAA audit log** on every PHI read/write (`AuditLog` model) —
  `patient_task.assigned`, `patient_task.completed` are first-class events
- **Mobile-first** with a separate desktop shell for the clinical side
- **i18n-ready** — locale rotation already wired across landing copy

---

## Running it locally

```bash
npm install                # one-time
npx prisma db push         # syncs schema to Railway (no shadow DB on free tier)
npx prisma generate        # regenerate client after schema changes
npm run dev                # localhost:3000
```

`.env.local` must include:

```
NEXT_PUBLIC_DEMO_MODE=1
DATABASE_URL=…             # Railway Postgres
NEXT_PUBLIC_PRIVY_APP_ID=…
PRIVY_APP_SECRET=…
OPENAI_API_KEY=…           # only needed for translation features
# Optional:
# NEXT_PUBLIC_TAMBO_API_KEY=…  # swaps stub to live agent
```

After any schema change: `npx prisma db push && npx prisma generate`, then
**restart the dev server** — Turbopack caches the old Prisma client.

---

## Demo-day prereq: care team membership

For the patient to see homework, the patient `User` must have a `Membership`
to the same `CareRecipient` as the assigning doctor. Two paths:

1. **UI:** Doctor signs in → "Add patient" → enter patient email → patient
   uses the invite link in their email → signs up via Privy → membership
   created automatically.
2. **SQL fast-path** (if invite flow flakes during demo): insert a row into
   `Membership` joining the patient `User.id` with an existing
   `CareRecipient.id` that the doctor is on.

---

## Pitch line

> Your doctor sends you homework. You do it. Halo AI keeps you company in
> between — finding the walking group, the protein powder, the rehab clinic
> that fits your plan. Recovery you actually stick to.
