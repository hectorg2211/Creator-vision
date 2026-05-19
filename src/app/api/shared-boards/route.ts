import { NextResponse } from "next/server";
import { saveSharedBoard } from "@/lib/shared-board-storage";
import type { CreatorVision } from "@/lib/vision-store";

const MAX_BODY_BYTES = 2 * 1024 * 1024;

function isCreatorVision(value: unknown): value is CreatorVision {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as CreatorVision;
  return (
    typeof candidate.message === "string" &&
    Array.isArray(candidate.pillars) &&
    Array.isArray(candidate.connections)
  );
}

export async function POST(request: Request) {
  const contentLength = request.headers.get("content-length");
  if (contentLength && Number(contentLength) > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Board data is too large to share." }, { status: 413 });
  }

  let body: { vision?: unknown };
  try {
    body = (await request.json()) as { vision?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!isCreatorVision(body.vision)) {
    return NextResponse.json({ error: "Invalid board data." }, { status: 400 });
  }

  try {
    const id = await saveSharedBoard(body.vision);
    return NextResponse.json({ id });
  } catch {
    return NextResponse.json(
      { error: "Could not save shared board. Try again later." },
      { status: 500 },
    );
  }
}
