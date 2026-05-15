import { NextResponse } from "next/server";
import { getStockAnalysis } from "@/lib/yahoo";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ symbol: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { symbol } = await context.params;
    const analysis = await getStockAnalysis(symbol);
    return NextResponse.json(analysis, {
      headers: {
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to fetch stock data" },
      { status: 502 }
    );
  }
}
