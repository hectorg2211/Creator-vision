import OpenAI from "openai";
import { NextResponse } from "next/server";

type GeneratePillarsResponse = {
  pillars: string[];
};

function buildPrompt(message: string): string {
  return `You are a content strategist. Given a creator's core message, suggest 4-6 content pillars — short topic labels (2-4 words each) that this creator could consistently post about.

Message: "${message}"

Return JSON only: { "pillars": ["...", "..."] }
Rules:
- Pillars must directly support the message's theme
- Use concrete, searchable topics (not vague values)
- No duplicates
- Max 6 pillars`;
}

export async function POST(request: Request) {
  let body: { message?: string };
  try {
    body = (await request.json()) as { message?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const message = body.message?.trim();
  if (!message) {
    return NextResponse.json(
      { error: "Message is required." },
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
          content: buildPrompt(message),
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

    const parsed = JSON.parse(content) as GeneratePillarsResponse;
    const pillars = Array.isArray(parsed.pillars)
      ? parsed.pillars.filter((pillar): pillar is string => typeof pillar === "string")
      : [];

    if (pillars.length === 0) {
      return NextResponse.json(
        { error: "Could not parse pillars from AI response." },
        { status: 502 },
      );
    }

    return NextResponse.json({ pillars: pillars.slice(0, 6) });
  } catch (error) {
    const messageText =
      error instanceof Error ? error.message : "Failed to generate pillars.";
    return NextResponse.json({ error: messageText }, { status: 502 });
  }
}
