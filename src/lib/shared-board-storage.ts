import { get, put } from "@vercel/blob";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import type { CreatorVision } from "@/lib/vision-store";

const DATA_DIR = path.join(process.cwd(), "data", "shared-boards");
const BLOB_PREFIX = "shared-boards";
const KV_KEY_PREFIX = "shared-board:";
/** Shared boards expire after 90 days (KV only; Blob has no TTL in this setup). */
const SHARE_TTL_SECONDS = 90 * 24 * 60 * 60;

const SHARE_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type SharedBoardRecord = {
  vision: CreatorVision;
  createdAt: number;
};

export class ShareStorageNotConfiguredError extends Error {
  constructor() {
    super(
      "Share links need storage in production. In Vercel: Storage → Create Blob (or KV) → connect to this app → redeploy.",
    );
    this.name = "ShareStorageNotConfiguredError";
  }
}

type RedisRestConfig = {
  url: string;
  token: string;
};

function hasBlobStorage(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

function getRedisRestConfig(): RedisRestConfig | null {
  const url =
    process.env.KV_REST_API_URL?.trim() || process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token =
    process.env.KV_REST_API_TOKEN?.trim() || process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (!url || !token) {
    return null;
  }

  return { url, token };
}

function isValidShareId(id: string): boolean {
  return SHARE_ID_PATTERN.test(id);
}

function blobPathname(id: string): string {
  return `${BLOB_PREFIX}/${id}.json`;
}

function buildRecord(vision: CreatorVision): SharedBoardRecord {
  return {
    vision: { ...vision, updatedAt: Date.now() },
    createdAt: Date.now(),
  };
}

function parseRecord(raw: string): CreatorVision | null {
  const parsed = JSON.parse(raw) as SharedBoardRecord;
  if (!parsed?.vision || typeof parsed.vision !== "object") {
    return null;
  }
  return parsed.vision;
}

async function saveSharedBoardToBlob(vision: CreatorVision): Promise<string> {
  const id = crypto.randomUUID();
  const record = buildRecord(vision);

  await put(blobPathname(id), JSON.stringify(record), {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
  });

  return id;
}

async function loadSharedBoardFromBlob(id: string): Promise<CreatorVision | null> {
  try {
    const result = await get(blobPathname(id), { access: "private" });

    if (!result?.stream) {
      return null;
    }

    const raw = await new Response(result.stream).text();
    return parseRecord(raw);
  } catch {
    return null;
  }
}

async function runRedisCommand(
  config: RedisRestConfig,
  command: (string | number)[],
): Promise<unknown> {
  const response = await fetch(config.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
  });

  const payload = (await response.json()) as { result?: unknown; error?: string };

  if (!response.ok || payload.error) {
    throw new Error(payload.error ?? `Redis request failed (${response.status}).`);
  }

  return payload.result;
}

async function saveSharedBoardToKv(
  vision: CreatorVision,
  config: RedisRestConfig,
): Promise<string> {
  const id = crypto.randomUUID();
  const record = buildRecord(vision);

  await runRedisCommand(config, [
    "SET",
    `${KV_KEY_PREFIX}${id}`,
    JSON.stringify(record),
    "EX",
    SHARE_TTL_SECONDS,
  ]);

  return id;
}

async function loadSharedBoardFromKv(
  id: string,
  config: RedisRestConfig,
): Promise<CreatorVision | null> {
  const result = await runRedisCommand(config, ["GET", `${KV_KEY_PREFIX}${id}`]);

  if (result === null || result === undefined) {
    return null;
  }

  const raw = typeof result === "string" ? result : JSON.stringify(result);
  return parseRecord(raw);
}

async function saveSharedBoardToFilesystem(vision: CreatorVision): Promise<string> {
  await mkdir(DATA_DIR, { recursive: true });
  const id = crypto.randomUUID();
  const record = buildRecord(vision);
  await writeFile(
    path.join(DATA_DIR, `${id}.json`),
    JSON.stringify(record),
    "utf-8",
  );
  return id;
}

async function loadSharedBoardFromFilesystem(id: string): Promise<CreatorVision | null> {
  try {
    const raw = await readFile(path.join(DATA_DIR, `${id}.json`), "utf-8");
    return parseRecord(raw);
  } catch {
    return null;
  }
}

export async function saveSharedBoard(vision: CreatorVision): Promise<string> {
  if (hasBlobStorage()) {
    return saveSharedBoardToBlob(vision);
  }

  const redis = getRedisRestConfig();
  if (redis) {
    return saveSharedBoardToKv(vision, redis);
  }

  if (process.env.VERCEL) {
    throw new ShareStorageNotConfiguredError();
  }

  return saveSharedBoardToFilesystem(vision);
}

export async function loadSharedBoard(id: string): Promise<CreatorVision | null> {
  if (!isValidShareId(id)) {
    return null;
  }

  if (hasBlobStorage()) {
    return loadSharedBoardFromBlob(id);
  }

  const redis = getRedisRestConfig();
  if (redis) {
    try {
      return await loadSharedBoardFromKv(id, redis);
    } catch {
      return null;
    }
  }

  if (process.env.VERCEL) {
    return null;
  }

  return loadSharedBoardFromFilesystem(id);
}
