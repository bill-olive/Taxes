import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const SYSTEM_PROMPT = `You are a tax document parser. Extract W-2 form data from the provided image.
Return ONLY valid JSON with this exact structure (use 0 for any field you cannot read):
{
  "employerName": "string",
  "employerEIN": "string (format: XX-XXXXXXX)",
  "wages": number,
  "federalWithheld": number,
  "stateWages": number,
  "stateWithheld": number,
  "state": "string (2-letter state code)"
}

Field mapping from W-2 boxes:
- employerName: Box c (Employer's name)
- employerEIN: Box b (Employer identification number)
- wages: Box 1 (Wages, tips, other compensation)
- federalWithheld: Box 2 (Federal income tax withheld)
- stateWages: Box 16 (State wages)
- stateWithheld: Box 17 (State income tax withheld)
- state: Box 15 (State)

Be precise with numbers. Do not include dollar signs or commas in numeric values.`;

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
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

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mimeType = file.type || "image/jpeg";

    const openai = new OpenAI({ apiKey });

    const response = await openai.chat.completions.create({
      model: "o3",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Parse this W-2 form and extract all the data. Return only the JSON object.",
            },
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

    const content = response.choices[0]?.message?.content;
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

    return NextResponse.json({
      success: true,
      data: {
        employerName: String(parsed.employerName || ""),
        employerEIN: String(parsed.employerEIN || ""),
        wages: Number(parsed.wages) || 0,
        federalWithheld: Number(parsed.federalWithheld) || 0,
        stateWages: Number(parsed.stateWages) || 0,
        stateWithheld: Number(parsed.stateWithheld) || 0,
        state: String(parsed.state || ""),
      },
    });
  } catch (error) {
    console.error("W-2 parse error:", error);
    return NextResponse.json(
      { error: "Failed to parse W-2 image" },
      { status: 500 }
    );
  }
}
