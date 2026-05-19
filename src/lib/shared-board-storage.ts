import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import type { CreatorVision } from "@/lib/vision-store";

const DATA_DIR = path.join(process.cwd(), "data", "shared-boards");

const SHARE_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type SharedBoardRecord = {
  vision: CreatorVision;
  createdAt: number;
};

function isValidShareId(id: string): boolean {
  return SHARE_ID_PATTERN.test(id);
}

export async function saveSharedBoard(vision: CreatorVision): Promise<string> {
  await mkdir(DATA_DIR, { recursive: true });
  const id = crypto.randomUUID();
  const record: SharedBoardRecord = {
    vision: { ...vision, updatedAt: Date.now() },
    createdAt: Date.now(),
  };
  await writeFile(
    path.join(DATA_DIR, `${id}.json`),
    JSON.stringify(record),
    "utf-8",
  );
  return id;
}

export async function loadSharedBoard(id: string): Promise<CreatorVision | null> {
  if (!isValidShareId(id)) {
    return null;
  }

  try {
    const raw = await readFile(path.join(DATA_DIR, `${id}.json`), "utf-8");
    const parsed = JSON.parse(raw) as SharedBoardRecord;
    if (!parsed?.vision || typeof parsed.vision !== "object") {
      return null;
    }
    return parsed.vision;
  } catch {
    return null;
  }
}
