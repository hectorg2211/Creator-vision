import OpenAI from "openai";
import { NextResponse } from "next/server";

type GeneratePainPointsBody = {
  strugglesBeforeBreakthrough?: string;
  notForPeopleLikeMe?: string;
  failuresAndFears?: string;
  stillWrestleWith?: string;
  audienceSharedPain?: string;
  message?: string;
  contentPillars?: string[];
  frameworkLabels?: Record<string, string>;
  existingPainPoints?: string[];
};

type GeneratePainPointsResponse = {
  painPoints: string[];
};

function buildPrompt(body: {
  strugglesBeforeBreakthrough: string;
  notForPeopleLikeMe: string;
  failuresAndFears: string;
  stillWrestleWith: string;
  audienceSharedPain: string;
  message: string;
  contentPillars: string[];
  frameworkLabels: Record<string, string>;
  existingPainPoints?: string[];
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
  if (body.existingPainPoints && body.existingPainPoints.length > 0) {
    contextParts.push(
      `Existing pain points (refine or replace weak ones): ${JSON.stringify(body.existingPainPoints)}`,
    );
  }

  const answers = [
    body.strugglesBeforeBreakthrough &&
      `Struggles before breakthrough: "${body.strugglesBeforeBreakthrough}"`,
    body.notForPeopleLikeMe &&
      `Felt this path wasn't for people like me: "${body.notForPeopleLikeMe}"`,
    body.failuresAndFears && `Failures, stalls, and fears: "${body.failuresAndFears}"`,
    body.stillWrestleWith && `Still wrestle with: "${body.stillWrestleWith}"`,
    body.audienceSharedPain &&
      `Audience shared pain and advice: "${body.audienceSharedPain}"`,
  ]
    .filter(Boolean)
    .join("\n");

  return `You are a brand strategist helping a creator articulate pain points for their Uniqueness / Your Truth board — short cards that blend personal struggle with audience relatability.

${contextParts.length > 0 ? `${contextParts.join("\n")}\n\n` : ""}Creator answers:
${answers}

Generate 4-6 short pain point statements (3-12 words each). Each card should capture the essence of a struggle — not a biography list — and feel relatable to the creator's audience. Mix personal experience with who feels the same pain today.

Examples:
- "Couldn't stay consistent until I had a system"
- "Felt too late to start — everyone else was ahead"
- "Launched twice before anything stuck"
- "Still compare myself before I hit publish"
- "Beginners who think they're too late need this"

Avoid generic motivational phrases, trauma dumps, or long backstory. Each item should feel like a card on a vision board.

Return JSON only: { "painPoints": ["...", "..."] }`;
}

export async function POST(request: Request) {
  let body: GeneratePainPointsBody;
  try {
    body = (await request.json()) as GeneratePainPointsBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const answers = {
    strugglesBeforeBreakthrough: body.strugglesBeforeBreakthrough?.trim() ?? "",
    notForPeopleLikeMe: body.notForPeopleLikeMe?.trim() ?? "",
    failuresAndFears: body.failuresAndFears?.trim() ?? "",
    stillWrestleWith: body.stillWrestleWith?.trim() ?? "",
    audienceSharedPain: body.audienceSharedPain?.trim() ?? "",
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
            existingPainPoints: body.existingPainPoints,
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

    const parsed = JSON.parse(content) as GeneratePainPointsResponse;
    const painPoints = Array.isArray(parsed.painPoints)
      ? parsed.painPoints
          .filter((item): item is string => typeof item === "string")
          .map((item) => item.trim())
          .filter((item) => item.length > 0)
      : [];

    if (painPoints.length === 0) {
      return NextResponse.json(
        { error: "Could not parse pain points from AI response." },
        { status: 502 },
      );
    }

    return NextResponse.json({ painPoints });
  } catch (error) {
    const messageText =
      error instanceof Error ? error.message : "Failed to generate pain points.";
    return NextResponse.json({ error: messageText }, { status: 502 });
  }
}
