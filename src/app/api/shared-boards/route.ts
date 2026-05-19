import { NextResponse } from "next/server";
import {
  saveSharedBoard,
  ShareStorageNotConfiguredError,
} from "@/lib/shared-board-storage";
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
  } catch (error) {
    if (error instanceof ShareStorageNotConfiguredError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    const message =
      error instanceof Error ? error.message : "Could not save shared board. Try again later.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
