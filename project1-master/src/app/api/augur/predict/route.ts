import { NextRequest, NextResponse } from "next/server";
import predictorModule from "@/lib/augur/predictor.js";
import pollenModule from "@/lib/augur/pollenClient.js";
import prior from "@/lib/augur/population_prior.json";

const { AugurPredictor } = predictorModule as { AugurPredictor: new (...args: unknown[]) => { predict: (...args: unknown[]) => unknown } };
const { fetchPollenForecast } = pollenModule as { fetchPollenForecast: (args: { latitude: number; longitude: number; forecastDays: number }) => Promise<unknown> };

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      food,
      symptoms,
      userDaysLogged,
      medications,
      allergies,
      conditions,
      pollenSensitivities,
      latitude,
      longitude,
      forecastDays,
      pollenForecast,
      personalEstimates,
      personalSignals,
    } = body ?? {};

    if (!food || typeof food !== "string") {
      return NextResponse.json(
        { error: "Missing required string field: food" },
        { status: 400 },
      );
    }

    const predictor = new AugurPredictor(
      prior,
      {
        medications: Array.isArray(medications) ? medications : [],
        allergies: Array.isArray(allergies) ? allergies : [],
        pollenSensitivities: Array.isArray(pollenSensitivities)
          ? pollenSensitivities
          : [],
        conditions: Array.isArray(conditions) ? conditions : [],
        daysLogged: Number(userDaysLogged || 0),
      },
      Array.isArray(personalSignals) ? personalSignals : [],
    );

    const pollen =
      pollenForecast ||
      (latitude != null && longitude != null
        ? await fetchPollenForecast({
            latitude: Number(latitude),
            longitude: Number(longitude),
            forecastDays: Number(forecastDays || 3),
          })
        : {
            status: "missing_location",
            message:
              "No latitude/longitude supplied; pollen warning layer skipped.",
          });

    const result = predictor.predict(
      food,
      symptoms || {},
      personalEstimates || {},
      { pollen },
    );

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Prediction failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
