import OpenAI from "openai";
import { NextResponse } from "next/server";

type GenerateSkillsBody = {
  strongestCapabilities?: string;
  toolsAndMethods?: string;
  creativeOrCommunication?: string;
  problemSolvingStrength?: string;
  mindsetAndEdge?: string;
  message?: string;
  contentPillars?: string[];
  frameworkLabels?: Record<string, string>;
  existingSkills?: string[];
};

type GenerateSkillsResponse = {
  skills: string[];
};

function buildPrompt(body: {
  strongestCapabilities: string;
  toolsAndMethods: string;
  creativeOrCommunication: string;
  problemSolvingStrength: string;
  mindsetAndEdge: string;
  message: string;
  contentPillars: string[];
  frameworkLabels: Record<string, string>;
  existingSkills?: string[];
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
  if (body.existingSkills && body.existingSkills.length > 0) {
    contextParts.push(
      `Existing skills (refine or replace weak ones): ${JSON.stringify(body.existingSkills)}`,
    );
  }

  const answers = [
    body.strongestCapabilities && `Strongest capabilities: "${body.strongestCapabilities}"`,
    body.toolsAndMethods && `Tools and methods: "${body.toolsAndMethods}"`,
    body.creativeOrCommunication &&
      `Creative or communication style: "${body.creativeOrCommunication}"`,
    body.problemSolvingStrength && `Problem-solving strength: "${body.problemSolvingStrength}"`,
    body.mindsetAndEdge && `Mindset and edge: "${body.mindsetAndEdge}"`,
  ]
    .filter(Boolean)
    .join("\n");

  return `You are a brand strategist helping a creator articulate skills for their Uniqueness / Your Truth board — short cards of concrete capabilities any creator can claim, not corporate buzzwords.

${contextParts.length > 0 ? `${contextParts.join("\n")}\n\n` : ""}Creator answers:
${answers}

Generate 5-6 concise skill statements (2-10 words each). Each card should name a real capability, tool, medium, or working edge — specific and actionable.

Examples:
- "Explaining hard topics in plain language"
- "Short-form video and newsletter writing"
- "Untangling messy processes for teams"
- "Notion planning and AI-assisted drafting"
- "Calm under pressure on tight deadlines"

Avoid generic traits like "hard worker" or fluffy buzzwords. Each item should feel like a card on a vision board.

Return JSON only: { "skills": ["...", "..."] }`;
}

export async function POST(request: Request) {
  let body: GenerateSkillsBody;
  try {
    body = (await request.json()) as GenerateSkillsBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const answers = {
    strongestCapabilities: body.strongestCapabilities?.trim() ?? "",
    toolsAndMethods: body.toolsAndMethods?.trim() ?? "",
    creativeOrCommunication: body.creativeOrCommunication?.trim() ?? "",
    problemSolvingStrength: body.problemSolvingStrength?.trim() ?? "",
    mindsetAndEdge: body.mindsetAndEdge?.trim() ?? "",
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
            existingSkills: body.existingSkills,
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

    const parsed = JSON.parse(content) as GenerateSkillsResponse;
    const skills = Array.isArray(parsed.skills)
      ? parsed.skills
          .filter((item): item is string => typeof item === "string")
          .map((item) => item.trim())
          .filter((item) => item.length > 0)
      : [];

    if (skills.length === 0) {
      return NextResponse.json(
        { error: "Could not parse skills from AI response." },
        { status: 502 },
      );
    }

    return NextResponse.json({ skills });
  } catch (error) {
    const messageText =
      error instanceof Error ? error.message : "Failed to generate skills.";
    return NextResponse.json({ error: messageText }, { status: 502 });
  }
}
