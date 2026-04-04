"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";

interface DiscoveredDeduction {
  category: string;
  description: string;
  amount: number;
  irs_reference: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

interface APIMessage {
  role: "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  home_office: "Home Office",
  vehicle_mileage: "Vehicle / Mileage",
  supplies_equipment: "Supplies & Equipment",
  software_subscriptions: "Software & Subscriptions",
  professional_services: "Professional Services",
  marketing_advertising: "Marketing & Advertising",
  travel_meals: "Travel & Meals",
  education_training: "Education & Training",
  insurance: "Business Insurance",
  phone_internet: "Phone & Internet",
  other_business: "Other Business Expense",
};

interface DeductionChatProps {
  context: Record<string, unknown>;
  onDeductionsChange: (total: number, description: string) => void;
}

export function DeductionChat({
  context,
  onDeductionsChange,
}: DeductionChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [displayMessages, setDisplayMessages] = useState<ChatMessage[]>([]);
  const [apiMessages, setApiMessages] = useState<APIMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [deductions, setDeductions] = useState<DiscoveredDeduction[]>([]);
  const [showSummary, setShowSummary] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [displayMessages, scrollToBottom]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  async function sendToAPI(messages: APIMessage[]): Promise<void> {
    setLoading(true);
    try {
      const resp = await fetch("/api/deduction-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, context }),
      });

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || "Chat failed");
      }

      const { message } = await resp.json();

      // Handle tool calls
      if (message.tool_calls && message.tool_calls.length > 0) {
        const toolResults: APIMessage[] = [];
        const newDeductions = [...deductions];

        // Add assistant message with tool calls to API history
        const assistantMsg: APIMessage = {
          role: "assistant",
          content: message.content,
          tool_calls: message.tool_calls,
        };

        for (const tc of message.tool_calls) {
          const args = JSON.parse(tc.function.arguments);

          if (tc.function.name === "add_deduction") {
            const ded: DiscoveredDeduction = {
              category: args.category,
              description: args.description,
              amount: args.amount,
              irs_reference: args.irs_reference,
            };
            newDeductions.push(ded);

            toolResults.push({
              role: "tool",
              tool_call_id: tc.id,
              content: JSON.stringify({
                success: true,
                message: `Added: ${ded.description} ($${ded.amount})`,
              }),
            });
          } else if (tc.function.name === "summarize_deductions") {
            setShowSummary(true);
            toolResults.push({
              role: "tool",
              tool_call_id: tc.id,
              content: JSON.stringify({
                success: true,
                message: "Summary displayed to user.",
              }),
            });
          }
        }

        setDeductions(newDeductions);

        // Update totals
        const total = newDeductions.reduce((s, d) => s + d.amount, 0);
        const desc = newDeductions
          .map((d) => `${d.description} ($${d.amount.toLocaleString()})`)
          .join("; ");
        onDeductionsChange(total, desc);

        // Continue conversation with tool results
        const updatedMessages = [...messages, assistantMsg, ...toolResults];
        setApiMessages(updatedMessages);

        // If there was text content alongside tool calls, show it
        if (message.content) {
          setDisplayMessages((prev) => [
            ...prev,
            { role: "assistant", content: message.content },
          ]);
        }

        // Get the follow-up response
        await sendToAPI(updatedMessages);
        return;
      }

      // Regular text response
      if (message.content) {
        setDisplayMessages((prev) => [
          ...prev,
          { role: "assistant", content: message.content },
        ]);
        setApiMessages((prev) => [
          ...prev,
          { role: "assistant", content: message.content },
        ]);
      }
    } catch (err) {
      setDisplayMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Sorry, something went wrong: ${err instanceof Error ? err.message : "Unknown error"}. Try again.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setDisplayMessages((prev) => [...prev, { role: "user", content: text }]);

    const userMsg: APIMessage = { role: "user", content: text };
    const updatedMessages = [...apiMessages, userMsg];
    setApiMessages(updatedMessages);

    await sendToAPI(updatedMessages);
  }

  function handleStart() {
    setIsOpen(true);
    // Send an initial message to kick off the conversation
    const initialMsg: APIMessage = {
      role: "user",
      content:
        "Hi! I'm an entrepreneur building a small business. Can you help me find tax deductions I might be missing?",
    };
    setDisplayMessages([
      {
        role: "user",
        content:
          "Hi! I'm an entrepreneur building a small business. Can you help me find tax deductions I might be missing?",
      },
    ]);
    setApiMessages([initialMsg]);
    sendToAPI([initialMsg]);
  }

  if (!isOpen) {
    return (
      <Card variant="info" className="text-center">
        <div className="space-y-3">
          <div className="text-3xl">💬</div>
          <CardTitle className="text-base">
            Find Hidden Deductions with AI
          </CardTitle>
          <p className="text-sm text-gray-600">
            Our AI tax advisor will ask you questions about your business
            expenses and help you discover deductions you might be missing —
            especially useful for entrepreneurs and small business owners.
          </p>
          <Button onClick={handleStart}>Start Deduction Discovery</Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <CardTitle className="text-base">
          AI Deduction Advisor
          {deductions.length > 0 && (
            <span className="ml-2 text-sm font-normal text-green-700">
              ({deductions.length} found — $
              {deductions
                .reduce((s, d) => s + d.amount, 0)
                .toLocaleString()}
              )
            </span>
          )}
        </CardTitle>
        <button
          onClick={() => setShowSummary(!showSummary)}
          className="text-xs text-blue-600 hover:underline"
          disabled={deductions.length === 0}
        >
          {showSummary ? "Hide" : "Show"} Summary
        </button>
      </div>

      {/* Discovered deductions summary */}
      {showSummary && deductions.length > 0 && (
        <div className="mb-3 rounded-lg bg-green-50 border border-green-200 p-3">
          <p className="text-xs font-semibold text-green-800 mb-2">
            Discovered Deductions:
          </p>
          {deductions.map((d, i) => (
            <div
              key={i}
              className="flex justify-between text-xs text-green-700 py-0.5"
            >
              <span>
                {CATEGORY_LABELS[d.category] || d.category}: {d.description}
              </span>
              <span className="font-mono font-medium">
                ${d.amount.toLocaleString()}
              </span>
            </div>
          ))}
          <div className="flex justify-between text-xs font-semibold text-green-900 border-t border-green-300 mt-2 pt-2">
            <span>Total</span>
            <span>
              ${deductions.reduce((s, d) => s + d.amount, 0).toLocaleString()}
            </span>
          </div>
          <p className="text-[10px] text-green-600 mt-1">
            IRS references included for each item
          </p>
        </div>
      )}

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto max-h-80 space-y-3 mb-3 pr-1">
        {displayMessages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                msg.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-xl px-3 py-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                />
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Describe your business expenses..."
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          disabled={loading}
        />
        <Button onClick={handleSend} disabled={loading || !input.trim()}>
          Send
        </Button>
      </div>
    </Card>
  );
}
