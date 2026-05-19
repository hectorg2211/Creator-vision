import OpenAI from "openai";
import { NextResponse } from "next/server";

type GenerateMessageBody = {
  who?: string;
  helpWith?: string;
  uniqueness?: string;
};

type GenerateMessageResponse = {
  message: string;
};

function buildPrompt(answers: Required<GenerateMessageBody>): string {
  return `You are a brand strategist helping a creator articulate their core vision message.

Who they are: "${answers.who}"
What they help people with: "${answers.helpWith}"
What makes their approach unique: "${answers.uniqueness}"

Write one concise creator vision message (2-3 sentences, under 280 characters) that captures their core idea — the north star everything they create should support. Write in first person or direct address as fits the voice. Be specific, not generic.

Return JSON only: { "message": "..." }`;
}

export async function POST(request: Request) {
  let body: GenerateMessageBody;
  try {
    body = (await request.json()) as GenerateMessageBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const who = body.who?.trim();
  const helpWith = body.helpWith?.trim();
  const uniqueness = body.uniqueness?.trim();

  if (!who || !helpWith || !uniqueness) {
    return NextResponse.json(
      { error: "Please answer all questions." },
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
          content: buildPrompt({ who, helpWith, uniqueness }),
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

    const parsed = JSON.parse(content) as GenerateMessageResponse;
    const message = typeof parsed.message === "string" ? parsed.message.trim() : "";

    if (!message) {
      return NextResponse.json(
        { error: "Could not parse message from AI response." },
        { status: 502 },
      );
    }

    return NextResponse.json({ message });
  } catch (error) {
    const messageText =
      error instanceof Error ? error.message : "Failed to generate message.";
    return NextResponse.json({ error: messageText }, { status: 502 });
  }
}
