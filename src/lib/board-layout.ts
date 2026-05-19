import {
  AUDIENCE_FRAMEWORK_CARD_MIN_HEIGHT,
  BOARD_GRID_SIZE,
  getMessageBoxCardDisplayX,
  getMessageBoxExportBounds,
  MESSAGE_BOX_MIN_HEIGHT,
  MESSAGE_BOX_WIDTH,
  PILLAR_CARD_HEIGHT,
  PILLAR_CARD_WIDTH,
  rectsIntersect,
  getAudienceFrameworkAnchorSize,
  getFrameworkCardBounds,
  getPillarBounds,
  type BoardRect,
} from "@/lib/board-geometry";
import type { Pillar } from "@/lib/vision-store";

/** Bump when canonical framework positions change — triggers migration on load. */
export const BOARD_LAYOUT_VERSION = 6;

/** Standard gap between framework cards and rows (matches board grid). */
export const BOARD_LAYOUT_GAP = BOARD_GRID_SIZE;

const W = PILLAR_CARD_WIDTH;
const H = PILLAR_CARD_HEIGHT;
const FOOTER_H = AUDIENCE_FRAMEWORK_CARD_MIN_HEIGHT;
const G = BOARD_LAYOUT_GAP;

/** Left edge of the top framework row (WHAT column). */
const COL0_X = G;
/** Default message card x under WHAT (includes left action strip clearance). */
const DEFAULT_MESSAGE_CARD_X = getMessageBoxCardDisplayX({
  x: COL0_X + (W - MESSAGE_BOX_WIDTH) / 2,
  y: 0,
});
/** WHO+ must clear the full message widget (action column + 280px card). */
const COL1_X = DEFAULT_MESSAGE_CARD_X + MESSAGE_BOX_WIDTH + G;

/** Four footer cards in a row (PAIN…SKILL, monetization categories). */
const FOUR_CARD_ROW_WIDTH = W * 4 + G * 3;

/** Right edge of Demographic + Psychographic row under WHO. */
const WHO_SUBTREE_RIGHT = COL1_X + W * 2 + G;

/** PAIN/PASSION/EXPERIENCE/SKILL row — 24px past Psychographic. */
const UNIQUENESS_FOUR_ROW_MIN_LEFT = WHO_SUBTREE_RIGHT + G;
/** Monetization category row — 24px past uniqueness four-row. */
const MONETIZATION_FOUR_ROW_MIN_LEFT =
  UNIQUENESS_FOUR_ROW_MIN_LEFT + FOUR_CARD_ROW_WIDTH + G;

/** UNIQUENESS / MONETIZATION columns sized so centered four-rows clear WHO subtree. */
const COL2_X = UNIQUENESS_FOUR_ROW_MIN_LEFT + FOUR_CARD_ROW_WIDTH / 2 - W / 2;
const COL3_X = MONETIZATION_FOUR_ROW_MIN_LEFT + FOUR_CARD_ROW_WIDTH / 2 - W / 2;

const TOP_ROW_LEFT = COL0_X;
const TOP_ROW_RIGHT = COL3_X + W;
const TOP_ROW_CENTER_X = TOP_ROW_LEFT + (TOP_ROW_RIGHT - TOP_ROW_LEFT) / 2;

/** CREATOR VISION — one grid cell from top (was 2 cells / y=48). */
export const BOARD_LAYOUT_VISION_Y = G;
/** Extra breathing room between CREATOR VISION and WHAT/WHO/UNIQUENESS/MONETIZATION. */
const VISION_FRAMEWORK_EXTRA_GAP = G * 3;
export const BOARD_LAYOUT_FRAMEWORK_ROW_Y =
  BOARD_LAYOUT_VISION_Y + H + G + VISION_FRAMEWORK_EXTRA_GAP;
export const BOARD_LAYOUT_ROW2_Y = BOARD_LAYOUT_FRAMEWORK_ROW_Y + H + G;
/** Demographic + Psychographic side-by-side row under AVATAR. */
export const BOARD_LAYOUT_WHO_ROW3_Y = BOARD_LAYOUT_ROW2_Y + H + G;
export const BOARD_LAYOUT_UNIQUENESS_FOUR_ROW_Y =
  BOARD_LAYOUT_WHO_ROW3_Y + FOOTER_H + G;
export const BOARD_LAYOUT_MONETIZATION_FOUR_ROW_Y =
  BOARD_LAYOUT_UNIQUENESS_FOUR_ROW_Y + FOOTER_H + G;

const UNIQUENESS_FOUR_ROW_START_X = UNIQUENESS_FOUR_ROW_MIN_LEFT;

/** Demographic left, Psychographic right (24px gap, 176px cards). */
const WHO_DEMOGRAPHIC_X = COL1_X;
const WHO_PSYCHOGRAPHIC_X = COL1_X + W + G;

const MONETIZATION_FOUR_ROW_START_X = MONETIZATION_FOUR_ROW_MIN_LEFT;

export type FrameworkCardLayoutEntry = {
  id: string;
  label: string;
  x: number;
  y: number;
};

/** Canonical (x, y) for every static framework card — computed from anchors. */
export const CANONICAL_FRAMEWORK_LAYOUT: readonly FrameworkCardLayoutEntry[] = [
  {
    id: "creator-vision-card",
    label: "CREATOR VISION",
    x: TOP_ROW_CENTER_X - W / 2,
    y: BOARD_LAYOUT_VISION_Y,
  },
  { id: "framework-what", label: "WHAT", x: COL0_X, y: BOARD_LAYOUT_FRAMEWORK_ROW_Y },
  { id: "framework-who", label: "WHO", x: COL1_X, y: BOARD_LAYOUT_FRAMEWORK_ROW_Y },
  {
    id: "framework-uniqueness",
    label: "UNIQUENESS",
    x: COL2_X,
    y: BOARD_LAYOUT_FRAMEWORK_ROW_Y,
  },
  {
    id: "framework-monetization",
    label: "MONETIZATION",
    x: COL3_X,
    y: BOARD_LAYOUT_FRAMEWORK_ROW_Y,
  },
  { id: "framework-avatar", label: "AVATAR", x: COL1_X, y: BOARD_LAYOUT_ROW2_Y },
  {
    id: "framework-demographic",
    label: "Demographic",
    x: WHO_DEMOGRAPHIC_X,
    y: BOARD_LAYOUT_WHO_ROW3_Y,
  },
  {
    id: "framework-psychographic",
    label: "Psychographic",
    x: WHO_PSYCHOGRAPHIC_X,
    y: BOARD_LAYOUT_WHO_ROW3_Y,
  },
  {
    id: "framework-your-truth",
    label: "YOUR TRUTH",
    x: COL2_X,
    y: BOARD_LAYOUT_ROW2_Y,
  },
  {
    id: "framework-ecosystem",
    label: "ECOSYSTEM",
    x: COL3_X,
    y: BOARD_LAYOUT_ROW2_Y,
  },
  {
    id: "framework-pain",
    label: "PAIN",
    x: UNIQUENESS_FOUR_ROW_START_X,
    y: BOARD_LAYOUT_UNIQUENESS_FOUR_ROW_Y,
  },
  {
    id: "framework-passion",
    label: "PASSION",
    x: UNIQUENESS_FOUR_ROW_START_X + (W + G),
    y: BOARD_LAYOUT_UNIQUENESS_FOUR_ROW_Y,
  },
  {
    id: "framework-experience",
    label: "EXPERIENCE",
    x: UNIQUENESS_FOUR_ROW_START_X + (W + G) * 2,
    y: BOARD_LAYOUT_UNIQUENESS_FOUR_ROW_Y,
  },
  {
    id: "framework-skill",
    label: "SKILL",
    x: UNIQUENESS_FOUR_ROW_START_X + (W + G) * 3,
    y: BOARD_LAYOUT_UNIQUENESS_FOUR_ROW_Y,
  },
  {
    id: "framework-one-off",
    label: "One-Off",
    x: MONETIZATION_FOUR_ROW_START_X,
    y: BOARD_LAYOUT_MONETIZATION_FOUR_ROW_Y,
  },
  {
    id: "framework-ongoing-content",
    label: "Ongoing content",
    x: MONETIZATION_FOUR_ROW_START_X + (W + G),
    y: BOARD_LAYOUT_MONETIZATION_FOUR_ROW_Y,
  },
  {
    id: "framework-high-value-partners",
    label: "High value partners",
    x: MONETIZATION_FOUR_ROW_START_X + (W + G) * 2,
    y: BOARD_LAYOUT_MONETIZATION_FOUR_ROW_Y,
  },
  {
    id: "framework-reinvest",
    label: "Reinvest",
    x: MONETIZATION_FOUR_ROW_START_X + (W + G) * 3,
    y: BOARD_LAYOUT_MONETIZATION_FOUR_ROW_Y,
  },
] as const;

const FOOTER_FRAMEWORK_IDS = new Set<string>([
  "framework-demographic",
  "framework-psychographic",
  "framework-pain",
  "framework-passion",
  "framework-experience",
  "framework-skill",
  "framework-one-off",
  "framework-ongoing-content",
  "framework-high-value-partners",
  "framework-reinvest",
]);

function getFrameworkCardRect(pillar: Pillar): BoardRect {
  if (FOOTER_FRAMEWORK_IDS.has(pillar.id)) {
    return getPillarBounds(pillar, getAudienceFrameworkAnchorSize(pillar));
  }
  return getFrameworkCardBounds(pillar);
}

/** True when any two framework cards intersect (footer heights included). */
export function hasFrameworkCardsOverlap(pillars: Pillar[]): boolean {
  const frameworkPillars = CANONICAL_FRAMEWORK_LAYOUT.map((entry) => {
    const stored = pillars.find((pillar) => pillar.id === entry.id);
    return (
      stored ?? {
        id: entry.id,
        label: entry.label,
        x: entry.x,
        y: entry.y,
      }
    );
  }).filter((pillar) => pillar.id !== "creator-vision-card");

  for (let index = 0; index < frameworkPillars.length; index += 1) {
    const boundsA = getFrameworkCardRect(frameworkPillars[index]);
    for (let other = index + 1; other < frameworkPillars.length; other += 1) {
      if (rectsIntersect(boundsA, getFrameworkCardRect(frameworkPillars[other]))) {
        return true;
      }
    }
  }

  return false;
}

/** Default message box top-left under WHAT (280px wide, leaves 24px gap before WHO). */
export function getDefaultMessageBoxPosition(whatCard: Pillar): { x: number; y: number } {
  const rawX = whatCard.x + (W - MESSAGE_BOX_WIDTH) / 2;
  const y = whatCard.y + H + G;

  return {
    x: getMessageBoxCardDisplayX({ x: Math.max(0, rawX), y }),
    y,
  };
}

/** Bounding box for initial viewport fit (framework + message). */
export function getDefaultBoardContentBounds(
  pillars: Pillar[],
  messageBox?: { x: number; y: number; width?: number; height?: number } | null,
): BoardRect {
  let left = TOP_ROW_LEFT;
  let top = BOARD_LAYOUT_VISION_Y;
  let right = TOP_ROW_RIGHT;
  let bottom = BOARD_LAYOUT_MONETIZATION_FOUR_ROW_Y + FOOTER_H;

  if (messageBox) {
    const messageHeight = messageBox.height ?? MESSAGE_BOX_MIN_HEIGHT;
    const exportBounds = getMessageBoxExportBounds(messageBox, messageHeight);
    left = Math.min(left, exportBounds.left);
    top = Math.min(top, exportBounds.top);
    right = Math.max(right, exportBounds.right);
    bottom = Math.max(bottom, exportBounds.bottom);
  }

  for (const entry of CANONICAL_FRAMEWORK_LAYOUT) {
    const pillar = pillars.find((item) => item.id === entry.id);
    const x = pillar?.x ?? entry.x;
    const y = pillar?.y ?? entry.y;
    const rect =
      pillar && FOOTER_FRAMEWORK_IDS.has(pillar.id)
        ? getFrameworkCardRect(pillar)
        : getFrameworkCardBounds({ id: entry.id, label: entry.label, x, y });
    left = Math.min(left, rect.left);
    top = Math.min(top, rect.top);
    right = Math.max(right, rect.right);
    bottom = Math.max(bottom, rect.bottom);
  }

  return { left, top, right, bottom };
}
