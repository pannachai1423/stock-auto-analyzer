import { NextResponse } from "next/server";
import { getNewsSentiment } from "@/lib/yahoo";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ symbol: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { symbol } = await context.params;
    return NextResponse.json(await getNewsSentiment(symbol), {
      headers: { "Cache-Control": "no-store" }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to fetch news" },
      { status: 502 }
    );
  }
}
