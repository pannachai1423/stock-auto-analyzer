import { NextResponse } from "next/server";
import { getRankings } from "@/lib/yahoo";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await getRankings(), {
      headers: {
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to fetch ranking data" },
      { status: 502 }
    );
  }
}
