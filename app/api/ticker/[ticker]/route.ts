import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";


export async function GET(
  request: Request,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;

  if (!ticker || ticker.length > 20) {
    return NextResponse.json(
      { error: "Ticker required (max 20 chars)" },
      { status: 400 }
    );
  }

  try {
    const db = await getDb();
    const docs = await db
      .collection("prices_adjusted")
      .find({ Ticker: ticker.toUpperCase() }) // metaField filter
      .project({ _id: 0 }) // drop Mongo's internal _id
      .sort({ Date: 1 }) // timeField, oldest first
      .limit(5000) // safety cap
      .toArray();

    if (docs.length === 0) {
      return NextResponse.json(
        { error: `No data for ticker ${ticker}` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ticker: ticker.toUpperCase(),
      count: docs.length,
      first: docs[0].Date,
      last: docs[docs.length - 1].Date,
      data: docs,
    });
  } catch (err) {
    console.error("Query failed:", err);
    return NextResponse.json(
      { error: "Database query failed" },
      { status: 500 }
    );
  }
}
