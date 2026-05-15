import { NextResponse } from "next/server";
import { getMarketSnapshot } from "@/lib/yahoo";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbols = searchParams.get("symbols") ?? "AAPL,NVDA,TSLA,MSFT,AMD,META,PLTR";
    return NextResponse.json(await getMarketSnapshot(symbols), {
      headers: { "Cache-Control": "no-store" }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to fetch market snapshot" },
      { status: 502 }
    );
  }
}
