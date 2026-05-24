import { NextResponse } from "next/server";
import prior from "@/lib/augur/population_prior.json";

export async function GET() {
  return NextResponse.json(prior);
}

export async function POST() {
  return NextResponse.json(prior);
}
