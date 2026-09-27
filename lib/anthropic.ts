import Anthropic from "@anthropic-ai/sdk";

// Model used for statement OCR/extraction. Opus 5 is the default; you can switch
// to a cheaper model (e.g. "claude-haiku-4-5") by setting STATEMENT_AI_MODEL.
export const STATEMENT_AI_MODEL =
  process.env.STATEMENT_AI_MODEL || "claude-opus-5";

export function getAnthropic(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  return new Anthropic({ apiKey });
}

export interface StatementLine {
  date: string; // YYYY-MM-DD
  description: string;
  amount: number; // positive
  direction: "in" | "out";
  account_code?: string | null; // AI-suggested chart-of-accounts code
}

export interface AccountHint {
  code: string;
  name: string;
  type: string; // income | expense | asset | liability | equity
}

function buildSchema(withAccount: boolean) {
  const props: Record<string, unknown> = {
    date: { type: "string", description: "Transaction date in YYYY-MM-DD" },
    description: { type: "string", description: "Narrative / payee text" },
    amount: { type: "number", description: "Absolute value of the amount, always positive" },
    direction: {
      type: "string",
      enum: ["in", "out"],
      description: "'in' for money received (credit), 'out' for money paid (debit)",
    },
  };
  const required = ["date", "description", "amount", "direction"];
  if (withAccount) {
    props.account_code = {
      type: "string",
      description:
        "The single best-fitting account code from the provided chart of accounts " +
        "(an income code for 'in', an expense code for 'out').",
    };
    required.push("account_code");
  }
  return {
    type: "object",
    properties: {
      lines: {
        type: "array",
        items: { type: "object", properties: props, required, additionalProperties: false },
      },
    },
    required: ["lines"],
    additionalProperties: false,
  };
}

function contentBlockFor(mime: string, base64: string, text: string | null) {
  if (mime === "application/pdf") {
    return {
      type: "document" as const,
      source: { type: "base64" as const, media_type: "application/pdf" as const, data: base64 },
    };
  }
  if (mime.startsWith("image/")) {
    return {
      type: "image" as const,
      source: {
        type: "base64" as const,
        media_type: mime as "image/png" | "image/jpeg" | "image/gif" | "image/webp",
        data: base64,
      },
    };
  }
  // CSV / text — send decoded text
  return {
    type: "text" as const,
    text: `Bank statement contents:\n\n${text ?? Buffer.from(base64, "base64").toString("utf8")}`,
  };
}

/**
 * Extract structured transaction lines from a bank statement (PDF, image, or CSV/text).
 * When `accounts` is supplied, the model also suggests the best-fitting account code
 * per line (for auto-categorised import). Returns null if no API key is configured.
 */
export async function extractStatementLines(
  bytes: Uint8Array,
  mimeType: string,
  accounts?: AccountHint[],
): Promise<StatementLine[] | null> {
  const client = getAnthropic();
  if (!client) return null;

  const withAccount = !!accounts && accounts.length > 0;
  const base64 = Buffer.from(bytes).toString("base64");
  const mime = mimeType || "application/pdf";
  const fileBlock = contentBlockFor(mime, base64, null);

  let instruction =
    "This is a bank statement. Extract every individual transaction line. " +
    "For each: the date (YYYY-MM-DD), the description/narrative, the absolute " +
    "amount as a positive number, and direction ('in' for credits/money received, " +
    "'out' for debits/money paid out). Ignore opening/closing balances, subtotals, " +
    "and non-transaction rows.";
  if (withAccount) {
    const list = accounts!
      .map((a) => `${a.code} — ${a.name} (${a.type})`)
      .join("\n");
    instruction +=
      "\n\nAlso choose, for each line, the single best-fitting account_code from this " +
      "chart of accounts (use an income code for 'in' lines and an expense code for " +
      "'out' lines):\n" +
      list;
  }
  instruction += "\n\nReturn them in the required JSON shape.";

  // The `effort` control is supported on Opus/Sonnet/Fable but NOT on Haiku
  // (it returns a 400 there), so only include it for models that accept it.
  const supportsEffort = !/haiku/i.test(STATEMENT_AI_MODEL);
  const format = { type: "json_schema" as const, schema: buildSchema(withAccount) };
  const output_config = supportsEffort ? { effort: "low" as const, format } : { format };

  const response = await client.messages.create({
    model: STATEMENT_AI_MODEL,
    max_tokens: 8000,
    output_config,
    messages: [{ role: "user", content: [fileBlock, { type: "text", text: instruction }] }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") return [];
  try {
    const parsed = JSON.parse(textBlock.text) as { lines?: StatementLine[] };
    return Array.isArray(parsed.lines) ? parsed.lines : [];
  } catch {
    return [];
  }
}
