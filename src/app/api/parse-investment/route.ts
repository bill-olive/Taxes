import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const PARSE_PROMPT = `You are a tax document parser. Identify the form type and extract all data from the provided 1099 document.

First determine which form this is: 1099-INT, 1099-DIV, or 1099-B.

Then return ONLY valid JSON with this structure:
{
  "formType": "1099-INT" | "1099-DIV" | "1099-B",
  "form1099INT": {
    "payerName": "string",
    "payerEIN": "string (XX-XXXXXXX)",
    "interestIncome": number (Box 1),
    "earlyWithdrawalPenalty": number (Box 2),
    "federalWithheld": number (Box 4),
    "taxExemptInterest": number (Box 8)
  },
  "form1099DIV": {
    "payerName": "string",
    "payerEIN": "string (XX-XXXXXXX)",
    "ordinaryDividends": number (Box 1a),
    "qualifiedDividends": number (Box 1b),
    "totalCapitalGain": number (Box 2a),
    "section1250Gain": number (Box 2b),
    "federalWithheld": number (Box 4),
    "foreignTaxPaid": number (Box 7),
    "exemptInterestDividends": number (Box 12)
  },
  "form1099B": {
    "brokerName": "string",
    "description": "string",
    "dateAcquired": "YYYY-MM-DD",
    "dateSold": "YYYY-MM-DD",
    "proceeds": number (Box 1d),
    "costBasis": number (Box 1e),
    "isShortTerm": boolean,
    "federalWithheld": number (Box 4)
  }
}

Only populate the object matching the detected formType. Set the other two to null.
Use 0 for any numeric field you cannot read. Use "" for text fields you cannot read.
Do not include dollar signs or commas in numeric values.`;

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
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const openai = new OpenAI({ apiKey });
    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");

    let content: string | null;

    if (isPdf) {
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
              {
                type: "text",
                text:
                  PARSE_PROMPT +
                  "\n\nParse this 1099 document and return only the JSON object.",
              },
              {
                type: "file",
                file: { file_id: uploaded.id },
              } as never,
            ],
          },
        ],
      });
      content = response.choices[0]?.message?.content ?? null;
      await openai.files.delete(uploaded.id).catch(() => {});
    } else {
      const bytes = await file.arrayBuffer();
      const base64 = Buffer.from(bytes).toString("base64");
      const mimeType = file.type || "image/jpeg";
      const response = await openai.chat.completions.create({
        model: "o3",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text:
                  PARSE_PROMPT +
                  "\n\nParse this 1099 form and return only the JSON object.",
              },
              {
                type: "image_url",
                image_url: { url: `data:${mimeType};base64,${base64}` },
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
        formType: parsed.formType || "1099-INT",
        form1099INT: parsed.form1099INT
          ? {
              payerName: String(parsed.form1099INT.payerName || ""),
              payerEIN: String(parsed.form1099INT.payerEIN || ""),
              interestIncome: Number(parsed.form1099INT.interestIncome) || 0,
              earlyWithdrawalPenalty:
                Number(parsed.form1099INT.earlyWithdrawalPenalty) || 0,
              federalWithheld:
                Number(parsed.form1099INT.federalWithheld) || 0,
              taxExemptInterest:
                Number(parsed.form1099INT.taxExemptInterest) || 0,
            }
          : null,
        form1099DIV: parsed.form1099DIV
          ? {
              payerName: String(parsed.form1099DIV.payerName || ""),
              payerEIN: String(parsed.form1099DIV.payerEIN || ""),
              ordinaryDividends:
                Number(parsed.form1099DIV.ordinaryDividends) || 0,
              qualifiedDividends:
                Number(parsed.form1099DIV.qualifiedDividends) || 0,
              totalCapitalGain:
                Number(parsed.form1099DIV.totalCapitalGain) || 0,
              section1250Gain:
                Number(parsed.form1099DIV.section1250Gain) || 0,
              federalWithheld:
                Number(parsed.form1099DIV.federalWithheld) || 0,
              foreignTaxPaid:
                Number(parsed.form1099DIV.foreignTaxPaid) || 0,
              exemptInterestDividends:
                Number(parsed.form1099DIV.exemptInterestDividends) || 0,
            }
          : null,
        form1099B: parsed.form1099B
          ? {
              brokerName: String(parsed.form1099B.brokerName || ""),
              description: String(parsed.form1099B.description || ""),
              dateAcquired: String(parsed.form1099B.dateAcquired || ""),
              dateSold: String(parsed.form1099B.dateSold || ""),
              proceeds: Number(parsed.form1099B.proceeds) || 0,
              costBasis: Number(parsed.form1099B.costBasis) || 0,
              gainOrLoss:
                (Number(parsed.form1099B.proceeds) || 0) -
                (Number(parsed.form1099B.costBasis) || 0),
              isShortTerm: Boolean(parsed.form1099B.isShortTerm),
              federalWithheld:
                Number(parsed.form1099B.federalWithheld) || 0,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Investment form parse error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to parse form";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
