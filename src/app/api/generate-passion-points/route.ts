import OpenAI from "openai";
import { NextResponse } from "next/server";

type GeneratePassionPointsBody = {
  hoursWithoutTiring?: string;
  creatingOrHelping?: string;
  missionDespiteDifficulty?: string;
  loveCreatingFor?: string;
  valuesAndAnchors?: string;
  message?: string;
  contentPillars?: string[];
  frameworkLabels?: Record<string, string>;
  existingPassionPoints?: string[];
};

type GeneratePassionPointsResponse = {
  passionPoints: string[];
};

function buildPrompt(body: {
  hoursWithoutTiring: string;
  creatingOrHelping: string;
  missionDespiteDifficulty: string;
  loveCreatingFor: string;
  valuesAndAnchors: string;
  message: string;
  contentPillars: string[];
  frameworkLabels: Record<string, string>;
  existingPassionPoints?: string[];
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
  if (body.existingPassionPoints && body.existingPassionPoints.length > 0) {
    contextParts.push(
      `Existing passion points (refine or replace weak ones): ${JSON.stringify(body.existingPassionPoints)}`,
    );
  }

  const answers = [
    body.hoursWithoutTiring && `Hours without tiring: "${body.hoursWithoutTiring}"`,
    body.creatingOrHelping && `Creating or helping that energizes: "${body.creatingOrHelping}"`,
    body.missionDespiteDifficulty &&
      `Mission despite difficulty: "${body.missionDespiteDifficulty}"`,
    body.loveCreatingFor && `Love creating or helping for: "${body.loveCreatingFor}"`,
    body.valuesAndAnchors && `Values and anchors: "${body.valuesAndAnchors}"`,
  ]
    .filter(Boolean)
    .join("\n");

  return `You are a brand strategist helping a creator articulate passion points for their Uniqueness / Your Truth board — short cards that blend personal energy with who they create or help for.

${contextParts.length > 0 ? `${contextParts.join("\n")}\n\n` : ""}Creator answers:
${answers}

Generate 4-6 short passion point statements (3-12 words each). Each card should be vivid and specific — blend what energizes them with who they serve. Not a biography list.

Examples:
- "Breaking down complex ideas for beginners"
- "Building products that help people ship faster"
- "Honest education when the field feels gatekept"
- "Creating for self-taught learners starting from zero"
- "Craftsmanship and learning in public"

Avoid generic motivational phrases or long backstory. Each item should feel like a card on a vision board.

Return JSON only: { "passionPoints": ["...", "..."] }`;
}

export async function POST(request: Request) {
  let body: GeneratePassionPointsBody;
  try {
    body = (await request.json()) as GeneratePassionPointsBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const answers = {
    hoursWithoutTiring: body.hoursWithoutTiring?.trim() ?? "",
    creatingOrHelping: body.creatingOrHelping?.trim() ?? "",
    missionDespiteDifficulty: body.missionDespiteDifficulty?.trim() ?? "",
    loveCreatingFor: body.loveCreatingFor?.trim() ?? "",
    valuesAndAnchors: body.valuesAndAnchors?.trim() ?? "",
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
            existingPassionPoints: body.existingPassionPoints,
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

    const parsed = JSON.parse(content) as GeneratePassionPointsResponse;
    const passionPoints = Array.isArray(parsed.passionPoints)
      ? parsed.passionPoints
          .filter((item): item is string => typeof item === "string")
          .map((item) => item.trim())
          .filter((item) => item.length > 0)
      : [];

    if (passionPoints.length === 0) {
      return NextResponse.json(
        { error: "Could not parse passion points from AI response." },
        { status: 502 },
      );
    }

    return NextResponse.json({ passionPoints });
  } catch (error) {
    const messageText =
      error instanceof Error ? error.message : "Failed to generate passion points.";
    return NextResponse.json({ error: messageText }, { status: 502 });
  }
}
