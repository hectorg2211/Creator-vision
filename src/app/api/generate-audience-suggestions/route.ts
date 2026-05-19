import OpenAI from "openai";
import { NextResponse } from "next/server";
import { sanitizeDemographicTraitLabels } from "@/lib/demographic-age-range";

type AudienceType = "demographic" | "psychographic";

type GenerateAudienceSuggestionsBody = {
  type?: AudienceType;
  message?: string;
  contentPillars?: string[];
  frameworkLabels?: Record<string, string>;
  existingSuggestions?: string[];
  existingCreators?: string[];
  existingTraits?: string[];
};

type DemographicResponse = {
  suggestions: string[];
};

type PsychographicResponse = {
  creators: string[];
  traits: string[];
};

const PLACEHOLDER_CREATOR_PATTERN =
  /^(name\s*(one|two|three|four)|example(\s+creator)?|creator\s*\d+|instagram\s+creator|influencer\s*\d+|lorem|placeholder|n\/a|tbd|unknown|sample|test\s*creator)/i;

const SUSPICIOUS_HANDLE_PATTERN =
  /^(creator|user|influencer|account|instagram|example|sample|test|placeholder)\d*$/i;

function sanitizeInstagramCreatorLabel(raw: string): string | null {
  let item = raw.trim().replace(/^["']|["']$/g, "").replace(/\*\*/g, "").trim();
  if (!item) {
    return null;
  }

  if (item.length > 80 || /^https?:\/\//i.test(item)) {
    return null;
  }

  if (PLACEHOLDER_CREATOR_PATTERN.test(item)) {
    return null;
  }

  const atCount = (item.match(/@/g) ?? []).length;
  if (atCount > 1) {
    return null;
  }

  const handleMatch = item.match(/@([a-zA-Z0-9._]+)/);
  if (handleMatch) {
    const handle = handleMatch[1];
    if (handle.length < 2 || handle.length > 30 || SUSPICIOUS_HANDLE_PATTERN.test(handle)) {
      return null;
    }
  }

  if (/^@[a-zA-Z0-9._]+$/.test(item) && item.length < 4) {
    return null;
  }

  const withoutHandle = item.replace(/\s*\(@?[a-zA-Z0-9._]+\)\s*$/u, "").replace(/^@/, "").trim();
  if (!withoutHandle && !handleMatch) {
    return null;
  }

  return item;
}

function sanitizeInstagramCreators(creators: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const raw of creators) {
    const sanitized = sanitizeInstagramCreatorLabel(raw);
    if (!sanitized) {
      continue;
    }

    const key = sanitized.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(sanitized);
  }

  return result;
}

const PSYCHOGRAPHIC_SYSTEM_MESSAGE = `You are a factual audience strategist. Accuracy matters more than variety.

Return only psychological and behavioral audience traits—never Instagram creators or influencer names.`;

function buildDemographicPrompt(context: {
  message: string;
  contentPillars: string[];
  frameworkLabels: Record<string, string>;
  existingSuggestions?: string[];
}): string {
  const frameworkLines = Object.entries(context.frameworkLabels)
    .map(([key, value]) => `- ${key}: "${value}"`)
    .join("\n");

  const existingLine =
    context.existingSuggestions && context.existingSuggestions.length > 0
      ? `\nExisting demographic traits (refine or replace weak ones): ${JSON.stringify(context.existingSuggestions)}`
      : "";

  return `You are an audience strategist helping a creator define their ideal audience demographic.

Creator vision message: "${context.message}"
Content pillars: ${JSON.stringify(context.contentPillars)}
Framework context:
${frameworkLines || "- (none provided)"}${existingLine}

Return exactly 5 short demographic trait labels in this fixed order:
1. Location — countries or regions (e.g. "US and Mexico")
2. Age range — numeric range spanning at most 10 years (e.g. "25-35" OK; "20-40" NOT OK — use "20-30" instead)
3. Primary persona — archetype or role (e.g. "Builders")
4. Professional context — job or life stage (e.g. "Working professionals")
5. Interest or behavior — niche interest tied to the content (e.g. "AI Consumers")

Return JSON only: { "suggestions": ["...", "...", "...", "...", "..."] }
Rules:
- Exactly 5 items in the order above
- Each label 1-4 words, no category prefixes (no "Location:" or "Age:")
- Specific to this creator's niche, not generic
- No duplicates
- Age range (item 2) must span at most 10 years — never wider (e.g. "25-35" yes, "20-40" no)`;
}

function buildPsychographicPrompt(context: {
  message: string;
  contentPillars: string[];
  frameworkLabels: Record<string, string>;
  existingTraits?: string[];
}): string {
  const frameworkLines = Object.entries(context.frameworkLabels)
    .map(([key, value]) => `- ${key}: "${value}"`)
    .join("\n");

  const existingTraitsLine =
    context.existingTraits && context.existingTraits.length > 0
      ? `\nExisting psychographic traits (refine or replace weak ones): ${JSON.stringify(context.existingTraits)}`
      : "";

  return `You are an audience strategist helping a creator define psychological and behavioral traits for their ideal audience.

Creator vision message: "${context.message}"
Content pillars: ${JSON.stringify(context.contentPillars)}
Framework context:
${frameworkLines || "- (none provided)"}${existingTraitsLine}

Return exactly 5 psychological and behavioral traits describing how this audience thinks, feels, and acts around the creator's topic (e.g. impostor syndrome, overthinks, underexecutes, easily distracted, craves direction, idea rich action poor, afraid of judgement, lacks discipline).

Return JSON only:
{
  "traits": ["trait one", "trait two", "trait three", "trait four", "trait five"]
}

Rules:
- Exactly 5 traits, each 2-6 words, lowercase phrasing OK
- No duplicates
- No category prefixes or bullet markers
- Specific to this creator's niche, not generic
- Do not include Instagram creators, influencer names, or @handles`;
}

export async function POST(request: Request) {
  let body: GenerateAudienceSuggestionsBody;
  try {
    body = (await request.json()) as GenerateAudienceSuggestionsBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const type = body.type;
  if (type !== "demographic" && type !== "psychographic") {
    return NextResponse.json(
      { error: "Type must be demographic or psychographic." },
      { status: 400 },
    );
  }

  const message = body.message?.trim();
  if (!message) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }

  const contentPillars = (body.contentPillars ?? []).filter(
    (pillar) => typeof pillar === "string" && pillar.trim().length > 0,
  );
  if (contentPillars.length === 0) {
    return NextResponse.json(
      { error: "At least one content pillar is required." },
      { status: 400 },
    );
  }

  const frameworkLabels =
    body.frameworkLabels && typeof body.frameworkLabels === "object"
      ? Object.fromEntries(
          Object.entries(body.frameworkLabels).filter(
            ([key, value]) =>
              typeof key === "string" &&
              typeof value === "string" &&
              value.trim().length > 0,
          ),
        )
      : {};

  const existingSuggestions = (body.existingSuggestions ?? []).filter(
    (item) => typeof item === "string" && item.trim().length > 0,
  );
  const existingCreators = (body.existingCreators ?? []).filter(
    (item) => typeof item === "string" && item.trim().length > 0,
  );
  const existingTraits = (body.existingTraits ?? []).filter(
    (item) => typeof item === "string" && item.trim().length > 0,
  );

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OpenAI API key is not configured." },
      { status: 500 },
    );
  }

  const openai = new OpenAI({ apiKey });
  const promptContext = {
    message,
    contentPillars,
    frameworkLabels,
  };
  const prompt =
    type === "demographic"
      ? buildDemographicPrompt({
          ...promptContext,
          existingSuggestions:
            existingSuggestions.length > 0 ? existingSuggestions : undefined,
        })
      : buildPsychographicPrompt({
          ...promptContext,
          existingTraits: existingTraits.length > 0 ? existingTraits : undefined,
        });

  try {
    const completion = await openai.chat.completions.create(
      type === "psychographic"
        ? {
            model: "gpt-4o-mini",
            temperature: 0.3,
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: PSYCHOGRAPHIC_SYSTEM_MESSAGE },
              { role: "user", content: prompt },
            ],
          }
        : {
            model: "gpt-4o-mini",
            response_format: { type: "json_object" },
            messages: [{ role: "user", content: prompt }],
          },
    );

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: "No response from OpenAI." }, { status: 502 });
    }

    if (type === "demographic") {
      const parsed = JSON.parse(content) as DemographicResponse;
      const suggestions = Array.isArray(parsed.suggestions)
        ? parsed.suggestions
            .filter((item): item is string => typeof item === "string")
            .map((item) => item.trim())
            .filter((item) => item.length > 0)
        : [];

      if (suggestions.length === 0) {
        return NextResponse.json(
          { error: "Could not parse suggestions from AI response." },
          { status: 502 },
        );
      }

      const sanitized = sanitizeDemographicTraitLabels(suggestions.slice(0, 5));

      return NextResponse.json({ suggestions: sanitized });
    }

    const parsed = JSON.parse(content) as PsychographicResponse;
    const traits = Array.isArray(parsed.traits)
      ? parsed.traits
          .filter((item): item is string => typeof item === "string")
          .map((item) => item.trim())
          .filter((item) => item.length > 0)
      : [];

    if (traits.length === 0) {
      return NextResponse.json(
        { error: "Could not parse psychographic trait suggestions from AI response." },
        { status: 502 },
      );
    }

    return NextResponse.json({
      traits: traits.slice(0, 5),
    });
  } catch (error) {
    const messageText =
      error instanceof Error ? error.message : "Failed to generate audience suggestions.";
    return NextResponse.json({ error: messageText }, { status: 502 });
  }
}
