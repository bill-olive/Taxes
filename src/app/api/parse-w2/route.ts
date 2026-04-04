import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const PARSE_PROMPT = `You are a tax document parser. Extract ALL W-2 form data from the provided document.
Return ONLY valid JSON with this exact structure (use 0 for numeric fields you cannot read, "" for text fields you cannot read):
{
  "employerName": "string",
  "employerEIN": "string (format: XX-XXXXXXX)",
  "employerAddress": "string (full address from Box c)",
  "wages": number,
  "federalWithheld": number,
  "socialSecurityWages": number,
  "socialSecurityWithheld": number,
  "medicareWages": number,
  "medicareWithheld": number,
  "socialSecurityTips": number,
  "allocatedTips": number,
  "dependentCareBenefits": number,
  "nonqualifiedPlans": number,
  "box12": [{"code": "string", "amount": number}],
  "isStatutoryEmployee": boolean,
  "retirementPlan": boolean,
  "thirdPartySickPay": boolean,
  "box14Other": "string",
  "state": "string (2-letter state code)",
  "stateWages": number,
  "stateWithheld": number,
  "localWages": number,
  "localWithheld": number,
  "localityName": "string"
}

Field mapping from W-2 boxes:
- employerName: Box c (Employer's name)
- employerEIN: Box b (Employer identification number)
- employerAddress: Box c (Employer's address, below name)
- wages: Box 1 (Wages, tips, other compensation)
- federalWithheld: Box 2 (Federal income tax withheld)
- socialSecurityWages: Box 3 (Social security wages)
- socialSecurityWithheld: Box 4 (Social security tax withheld)
- medicareWages: Box 5 (Medicare wages and tips)
- medicareWithheld: Box 6 (Medicare tax withheld)
- socialSecurityTips: Box 7 (Social security tips)
- allocatedTips: Box 8 (Allocated tips)
- dependentCareBenefits: Box 10 (Dependent care benefits)
- nonqualifiedPlans: Box 11 (Nonqualified plans)
- box12: Box 12a-12d (codes like DD, W, C, etc. with amounts)
- isStatutoryEmployee: Box 13 checkbox
- retirementPlan: Box 13 checkbox
- thirdPartySickPay: Box 13 checkbox
- box14Other: Box 14 (Other - free text)
- state: Box 15 (State abbreviation)
- stateWages: Box 16 (State wages, tips, etc.)
- stateWithheld: Box 17 (State income tax)
- localWages: Box 18 (Local wages, tips, etc.)
- localWithheld: Box 19 (Local income tax)
- localityName: Box 20 (Locality name)

Be precise with numbers. Do not include dollar signs or commas in numeric values. For box12, include ALL entries you can read (12a through 12d).`;

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables." },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    const openai = new OpenAI({ apiKey });
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

    let content: string | null;

    if (isPdf) {
      // For PDFs: upload as a file to OpenAI, then reference it
      const uploaded = await openai.files.create({
        file,
        purpose: "assistants",
      });

      const response = await openai.chat.completions.create({
        model: "o3",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: PARSE_PROMPT + "\n\nParse this W-2 document and return only the JSON object." },
              {
                type: "file",
                file: { file_id: uploaded.id },
              } as never,
            ],
          },
        ],
      });

      content = response.choices[0]?.message?.content ?? null;

      // Clean up uploaded file
      await openai.files.delete(uploaded.id).catch(() => {});
    } else {
      // For images: use base64 inline
      const bytes = await file.arrayBuffer();
      const base64 = Buffer.from(bytes).toString("base64");
      const mimeType = file.type || "image/jpeg";

      const response = await openai.chat.completions.create({
        model: "o3",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: PARSE_PROMPT + "\n\nParse this W-2 form and return only the JSON object." },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64}`,
                },
              },
            ],
          },
        ],
      });

      content = response.choices[0]?.message?.content ?? null;
    }

    if (!content) {
      return NextResponse.json(
        { error: "No response from AI model" },
        { status: 500 }
      );
    }

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Could not parse AI response" },
        { status: 500 }
      );
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Normalize box12 entries
    const box12 = Array.isArray(parsed.box12)
      ? parsed.box12
          .filter((e: { code?: string }) => e && e.code)
          .map((e: { code: string; amount: unknown }) => ({
            code: String(e.code),
            amount: Number(e.amount) || 0,
          }))
      : [];

    return NextResponse.json({
      success: true,
      data: {
        employerName: String(parsed.employerName || ""),
        employerEIN: String(parsed.employerEIN || ""),
        employerAddress: String(parsed.employerAddress || ""),
        wages: Number(parsed.wages) || 0,
        federalWithheld: Number(parsed.federalWithheld) || 0,
        socialSecurityWages: Number(parsed.socialSecurityWages) || 0,
        socialSecurityWithheld: Number(parsed.socialSecurityWithheld) || 0,
        medicareWages: Number(parsed.medicareWages) || 0,
        medicareWithheld: Number(parsed.medicareWithheld) || 0,
        socialSecurityTips: Number(parsed.socialSecurityTips) || 0,
        allocatedTips: Number(parsed.allocatedTips) || 0,
        dependentCareBenefits: Number(parsed.dependentCareBenefits) || 0,
        nonqualifiedPlans: Number(parsed.nonqualifiedPlans) || 0,
        box12,
        isStatutoryEmployee: Boolean(parsed.isStatutoryEmployee),
        retirementPlan: Boolean(parsed.retirementPlan),
        thirdPartySickPay: Boolean(parsed.thirdPartySickPay),
        box14Other: String(parsed.box14Other || ""),
        state: String(parsed.state || ""),
        stateWages: Number(parsed.stateWages) || 0,
        stateWithheld: Number(parsed.stateWithheld) || 0,
        localWages: Number(parsed.localWages) || 0,
        localWithheld: Number(parsed.localWithheld) || 0,
        localityName: String(parsed.localityName || ""),
      },
    });
  } catch (error) {
    console.error("W-2 parse error:", error);
    const message = error instanceof Error ? error.message : "Failed to parse W-2";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
