import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;

  if (!ticker || ticker.length > 20) {
    return NextResponse.json(
      { error: "Ticker required (max 20 chars)" },
      { status: 400, headers: CORS }
    );
  }

  try {
    const db = await getDb();
    const docs = await db
      .collection("prices_adjusted")
      .find({ Ticker: ticker.toUpperCase() })
      .project({ _id: 0 })
      .sort({ Date: 1 })
      .limit(5000)
      .toArray();

    if (docs.length === 0) {
      return NextResponse.json(
        { error: `No data for ticker ${ticker}` },
        { status: 404, headers: CORS }
      );
    }

    return NextResponse.json(
      {
        ticker: ticker.toUpperCase(),
        count: docs.length,
        first: docs[0].Date,
        last: docs[docs.length - 1].Date,
        data: docs,
      },
      { headers: CORS }
    );
  } catch (err) {
    console.error("Query failed:", err);
    return NextResponse.json(
      { error: "Database query failed" },
      { status: 500, headers: CORS }
    );
  }
}
