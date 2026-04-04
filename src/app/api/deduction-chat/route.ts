import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import type { ChatCompletionMessageParam, ChatCompletionTool } from "openai/resources/chat/completions";

const TOOLS: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "add_deduction",
      description:
        "Add a discovered deductible expense to the user's return. Call this when the user confirms an expense amount that qualifies as a tax deduction.",
      parameters: {
        type: "object",
        properties: {
          category: {
            type: "string",
            enum: [
              "home_office",
              "vehicle_mileage",
              "supplies_equipment",
              "software_subscriptions",
              "professional_services",
              "marketing_advertising",
              "travel_meals",
              "education_training",
              "insurance",
              "phone_internet",
              "other_business",
            ],
            description: "The IRS category for this deduction",
          },
          description: {
            type: "string",
            description: "A short human-readable description of the expense",
          },
          amount: {
            type: "number",
            description: "The dollar amount of the deduction",
          },
          irs_reference: {
            type: "string",
            description:
              "The relevant IRS form, schedule, or publication (e.g., 'Schedule C, Line 30' or 'Publication 587')",
          },
        },
        required: ["category", "description", "amount", "irs_reference"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "summarize_deductions",
      description:
        "Summarize all deductions discovered in this conversation so the user can review them before saving.",
      parameters: {
        type: "object",
        properties: {
          deductions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                category: { type: "string" },
                description: { type: "string" },
                amount: { type: "number" },
                irs_reference: { type: "string" },
              },
              required: ["category", "description", "amount", "irs_reference"],
            },
            description: "All deductions discovered during this conversation",
          },
          total: {
            type: "number",
            description: "Total dollar amount of all deductions",
          },
        },
        required: ["deductions", "total"],
      },
    },
  },
];

function buildSystemPrompt(context: Record<string, unknown>): string {
  return `You are a friendly, knowledgeable tax advisor assistant embedded in TaxReady, a tax preparation app. Your job is to help the user discover deductible business expenses they may have overlooked — especially for entrepreneurs and small business owners.

## User Context
- Filing Status: ${context.filingStatus || "unknown"}
- State: ${context.state || "unknown"}
- Total W-2 Wages: $${context.totalWages || 0}
- Health Insurance Premiums: $${context.healthInsurance || 0}
- Charitable Contributions: $${context.charitable || 0}
- Property Tax Paid: $${context.propertyTax || 0}
- Mortgage Interest: $${context.mortgageInterest || 0}
- Is Full-Time Student: ${context.isStudent ? "Yes" : "No"}
- Currently Entered "Other Deductions": $${context.otherDeductions || 0}
- Other Description: ${context.otherDescription || "none"}

## Your Approach
1. Start by asking about their business or entrepreneurial activities — what they do, whether they have a home office, use their car for business, etc.
2. Ask ONE or TWO questions at a time. Don't overwhelm them.
3. When they mention an expense, ask for the approximate annual amount.
4. Once they confirm an amount, use the \`add_deduction\` tool to record it.
5. After exploring major categories, use \`summarize_deductions\` to show them the total.
6. Be conversational and encouraging. Many first-time filers don't realize how many business expenses are deductible.

## Key Deduction Categories for Entrepreneurs (Schedule C)
- **Home Office** (Form 8829 / simplified method: $5/sq ft up to 300 sq ft = $1,500 max)
- **Vehicle/Mileage** (2025 standard rate: 70 cents/mile for business use)
- **Supplies & Equipment** (Section 179 deduction for equipment under $1,250,000)
- **Software & Subscriptions** (SaaS tools, cloud hosting, domain names)
- **Professional Services** (accounting, legal, consulting fees)
- **Marketing & Advertising** (website, social media ads, business cards)
- **Travel & Meals** (50% of business meals; 100% of business travel)
- **Education & Training** (courses, books, conferences related to your business)
- **Business Insurance** (liability, E&O, cyber insurance)
- **Phone & Internet** (business-use percentage of personal plans)

## Rules
- Only suggest legitimately deductible expenses per IRS rules.
- Always cite the relevant IRS form/schedule/publication.
- If unsure whether something qualifies, say so and suggest they consult a CPA.
- Don't provide specific legal or financial advice — frame things as "this may be deductible" or "many entrepreneurs deduct this."
- Keep responses concise (2-4 sentences per topic).
- Tax year is 2025.`;
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { messages, context } = body as {
      messages: ChatCompletionMessageParam[];
      context: Record<string, unknown>;
    };

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    const openai = new OpenAI({ apiKey });

    const systemMessage: ChatCompletionMessageParam = {
      role: "system",
      content: buildSystemPrompt(context || {}),
    };

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [systemMessage, ...messages],
      tools: TOOLS,
      tool_choice: "auto",
      temperature: 0.7,
      max_tokens: 800,
    });

    const choice = response.choices[0];

    return NextResponse.json({
      message: choice.message,
      finish_reason: choice.finish_reason,
    });
  } catch (error) {
    console.error("Deduction chat error:", error);
    const message =
      error instanceof Error ? error.message : "Chat request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
