# Tambo AI implementation

This project now has a complete Tambo integration path rather than only a dependency and card registry.

## What is wired

- `src/lib/tambo.tsx`
  - Central `HaloTamboProvider`
  - Registers the existing Halo care-plan cards as Tambo generative UI components
  - Registers Augur tools for prediction, nutrition/safety lookup, and population priors
  - Uses `TamboProvider` only when `NEXT_PUBLIC_TAMBO_API_KEY` is present **and** the patient turns on the Tambo UI toggle
  - Uses `TamboStubProvider` by default so the app starts in local demo mode

- `src/components/patient/care-plan/screen.tsx`
  - Care plan now uses the shared `HaloTamboProvider`

- `src/components/patient/ai-chat.tsx`
  - `/ai` now includes a Tambo toggle in the header
  - The toggle defaults off and persists in `localStorage` under `halo:tambo-enabled`
  - Live Tambo chat only starts when the key exists and the toggle is on
  - Scripted local demo remains the default mode
  - Live mode renders Tambo text messages and streamed `renderedComponent` UI cards

- API compatibility
  - `POST /api/augur/nutrition` added for Tambo tool calls
  - `POST /api/augur/prior` added for Tambo tool calls
  - `POST /api/augur/predict` already existed and is now registered as a Tambo tool

## Environment variable

Add this to `.env.local` to make live Tambo mode available from the UI toggle:

```bash
NEXT_PUBLIC_TAMBO_API_KEY=your_tambo_key_here
```

Without that variable, the app intentionally falls back to local demo mode. With the variable, local demo mode is still the default until the user turns Tambo on.

## Current safety behavior

The Augur tool descriptions instruct the agent to escalate to a physician for allergy, medication-interaction, red-flag, pregnancy, pediatric, or worsening-symptom cases. The recommendation UX should remain decision support, not diagnosis or treatment.
