import { NextRequest, NextResponse } from "next/server";
import { calculateTaxes, taxReturnToInput } from "@/lib/tax/engine";
import type { TaxReturn } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const taxReturn: TaxReturn = await request.json();

    if (!taxReturn.w2s || taxReturn.w2s.length === 0) {
      return NextResponse.json(
        { error: "At least one W-2 is required to calculate taxes" },
        { status: 400 }
      );
    }

    const input = taxReturnToInput(taxReturn);
    const stateCode = taxReturn.residency?.state || "GA";
    const result = calculateTaxes(input, stateCode);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Tax calculation error:", error);
    return NextResponse.json(
      { error: "Failed to calculate taxes" },
      { status: 500 }
    );
  }
}
