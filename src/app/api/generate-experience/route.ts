import OpenAI from "openai";
import { NextResponse } from "next/server";

type GenerateExperienceBody = {
  rolesAndWork?: string;
  yearsAndDepth?: string;
  builtOrShipped?: string;
  soloOrCollaborative?: string;
  domainsAndContexts?: string;
  message?: string;
  contentPillars?: string[];
  frameworkLabels?: Record<string, string>;
  existingExperience?: string[];
};

type GenerateExperienceResponse = {
  experienceItems: string[];
};

function buildPrompt(body: {
  rolesAndWork: string;
  yearsAndDepth: string;
  builtOrShipped: string;
  soloOrCollaborative: string;
  domainsAndContexts: string;
  message: string;
  contentPillars: string[];
  frameworkLabels: Record<string, string>;
  existingExperience?: string[];
}): string {
  const contextParts: string[] = [];

  if (body.message) {
    contextParts.push(`Creator vision message: "${body.message}"`);
  }
  if (body.contentPillars.length > 0) {
    contextParts.push(`Content pillars: ${JSON.stringify(body.contentPillars)}`);
  }
  if (Object.keys(body.frameworkLabels).length > 0) {
    contextParts.push(`Framework labels: ${JSON.stringify(body.frameworkLabels)}`);
  }
  if (body.existingExperience && body.existingExperience.length > 0) {
    contextParts.push(
      `Existing experience items (refine or replace weak ones): ${JSON.stringify(body.existingExperience)}`,
    );
  }

  const answers = [
    body.rolesAndWork && `Roles and work: "${body.rolesAndWork}"`,
    body.yearsAndDepth && `Years and depth: "${body.yearsAndDepth}"`,
    body.builtOrShipped && `Built or shipped: "${body.builtOrShipped}"`,
    body.soloOrCollaborative && `Solo or collaborative: "${body.soloOrCollaborative}"`,
    body.domainsAndContexts && `Domains and contexts: "${body.domainsAndContexts}"`,
  ]
    .filter(Boolean)
    .join("\n");

  return `You are a brand strategist helping a creator articulate experience for their Uniqueness / Your Truth board — short cards that establish credibility for any career path, not only corporate tech.

${contextParts.length > 0 ? `${contextParts.join("\n")}\n\n` : ""}Creator answers:
${answers}

Generate 4-5 concise experience statements (3-12 words each). Each card should capture roles, tenure, wins, or context — concrete and readable on a vision board. Works for freelancers, creatives, parents returning to work, students, and traditional careers alike.

Examples:
- "Retail manager, 4 years — team leadership"
- "Self-taught for 3 years, then industry pivot"
- "First paying client from a side project"
- "Indie creator and agency team veteran"
- "Healthcare and local creative scene"

Avoid vague phrases or resume jargon dumps. Each item should feel like a card on a vision board.

Return JSON only: { "experienceItems": ["...", "..."] }`;
}

export async function POST(request: Request) {
  let body: GenerateExperienceBody;
  try {
    body = (await request.json()) as GenerateExperienceBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const answers = {
    rolesAndWork: body.rolesAndWork?.trim() ?? "",
    yearsAndDepth: body.yearsAndDepth?.trim() ?? "",
    builtOrShipped: body.builtOrShipped?.trim() ?? "",
    soloOrCollaborative: body.soloOrCollaborative?.trim() ?? "",
    domainsAndContexts: body.domainsAndContexts?.trim() ?? "",
  };

  const hasAnyAnswer = Object.values(answers).some((value) => value.length > 0);
  if (!hasAnyAnswer) {
    return NextResponse.json(
      { error: "Please answer at least one question." },
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
            ...answers,
            message: body.message?.trim() ?? "",
            contentPillars: body.contentPillars ?? [],
            frameworkLabels: body.frameworkLabels ?? {},
            existingExperience: body.existingExperience,
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

    const parsed = JSON.parse(content) as GenerateExperienceResponse;
    const experienceItems = Array.isArray(parsed.experienceItems)
      ? parsed.experienceItems
          .filter((item): item is string => typeof item === "string")
          .map((item) => item.trim())
          .filter((item) => item.length > 0)
      : [];

    if (experienceItems.length === 0) {
      return NextResponse.json(
        { error: "Could not parse experience from AI response." },
        { status: 502 },
      );
    }

    return NextResponse.json({ experienceItems });
  } catch (error) {
    const messageText =
      error instanceof Error ? error.message : "Failed to generate experience.";
    return NextResponse.json({ error: messageText }, { status: 502 });
  }
}
