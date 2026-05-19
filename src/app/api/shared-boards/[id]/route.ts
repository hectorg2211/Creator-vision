import { NextResponse } from "next/server";
import { loadSharedBoard } from "@/lib/shared-board-storage";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const vision = await loadSharedBoard(id);

  if (!vision) {
    return NextResponse.json({ error: "Shared board not found." }, { status: 404 });
  }

  return NextResponse.json({ vision });
}
