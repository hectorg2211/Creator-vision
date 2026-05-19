import OpenAI from "openai";
import { NextResponse } from "next/server";
import type { EcosystemCategory } from "@/lib/ecosystem-category";

const ECOSYSTEM_CATEGORIES = [
  "oneOff",
  "ongoingContent",
  "highValuePartners",
  "reinvest",
] as const satisfies readonly EcosystemCategory[];

type GenerateEcosystemBody = {
  category?: EcosystemCategory;
  preferredIncomeMix?: string;
  audienceStage?: string;
  willingToSell?: string;
  message?: string;
  contentPillars?: string[];
  painPoints?: string[];
  passionPoints?: string[];
  experienceItems?: string[];
  skills?: string[];
  demographicTraits?: string[];
  psychographicTraits?: string[];
  instagramCreators?: string[];
  frameworkLabels?: Record<string, string>;
  existingOneOff?: string[];
  existingOngoingContent?: string[];
  existingHighValuePartners?: string[];
  existingReinvest?: string[];
};

type GenerateEcosystemResponse = {
  oneOff: string[];
  ongoingContent: string[];
  highValuePartners: string[];
  reinvest: string[];
};

const CATEGORY_PROMPT_SECTIONS: Record<
  EcosystemCategory,
  { key: keyof GenerateEcosystemResponse; title: string; description: string }
> = {
  oneOff: {
    key: "oneOff",
    title: "oneOff",
    description:
      "Single purchases: courses, templates, audits, workshops, digital products, one-time services.",
  },
  ongoingContent: {
    key: "ongoingContent",
    title: "ongoingContent",
    description:
      "Recurring revenue: subscriptions, memberships, retainers, Patreon-style tiers, recurring coaching.",
  },
  highValuePartners: {
    key: "highValuePartners",
    title: "highValuePartners",
    description:
      "Brand deals, affiliates, sponsorships, B2B partnerships, ambassador programs, collabs.",
  },
  reinvest: {
    key: "reinvest",
    title: "reinvest",
    description:
      "How to reinvest profits: tools, team hires, ads, product development, education, systems.",
  },
};

function buildPrompt(body: {
  preferredIncomeMix: string;
  audienceStage: string;
  willingToSell: string;
  message: string;
  contentPillars: string[];
  painPoints: string[];
  passionPoints: string[];
  experienceItems: string[];
  skills: string[];
  demographicTraits: string[];
  psychographicTraits: string[];
  instagramCreators: string[];
  frameworkLabels: Record<string, string>;
  existingOneOff?: string[];
  existingOngoingContent?: string[];
  existingHighValuePartners?: string[];
  existingReinvest?: string[];
  category?: EcosystemCategory;
}): string {
  const contextParts: string[] = [];

  if (body.message) {
    contextParts.push(`Creator vision message: "${body.message}"`);
  }
  if (body.contentPillars.length > 0) {
    contextParts.push(`Content pillars: ${JSON.stringify(body.contentPillars)}`);
  }
  if (body.painPoints.length > 0) {
    contextParts.push(`Pain points: ${JSON.stringify(body.painPoints)}`);
  }
  if (body.passionPoints.length > 0) {
    contextParts.push(`Passion points: ${JSON.stringify(body.passionPoints)}`);
  }
  if (body.experienceItems.length > 0) {
    contextParts.push(`Experience: ${JSON.stringify(body.experienceItems)}`);
  }
  if (body.skills.length > 0) {
    contextParts.push(`Skills: ${JSON.stringify(body.skills)}`);
  }
  if (body.demographicTraits.length > 0) {
    contextParts.push(`Demographic traits: ${JSON.stringify(body.demographicTraits)}`);
  }
  if (body.psychographicTraits.length > 0) {
    contextParts.push(`Psychographic traits: ${JSON.stringify(body.psychographicTraits)}`);
  }
  if (body.instagramCreators.length > 0) {
    contextParts.push(`Instagram creators they admire: ${JSON.stringify(body.instagramCreators)}`);
  }
  if (Object.keys(body.frameworkLabels).length > 0) {
    contextParts.push(`Framework labels: ${JSON.stringify(body.frameworkLabels)}`);
  }

  const existingParts: string[] = [];
  if (body.existingOneOff && body.existingOneOff.length > 0) {
    existingParts.push(`Existing one-off ideas: ${JSON.stringify(body.existingOneOff)}`);
  }
  if (body.existingOngoingContent && body.existingOngoingContent.length > 0) {
    existingParts.push(
      `Existing ongoing content ideas: ${JSON.stringify(body.existingOngoingContent)}`,
    );
  }
  if (body.existingHighValuePartners && body.existingHighValuePartners.length > 0) {
    existingParts.push(
      `Existing high-value partner ideas: ${JSON.stringify(body.existingHighValuePartners)}`,
    );
  }
  if (body.existingReinvest && body.existingReinvest.length > 0) {
    existingParts.push(`Existing reinvest ideas: ${JSON.stringify(body.existingReinvest)}`);
  }

  const optionalAnswers = [
    body.preferredIncomeMix &&
      `Preferred income mix: "${body.preferredIncomeMix}"`,
    body.audienceStage && `Audience size / stage: "${body.audienceStage}"`,
    body.willingToSell && `Willing to sell / offer: "${body.willingToSell}"`,
  ]
    .filter(Boolean)
    .join("\n");

  if (body.category) {
    const section = CATEGORY_PROMPT_SECTIONS[body.category];
    return `You are a monetization strategist helping a creator map their revenue ecosystem on a vision board.

${contextParts.length > 0 ? `${contextParts.join("\n")}\n\n` : ""}${existingParts.length > 0 ? `${existingParts.join("\n")}\n\n` : ""}${optionalAnswers ? `Optional creator notes:\n${optionalAnswers}\n\n` : ""}Generate tailored monetization ideas for this category only (2-4 items). Each item is a short vision-board card (3-14 words), specific to this creator's niche, audience, and strengths — not generic advice.

Category **${section.title}** — ${section.description}

Match sophistication to their audience stage when known. Ideas should feel achievable for their current stage. Do not repeat ideas already listed for this category.

Return JSON only:
{
  "${section.key}": ["...", "..."]
}`;
  }

  return `You are a monetization strategist helping a creator map their revenue ecosystem on a vision board — four categories of how they could earn and grow based on their creator vision.

${contextParts.length > 0 ? `${contextParts.join("\n")}\n\n` : ""}${existingParts.length > 0 ? `${existingParts.join("\n")}\n\n` : ""}${optionalAnswers ? `Optional creator notes:\n${optionalAnswers}\n\n` : ""}Generate tailored monetization ideas for each category (2-4 items per category). Each item is a short vision-board card (3-14 words), specific to this creator's niche, audience, and strengths — not generic "start a podcast" advice.

Categories:
1. **oneOff** — Single purchases: courses, templates, audits, workshops, digital products, one-time services.
2. **ongoingContent** — Recurring revenue: subscriptions, memberships, retainers, Patreon-style tiers, recurring coaching.
3. **highValuePartners** — Brand deals, affiliates, sponsorships, B2B partnerships, ambassador programs, collabs.
4. **reinvest** — How to reinvest profits: tools, team hires, ads, product development, education, systems.

Avoid duplicates across categories. Match sophistication to their audience stage when known. Ideas should feel achievable for their current stage.

Return JSON only:
{
  "oneOff": ["...", "..."],
  "ongoingContent": ["...", "..."],
  "highValuePartners": ["...", "..."],
  "reinvest": ["...", "..."]
}`;
}

function parseCategoryItems(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export async function POST(request: Request) {
  let body: GenerateEcosystemBody;
  try {
    body = (await request.json()) as GenerateEcosystemBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const category =
    body.category &&
    ECOSYSTEM_CATEGORIES.includes(body.category as (typeof ECOSYSTEM_CATEGORIES)[number])
      ? body.category
      : undefined;

  const hasContentPillars = (body.contentPillars?.length ?? 0) > 0;
  if (!hasContentPillars) {
    return NextResponse.json(
      { error: "You should add your content pillars first." },
      { status: 400 },
    );
  }

  const hasBoardContext =
    (body.message?.trim().length ?? 0) > 0 ||
    hasContentPillars ||
    (body.painPoints?.length ?? 0) > 0 ||
    (body.passionPoints?.length ?? 0) > 0;

  if (!hasBoardContext) {
    return NextResponse.json(
      { error: "Add a vision message or board content before building your ecosystem." },
      { status: 400 },
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OpenAI API key is not configured." },
      { status: 500 },
    );
  }

  const openai = new OpenAI({ apiKey });

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: buildPrompt({
            preferredIncomeMix: body.preferredIncomeMix?.trim() ?? "",
            audienceStage: body.audienceStage?.trim() ?? "",
            willingToSell: body.willingToSell?.trim() ?? "",
            message: body.message?.trim() ?? "",
            contentPillars: body.contentPillars ?? [],
            painPoints: body.painPoints ?? [],
            passionPoints: body.passionPoints ?? [],
            experienceItems: body.experienceItems ?? [],
            skills: body.skills ?? [],
            demographicTraits: body.demographicTraits ?? [],
            psychographicTraits: body.psychographicTraits ?? [],
            instagramCreators: body.instagramCreators ?? [],
            frameworkLabels: body.frameworkLabels ?? {},
            existingOneOff: body.existingOneOff,
            existingOngoingContent: body.existingOngoingContent,
            existingHighValuePartners: body.existingHighValuePartners,
            existingReinvest: body.existingReinvest,
            category,
          }),
        },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: "No response from OpenAI." },
        { status: 502 },
      );
    }

    const parsed = JSON.parse(content) as GenerateEcosystemResponse;
    const oneOff = parseCategoryItems(parsed.oneOff);
    const ongoingContent = parseCategoryItems(parsed.ongoingContent);
    const highValuePartners = parseCategoryItems(parsed.highValuePartners);
    const reinvest = parseCategoryItems(parsed.reinvest);

    if (category) {
      const categoryItems = {
        oneOff,
        ongoingContent,
        highValuePartners,
        reinvest,
      }[category];

      if (categoryItems.length === 0) {
        return NextResponse.json(
          { error: "Could not parse ecosystem ideas from AI response." },
          { status: 502 },
        );
      }

      return NextResponse.json({
        oneOff: category === "oneOff" ? oneOff : [],
        ongoingContent: category === "ongoingContent" ? ongoingContent : [],
        highValuePartners: category === "highValuePartners" ? highValuePartners : [],
        reinvest: category === "reinvest" ? reinvest : [],
      });
    }

    if (
      oneOff.length === 0 &&
      ongoingContent.length === 0 &&
      highValuePartners.length === 0 &&
      reinvest.length === 0
    ) {
      return NextResponse.json(
        { error: "Could not parse ecosystem ideas from AI response." },
        { status: 502 },
      );
    }

    return NextResponse.json({
      oneOff,
      ongoingContent,
      highValuePartners,
      reinvest,
    });
  } catch (error) {
    const messageText =
      error instanceof Error ? error.message : "Failed to generate ecosystem.";
    return NextResponse.json({ error: messageText }, { status: 502 });
  }
}
