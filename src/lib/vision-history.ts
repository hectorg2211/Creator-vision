import type { CreatorVision } from "@/lib/vision-store";

export const MAX_HISTORY_ENTRIES = 50;

export type VisionHistoryStacks = {
  past: CreatorVision[];
  future: CreatorVision[];
};

export function createVisionHistoryStacks(): VisionHistoryStacks {
  return { past: [], future: [] };
}

export function cloneVision(vision: CreatorVision): CreatorVision {
  return JSON.parse(JSON.stringify(vision)) as CreatorVision;
}

export function visionsEqual(a: CreatorVision, b: CreatorVision): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function pushVisionHistory(
  stacks: VisionHistoryStacks,
  snapshot: CreatorVision,
): VisionHistoryStacks {
  const past = [...stacks.past, cloneVision(snapshot)];
  if (past.length > MAX_HISTORY_ENTRIES) {
    past.shift();
  }

  return { past, future: [] };
}

export function undoVision(
  stacks: VisionHistoryStacks,
  current: CreatorVision,
): { stacks: VisionHistoryStacks; vision: CreatorVision } | null {
  if (stacks.past.length === 0) {
    return null;
  }

  const past = [...stacks.past];
  const previous = past.pop()!;
  const future = [cloneVision(current), ...stacks.future];

  return {
    stacks: { past, future },
    vision: previous,
  };
}

export function redoVision(
  stacks: VisionHistoryStacks,
  current: CreatorVision,
): { stacks: VisionHistoryStacks; vision: CreatorVision } | null {
  if (stacks.future.length === 0) {
    return null;
  }

  const future = [...stacks.future];
  const next = future.shift()!;
  const past = [...stacks.past, cloneVision(current)];

  return {
    stacks: { past, future },
    vision: next,
  };
}
