import { NextRequest, NextResponse } from "next/server";
import nutritionModule from "@/lib/augur/nutritionDB.js";

const { parseFoods, dailyNutrients } = nutritionModule as {
  parseFoods: (food: string) => unknown[];
  dailyNutrients: (foods: unknown[]) => unknown;
};

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const food = searchParams.get("food");

  if (!food) {
    return NextResponse.json(
      { error: "Missing ?food= query parameter" },
      { status: 400 },
    );
  }

  const foods = parseFoods(food);
  return NextResponse.json({ foods, dailyTotals: dailyNutrients(foods) });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const food = String(body?.query ?? body?.food ?? "").trim();

    if (!food) {
      return NextResponse.json(
        { error: "Missing required field: query or food" },
        { status: 400 },
      );
    }

    const foods = parseFoods(food);
    return NextResponse.json({
      foods,
      dailyTotals: dailyNutrients(foods),
      safety: {
        allergiesChecked: Array.isArray(body?.allergies) ? body.allergies : [],
        medicationsChecked: Array.isArray(body?.medications) ? body.medications : [],
        warning:
          "This is decision support only. Escalate to a clinician for medication interactions, allergy risk, pregnancy, pediatrics, severe symptoms, or persistent worsening.",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Nutrition lookup failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
