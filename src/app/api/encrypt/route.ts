import { NextRequest, NextResponse } from "next/server";
import { encryptSSN, extractLastFour } from "@/lib/crypto";

export async function POST(request: NextRequest) {
  try {
    const { ssn } = await request.json();

    if (!ssn || typeof ssn !== "string") {
      return NextResponse.json({ error: "SSN is required" }, { status: 400 });
    }

    const cleaned = ssn.replace(/-/g, "");
    if (!/^\d{9}$/.test(cleaned)) {
      return NextResponse.json({ error: "Invalid SSN format" }, { status: 400 });
    }

    const encrypted = await encryptSSN(ssn);
    const lastFour = extractLastFour(ssn);

    return NextResponse.json({ encrypted, lastFour });
  } catch (error) {
    console.error("Encryption error:", error);
    return NextResponse.json(
      { error: "Failed to encrypt SSN" },
      { status: 500 }
    );
  }
}
