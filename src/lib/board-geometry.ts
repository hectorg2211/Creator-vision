import type { Connection, ConnectionAnchor, Pillar } from "@/lib/vision-store";

export const PILLAR_CARD_WIDTH = 176;
export const PILLAR_CARD_HEIGHT = 88;
/** Min height for Demographic/Psychographic framework cards with action buttons. */
export const AUDIENCE_FRAMEWORK_CARD_MIN_HEIGHT = 120;
/** Board dot grid size — cards snap to this on drop. */
export const BOARD_GRID_SIZE = 24;
export const MESSAGE_BOX_GAP = BOARD_GRID_SIZE;
export const MESSAGE_BOX_WIDTH = 280;
/** Left action column beside the message card (matches MessageBox w-[7.5rem]). */
export const MESSAGE_ACTION_COLUMN_WIDTH = 120;
/** Gap between action column and message card (matches MessageBox 0.75rem). */
export const MESSAGE_ACTION_COLUMN_GAP = 12;
/** Combined width of the left action strip (column + gap). */
export const MESSAGE_BOX_ACTION_STRIP_WIDTH =
  MESSAGE_ACTION_COLUMN_WIDTH + MESSAGE_ACTION_COLUMN_GAP;
/** Minimum left edge for message box placement on the board. */
export const MESSAGE_BOX_MIN_LEFT = 8;
/** Minimum card x so the left action strip stays inside the board viewport. */
export const MESSAGE_BOX_MIN_CARD_LEFT =
  MESSAGE_BOX_MIN_LEFT + MESSAGE_BOX_ACTION_STRIP_WIDTH;
/** Minimum layout height for empty/placeholder message box (content can grow taller). */
export const MESSAGE_BOX_MIN_HEIGHT = 72;
export const MIN_PILLAR_WIDTH = 120;
export const MIN_PILLAR_HEIGHT = 60;
export const MAX_PILLAR_WIDTH = 480;
export const MAX_PILLAR_HEIGHT = 360;
export const CONNECTION_HANDLE_RADIUS = 7;
export const CONNECTION_ARROW_LENGTH = 8;
export const CONNECTION_ARROW_WIDTH = 8;

export type PillarSize = {
  width: number;
  height: number;
};

export const CONNECTION_ANCHORS: ConnectionAnchor[] = [
  "top",
  "right",
  "bottom",
  "left",
];

export function snapToGrid(value: number, gridSize = BOARD_GRID_SIZE): number {
  return Math.round(value / gridSize) * gridSize;
}

export function snapBoardDelta(
  delta: { x: number; y: number },
  gridSize = BOARD_GRID_SIZE,
): { x: number; y: number } {
  return {
    x: snapToGrid(delta.x, gridSize),
    y: snapToGrid(delta.y, gridSize),
  };
}

export function snapBoardPoint(
  point: { x: number; y: number },
  gridSize = BOARD_GRID_SIZE,
): { x: number; y: number } {
  return {
    x: snapToGrid(point.x, gridSize),
    y: snapToGrid(point.y, gridSize),
  };
}

export function getAnchorPoint(
  pillar: Pillar,
  anchor: ConnectionAnchor,
  size: PillarSize = { width: PILLAR_CARD_WIDTH, height: PILLAR_CARD_HEIGHT },
) {
  switch (anchor) {
    case "top":
      return { x: pillar.x + size.width / 2, y: pillar.y };
    case "right":
      return {
        x: pillar.x + size.width,
        y: pillar.y + size.height / 2,
      };
    case "bottom":
      return {
        x: pillar.x + size.width / 2,
        y: pillar.y + size.height,
      };
    case "left":
      return { x: pillar.x, y: pillar.y + size.height / 2 };
  }
}

export function shortenConnectionEnd(
  from: { x: number; y: number },
  to: { x: number; y: number },
  inset = CONNECTION_ARROW_LENGTH,
): { x: number; y: number } {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy);
  if (len <= inset) {
    return { x: from.x, y: from.y };
  }

  const ux = dx / len;
  const uy = dy / len;
  return { x: to.x - ux * inset, y: to.y - uy * inset };
}

export function getConnectionArrowHeadPath(
  from: { x: number; y: number },
  to: { x: number; y: number },
  arrowLength = CONNECTION_ARROW_LENGTH,
  arrowWidth = CONNECTION_ARROW_WIDTH,
): string {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy);
  if (len < 1e-6) {
    return "";
  }

  const ux = dx / len;
  const uy = dy / len;
  const baseX = to.x - ux * arrowLength;
  const baseY = to.y - uy * arrowLength;
  const halfWidth = arrowWidth / 2;
  const perpX = -uy * halfWidth;
  const perpY = ux * halfWidth;

  return `M ${baseX + perpX},${baseY + perpY} L ${to.x},${to.y} L ${baseX - perpX},${baseY - perpY} Z`;
}

export function getConnectionPoints(
  from: Pillar,
  fromAnchor: ConnectionAnchor,
  to: Pillar,
  toAnchor: ConnectionAnchor,
  fromSize: PillarSize = { width: PILLAR_CARD_WIDTH, height: PILLAR_CARD_HEIGHT },
  toSize: PillarSize = { width: PILLAR_CARD_WIDTH, height: PILLAR_CARD_HEIGHT },
) {
  return {
    from: getAnchorPoint(from, fromAnchor, fromSize),
    to: getAnchorPoint(to, toAnchor, toSize),
  };
}

export function getAnchorOffsetStyles(anchor: ConnectionAnchor) {
  switch (anchor) {
    case "top":
      return { left: "50%", top: 0, transform: "translate(-50%, -50%)" };
    case "right":
      return { left: "100%", top: "50%", transform: "translate(-50%, -50%)" };
    case "left":
      return { left: 0, top: "50%", transform: "translate(-50%, -50%)" };
    case "bottom":
      return { left: "50%", top: "100%", transform: "translate(-50%, -50%)" };
  }
}

export function clampPillarSize(size: PillarSize): PillarSize {
  return {
    width: Math.min(MAX_PILLAR_WIDTH, Math.max(MIN_PILLAR_WIDTH, size.width)),
    height: Math.min(MAX_PILLAR_HEIGHT, Math.max(MIN_PILLAR_HEIGHT, size.height)),
  };
}

export function getPillarSize(pillar: Pillar): PillarSize {
  return clampPillarSize({
    width: pillar.width ?? PILLAR_CARD_WIDTH,
    height: pillar.height ?? PILLAR_CARD_HEIGHT,
  });
}

export function inferDefaultAnchors(
  from: Pillar,
  to: Pillar,
  fromSize: PillarSize = getPillarSize(from),
  toSize: PillarSize = getPillarSize(to),
): { fromAnchor: ConnectionAnchor; toAnchor: ConnectionAnchor } {
  const fromCenter = {
    x: from.x + fromSize.width / 2,
    y: from.y + fromSize.height / 2,
  };
  const toCenter = {
    x: to.x + toSize.width / 2,
    y: to.y + toSize.height / 2,
  };
  const dx = toCenter.x - fromCenter.x;
  const dy = toCenter.y - fromCenter.y;

  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0
      ? { fromAnchor: "right", toAnchor: "left" }
      : { fromAnchor: "left", toAnchor: "right" };
  }

  return dy >= 0
    ? { fromAnchor: "bottom", toAnchor: "top" }
    : { fromAnchor: "top", toAnchor: "bottom" };
}

export function getDefaultPillarSize(): PillarSize {
  return { width: PILLAR_CARD_WIDTH, height: PILLAR_CARD_HEIGHT };
}

export type BoardRect = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

export function normalizeRect(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): BoardRect {
  return {
    left: Math.min(x1, x2),
    top: Math.min(y1, y2),
    right: Math.max(x1, x2),
    bottom: Math.max(y1, y2),
  };
}

export function rectsIntersect(a: BoardRect, b: BoardRect): boolean {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

export const BOARD_LAYOUT_POSITION_EPSILON = 4;

export type MessageBoxPosition = {
  x: number;
  y: number;
};

export function getFrameworkCardBounds(pillar: Pillar): BoardRect {
  return getPillarBounds(pillar, getPillarSize(pillar));
}

export function getPillarBounds(
  pillar: Pillar,
  size: PillarSize = getDefaultPillarSize(),
  offset: { x: number; y: number } = { x: 0, y: 0 },
): BoardRect {
  const x = pillar.x + offset.x;
  const y = pillar.y + offset.y;

  return {
    left: x,
    top: y,
    right: x + size.width,
    bottom: y + size.height,
  };
}

export function snapVirtualPillar(pillar: Pillar): Pillar {
  const point = snapBoardPoint({ x: pillar.x, y: pillar.y });
  return { ...pillar, x: point.x, y: point.y };
}

export function getBoxBoundsAt(
  position: MessageBoxPosition,
  size: PillarSize,
): BoardRect {
  return getPillarBounds(
    { id: "", label: "", x: position.x, y: position.y },
    size,
  );
}

export function getMessageBoxCardDisplayX(position: MessageBoxPosition): number {
  return Math.max(MESSAGE_BOX_MIN_CARD_LEFT, position.x);
}

export function getMessageBoxWrapperLeft(cardDisplayX: number): number {
  return cardDisplayX - MESSAGE_BOX_ACTION_STRIP_WIDTH;
}

/** Message card + left action buttons (export bounds extend left of the card). */
export function getMessageBoxExportBounds(
  position: MessageBoxPosition,
  height: number,
): BoardRect {
  const cardDisplayX = getMessageBoxCardDisplayX(position);
  const cardBounds = getBoxBoundsAt(
    { x: cardDisplayX, y: position.y },
    { width: MESSAGE_BOX_WIDTH, height },
  );

  return {
    left: getMessageBoxWrapperLeft(cardDisplayX),
    top: cardBounds.top,
    right: cardBounds.right,
    bottom: cardBounds.bottom,
  };
}

export function storedBoxOverlapsAnyRect(
  position: MessageBoxPosition,
  size: PillarSize,
  rects: BoardRect[],
): boolean {
  const bounds = getBoxBoundsAt(position, size);
  return rects.some((rect) => rectsIntersect(bounds, rect));
}

export function storedPositionNear(
  a: MessageBoxPosition,
  b: MessageBoxPosition,
  epsilon = BOARD_LAYOUT_POSITION_EPSILON,
): boolean {
  return Math.abs(a.x - b.x) <= epsilon && Math.abs(a.y - b.y) <= epsilon;
}

export const PILLAR_BELOW_MESSAGE_GAP = MESSAGE_BOX_GAP;
export const CONTENT_PILLARS_GRID_COLUMNS = 2;
export const CONTENT_PILLARS_GRID_GAP = 8;
export const CONTENT_PILLARS_BOX_HEADER_HEIGHT = 20;

/** Default demographic trait count from AI generation. */
export const DEMOGRAPHIC_TRAIT_COUNT = 5;
export const AUDIENCE_ROW_GAP = 8;
export const AUDIENCE_ROW_CELL_MIN_WIDTH = 112;
export const AUDIENCE_BOX_HORIZONTAL_PADDING = 24;
export const AUDIENCE_BOX_VERTICAL_PADDING = 24;

export type AudienceBoxLayout = "grid" | "row";

export function getContentPillarHeightFromMessageBox(
  messageBox: Pillar,
): number {
  return messageBox.height ?? MESSAGE_BOX_MIN_HEIGHT;
}

/** Legacy vertical gap (stacked layout); used for migration detection only. */
export const PSYCHOGRAPHIC_BOX_STACK_GAP = 12;

/** Horizontal gap between Instagram creators and psychographic traits boxes. */
export const PSYCHOGRAPHIC_BOX_PAIR_GAP = BOARD_GRID_SIZE;

export type PsychographicAudienceBoxPairLayout = {
  creators: MessageBoxPosition & PillarSize;
  traits: (MessageBoxPosition & PillarSize) | null;
};

export function getPsychographicAudienceBoxPairLayout(
  anchorCard: Pillar,
  creatorCount: number,
  traitCount: number,
  cellHeight: number,
): PsychographicAudienceBoxPairLayout {
  const layoutCount = Math.max(creatorCount, 1);
  const creatorsSize = getContentPillarsBoxDimensions(layoutCount, cellHeight);
  const cardSize = getAudienceFrameworkAnchorSize(anchorCard);
  const rowY = anchorCard.y + cardSize.height + AUDIENCE_BOX_BELOW_CARD_GAP;

  if (traitCount <= 0) {
    const creators = snapBoardPoint({
      x: anchorCard.x + (cardSize.width - creatorsSize.width) / 2,
      y: rowY,
    });
    return {
      creators: { ...creators, ...creatorsSize },
      traits: null,
    };
  }

  const traitsSize = getContentPillarsBoxDimensions(traitCount, cellHeight);
  const pairWidth =
    creatorsSize.width + PSYCHOGRAPHIC_BOX_PAIR_GAP + traitsSize.width;
  const pairStartX = anchorCard.x + (cardSize.width - pairWidth) / 2;
  const creators = snapBoardPoint({ x: pairStartX, y: rowY });
  const traits = snapBoardPoint({
    x: pairStartX + creatorsSize.width + PSYCHOGRAPHIC_BOX_PAIR_GAP,
    y: rowY,
  });

  return {
    creators: { ...creators, ...creatorsSize },
    traits: { ...traits, ...traitsSize },
  };
}

export function isPsychographicBoxLayoutStale(
  creatorsPosition: MessageBoxPosition,
  creatorsSize: PillarSize,
  traitsPosition: MessageBoxPosition,
  traitsSize: PillarSize,
): boolean {
  if (
    rectsIntersect(
      getBoxBoundsAt(creatorsPosition, creatorsSize),
      getBoxBoundsAt(traitsPosition, traitsSize),
    )
  ) {
    return true;
  }

  const stackedTraitsY =
    creatorsPosition.y + creatorsSize.height + PSYCHOGRAPHIC_BOX_STACK_GAP;
  if (
    storedPositionNear(traitsPosition, {
      x: creatorsPosition.x,
      y: stackedTraitsY,
    })
  ) {
    return true;
  }

  const traitsBelowCreators =
    traitsPosition.y >=
    creatorsPosition.y + creatorsSize.height - BOARD_LAYOUT_POSITION_EPSILON;
  const traitsBesideCreators =
    traitsPosition.x >=
    creatorsPosition.x + creatorsSize.width - BOARD_LAYOUT_POSITION_EPSILON;

  return traitsBelowCreators && !traitsBesideCreators;
}

export function migratePsychographicBoxPositions(
  anchorCard: Pillar,
  creatorCount: number,
  traitCount: number,
  cellHeight: number,
  instagramCreatorsBoxPosition?: ContentPillarsBoxPosition | null,
  psychographicBoxPosition?: ContentPillarsBoxPosition | null,
): {
  instagramCreatorsBoxPosition?: ContentPillarsBoxPosition;
  psychographicBoxPosition?: ContentPillarsBoxPosition;
} | null {
  if (traitCount <= 0) {
    return null;
  }

  const pair = getPsychographicAudienceBoxPairLayout(
    anchorCard,
    creatorCount,
    traitCount,
    cellHeight,
  );
  if (!pair.traits) {
    return null;
  }

  const creatorsSize: PillarSize = {
    width: pair.creators.width,
    height: pair.creators.height,
  };
  const traitsSize: PillarSize = {
    width: pair.traits.width,
    height: pair.traits.height,
  };

  const shouldReset =
    !instagramCreatorsBoxPosition ||
    !psychographicBoxPosition ||
    isPsychographicBoxLayoutStale(
      instagramCreatorsBoxPosition,
      creatorsSize,
      psychographicBoxPosition,
      traitsSize,
    );

  if (!shouldReset) {
    return null;
  }

  return {
    instagramCreatorsBoxPosition: {
      x: pair.creators.x,
      y: pair.creators.y,
    },
    psychographicBoxPosition: {
      x: pair.traits.x,
      y: pair.traits.y,
    },
  };
}

/** Minimum height per grid cell; cells may grow taller when labels wrap. */
export function getContentPillarsBoxDimensions(
  pillarCount: number,
  cellMinHeight: number,
): PillarSize {
  const columns = CONTENT_PILLARS_GRID_COLUMNS;
  const rows = Math.max(1, Math.ceil(Math.max(pillarCount, 1) / columns));
  const gridHeight =
    rows * cellMinHeight + (rows - 1) * CONTENT_PILLARS_GRID_GAP;
  const verticalPadding = 24;
  const headerBlock = CONTENT_PILLARS_BOX_HEADER_HEIGHT + CONTENT_PILLARS_GRID_GAP;

  return {
    width: MESSAGE_BOX_WIDTH,
    height: verticalPadding + headerBlock + gridHeight,
  };
}

export function getAudienceFrameworkAnchorSize(anchorCard: Pillar): PillarSize {
  const size = getPillarSize(anchorCard);
  return {
    width: size.width,
    height: Math.max(size.height, AUDIENCE_FRAMEWORK_CARD_MIN_HEIGHT),
  };
}

export function getAudienceRowBoxDimensions(
  pillarCount: number,
  cellHeight: number,
  includeHeader = true,
): PillarSize {
  const count = Math.max(pillarCount, 1);
  const gridWidth =
    count * AUDIENCE_ROW_CELL_MIN_WIDTH + (count - 1) * AUDIENCE_ROW_GAP;

  if (!includeHeader) {
    return {
      width: gridWidth,
      height: cellHeight,
    };
  }

  const headerBlock = CONTENT_PILLARS_BOX_HEADER_HEIGHT + CONTENT_PILLARS_GRID_GAP;

  return {
    width: AUDIENCE_BOX_HORIZONTAL_PADDING + gridWidth,
    height:
      AUDIENCE_BOX_VERTICAL_PADDING + headerBlock + cellHeight,
  };
}

export function getAudienceBoxDimensions(
  pillarCount: number,
  cellHeight: number,
  layout: AudienceBoxLayout = "grid",
  includeHeader = true,
): PillarSize {
  if (layout === "row") {
    return getAudienceRowBoxDimensions(pillarCount, cellHeight, includeHeader);
  }

  return getContentPillarsBoxDimensions(pillarCount, cellHeight);
}

export function getContentPillarsBoxVirtualPillar(
  messageBox: Pillar,
  contentPillarBoxId: string,
  pillarCount: number,
): Pillar {
  const cellHeight = getContentPillarHeightFromMessageBox(messageBox);
  const size = getContentPillarsBoxDimensions(pillarCount, cellHeight);
  const messageHeight = messageBox.height ?? MESSAGE_BOX_MIN_HEIGHT;

  return snapVirtualPillar({
    id: contentPillarBoxId,
    label: "Content Pillars",
    x: messageBox.x,
    y: messageBox.y + messageHeight + PILLAR_BELOW_MESSAGE_GAP,
    width: size.width,
    height: size.height,
  });
}

export type ContentPillarsBoxPosition = MessageBoxPosition;

export function isValidContentPillarsBoxPosition(
  storedPosition: MessageBoxPosition,
  messageBox: Pillar,
  pillarCount: number,
  cellHeight: number,
  obstacleRects: BoardRect[],
): boolean {
  const size = getContentPillarsBoxDimensions(pillarCount, cellHeight);
  const messageHeight = messageBox.height ?? MESSAGE_BOX_MIN_HEIGHT;
  const minY = messageBox.y + messageHeight + PILLAR_BELOW_MESSAGE_GAP;

  if (storedPosition.y < minY - BOARD_LAYOUT_POSITION_EPSILON) {
    return false;
  }

  if (storedBoxOverlapsAnyRect(storedPosition, size, obstacleRects)) {
    return false;
  }

  return true;
}

export function resolveContentPillarsBoxPillar(
  messageBox: Pillar,
  contentPillarsBoxId: string,
  pillarCount: number,
  storedPosition?: ContentPillarsBoxPosition | null,
  obstacleRects: BoardRect[] = [],
): Pillar {
  const defaultPillar = getContentPillarsBoxVirtualPillar(
    messageBox,
    contentPillarsBoxId,
    pillarCount,
  );

  if (!storedPosition) {
    return defaultPillar;
  }

  const snapped = snapBoardPoint(storedPosition);
  const cellHeight = getContentPillarHeightFromMessageBox(messageBox);
  if (
    !isValidContentPillarsBoxPosition(
      snapped,
      messageBox,
      pillarCount,
      cellHeight,
      obstacleRects,
    )
  ) {
    return defaultPillar;
  }

  return snapVirtualPillar({
    ...defaultPillar,
    x: snapped.x,
    y: snapped.y,
  });
}

export const AUDIENCE_BOX_BELOW_CARD_GAP = MESSAGE_BOX_GAP;

export function getAudienceBoxVirtualPillar(
  anchorCard: Pillar,
  boxId: string,
  pillarCount: number,
  cellHeight: number,
  layout: AudienceBoxLayout = "grid",
  includeHeader = true,
): Pillar {
  const size = getAudienceBoxDimensions(
    pillarCount,
    cellHeight,
    layout,
    includeHeader,
  );
  const cardSize = getAudienceFrameworkAnchorSize(anchorCard);

  return snapVirtualPillar({
    id: boxId,
    label: boxId,
    x: anchorCard.x + (cardSize.width - size.width) / 2,
    y: anchorCard.y + cardSize.height + AUDIENCE_BOX_BELOW_CARD_GAP,
    width: size.width,
    height: size.height,
  });
}

export function isValidAudienceBoxPosition(
  storedPosition: MessageBoxPosition,
  anchorCard: Pillar,
  pillarCount: number,
  cellHeight: number,
  obstacleRects: BoardRect[],
  layout: AudienceBoxLayout = "grid",
  includeHeader = true,
): boolean {
  const anchorSize = getAudienceFrameworkAnchorSize(anchorCard);
  const minY = anchorCard.y + anchorSize.height + AUDIENCE_BOX_BELOW_CARD_GAP;
  const size = getAudienceBoxDimensions(
    pillarCount,
    cellHeight,
    layout,
    includeHeader,
  );

  if (storedPosition.y < minY - BOARD_LAYOUT_POSITION_EPSILON) {
    return false;
  }

  if (storedBoxOverlapsAnyRect(storedPosition, size, obstacleRects)) {
    return false;
  }

  return true;
}

export function getInstagramCreatorsBoxVirtualPillar(
  anchorCard: Pillar,
  boxId: string,
  creatorCount: number,
  cellHeight: number,
  traitCount = 0,
): Pillar {
  const pair = getPsychographicAudienceBoxPairLayout(
    anchorCard,
    creatorCount,
    traitCount,
    cellHeight,
  );

  return snapVirtualPillar({
    id: boxId,
    label: boxId,
    x: pair.creators.x,
    y: pair.creators.y,
    width: pair.creators.width,
    height: pair.creators.height,
  });
}

export function isValidInstagramCreatorsBoxPosition(
  storedPosition: MessageBoxPosition,
  anchorCard: Pillar,
  creatorCount: number,
  cellHeight: number,
  obstacleRects: BoardRect[],
): boolean {
  const layoutCount = Math.max(creatorCount, 1);
  const size = getContentPillarsBoxDimensions(layoutCount, cellHeight);
  const cardSize = getAudienceFrameworkAnchorSize(anchorCard);
  const minY = anchorCard.y + cardSize.height + AUDIENCE_BOX_BELOW_CARD_GAP;

  if (storedPosition.y < minY - BOARD_LAYOUT_POSITION_EPSILON) {
    return false;
  }

  if (storedBoxOverlapsAnyRect(storedPosition, size, obstacleRects)) {
    return false;
  }

  return true;
}

export function resolveInstagramCreatorsBoxPillar(
  anchorCard: Pillar,
  boxId: string,
  creatorCount: number,
  cellHeight: number,
  traitCount: number,
  storedPosition?: ContentPillarsBoxPosition | null,
  obstacleRects: BoardRect[] = [],
): Pillar {
  const defaultPillar = getInstagramCreatorsBoxVirtualPillar(
    anchorCard,
    boxId,
    creatorCount,
    cellHeight,
    traitCount,
  );

  if (!storedPosition) {
    return defaultPillar;
  }

  const snapped = snapBoardPoint(storedPosition);
  if (
    !isValidInstagramCreatorsBoxPosition(
      snapped,
      anchorCard,
      creatorCount,
      cellHeight,
      obstacleRects,
    )
  ) {
    return defaultPillar;
  }

  return snapVirtualPillar({
    ...defaultPillar,
    x: snapped.x,
    y: snapped.y,
  });
}

export function getPsychographicTraitsBoxVirtualPillar(
  anchorCard: Pillar,
  boxId: string,
  traitCount: number,
  cellHeight: number,
  creatorsBox: Pillar,
): Pillar {
  const size = getContentPillarsBoxDimensions(traitCount, cellHeight);
  const creatorsWidth = creatorsBox.width ?? size.width;

  return snapVirtualPillar({
    id: boxId,
    label: boxId,
    x: creatorsBox.x + creatorsWidth + PSYCHOGRAPHIC_BOX_PAIR_GAP,
    y: creatorsBox.y,
    width: size.width,
    height: size.height,
  });
}

export function isValidPsychographicTraitsBoxPosition(
  storedPosition: MessageBoxPosition,
  anchorCard: Pillar,
  traitCount: number,
  cellHeight: number,
  creatorsBox: Pillar,
  obstacleRects: BoardRect[],
): boolean {
  const size = getContentPillarsBoxDimensions(traitCount, cellHeight);
  const anchorSize = getAudienceFrameworkAnchorSize(anchorCard);
  const minY = anchorCard.y + anchorSize.height + AUDIENCE_BOX_BELOW_CARD_GAP;

  if (storedPosition.y < minY - BOARD_LAYOUT_POSITION_EPSILON) {
    return false;
  }

  if (storedBoxOverlapsAnyRect(storedPosition, size, obstacleRects)) {
    return false;
  }

  const creatorsBounds = getPillarBounds(creatorsBox, {
    width: creatorsBox.width ?? size.width,
    height: creatorsBox.height ?? cellHeight,
  });
  if (rectsIntersect(getBoxBoundsAt(storedPosition, size), creatorsBounds)) {
    return false;
  }

  return true;
}

export function resolvePsychographicTraitsBoxPillar(
  anchorCard: Pillar,
  boxId: string,
  traitCount: number,
  cellHeight: number,
  creatorsBox: Pillar,
  storedPosition?: ContentPillarsBoxPosition | null,
  obstacleRects: BoardRect[] = [],
): Pillar {
  const defaultPillar = getPsychographicTraitsBoxVirtualPillar(
    anchorCard,
    boxId,
    traitCount,
    cellHeight,
    creatorsBox,
  );

  if (!storedPosition) {
    return defaultPillar;
  }

  const snapped = snapBoardPoint(storedPosition);
  if (
    !isValidPsychographicTraitsBoxPosition(
      snapped,
      anchorCard,
      traitCount,
      cellHeight,
      creatorsBox,
      obstacleRects,
    )
  ) {
    return defaultPillar;
  }

  return snapVirtualPillar({
    ...defaultPillar,
    x: snapped.x,
    y: snapped.y,
  });
}

/** Resolve a grid box under a UNIQUENESS framework card (pain, passion, experience, skill). */
export function resolveUniquenessBoxPillar(
  anchorCard: Pillar,
  boxId: string,
  pillarCount: number,
  cellHeight: number,
  storedPosition?: ContentPillarsBoxPosition | null,
  obstacleRects: BoardRect[] = [],
): Pillar {
  return resolveAudienceBoxPillar(
    anchorCard,
    boxId,
    pillarCount,
    cellHeight,
    storedPosition,
    "grid",
    true,
    obstacleRects,
  );
}

export function resolveAudienceBoxPillar(
  anchorCard: Pillar,
  boxId: string,
  pillarCount: number,
  cellHeight: number,
  storedPosition?: ContentPillarsBoxPosition | null,
  layout: AudienceBoxLayout = "grid",
  includeHeader = true,
  obstacleRects: BoardRect[] = [],
): Pillar {
  const defaultPillar = getAudienceBoxVirtualPillar(
    anchorCard,
    boxId,
    pillarCount,
    cellHeight,
    layout,
    includeHeader,
  );

  if (!storedPosition) {
    return defaultPillar;
  }

  const snapped = snapBoardPoint(storedPosition);
  if (
    !isValidAudienceBoxPosition(
      snapped,
      anchorCard,
      pillarCount,
      cellHeight,
      obstacleRects,
      layout,
      includeHeader,
    )
  ) {
    return defaultPillar;
  }

  return snapVirtualPillar({
    ...defaultPillar,
    x: snapped.x,
    y: snapped.y,
  });
}

/**
 * Position for a new content pillar below the message box.
 * Single adds stack vertically; a batch lays out in a horizontal row on one row.
 */
export function getNextPillarPositionBelowMessage(
  messageBox: Pillar,
  existingPillarsBelow: Pillar[],
  indexInBatch: number,
  batchSize: number,
  pillarWidth: number = PILLAR_CARD_WIDTH,
  pillarHeight: number = getContentPillarHeightFromMessageBox(messageBox),
): { x: number; y: number } {
  const messageHeight = messageBox.height ?? MESSAGE_BOX_MIN_HEIGHT;
  const messageWidth = messageBox.width ?? MESSAGE_BOX_WIDTH;
  const gap = PILLAR_BELOW_MESSAGE_GAP;

  const baseY =
    existingPillarsBelow.length === 0
      ? messageBox.y + messageHeight + gap
      : Math.max(
          ...existingPillarsBelow.map(
            (pillar) => pillar.y + (pillar.height ?? pillarHeight),
          ),
        ) + gap;

  if (batchSize > 1) {
    const totalRowWidth = batchSize * pillarWidth + (batchSize - 1) * gap;
    const rowStartX = messageBox.x + (messageWidth - totalRowWidth) / 2;

    return {
      x: rowStartX + indexInBatch * (pillarWidth + gap),
      y: baseY,
    };
  }

  return {
    x: messageBox.x + (messageWidth - pillarWidth) / 2,
    y: baseY,
  };
}

export function getPillarsBelowMessageBox(
  messageBox: Pillar,
  pillars: Pillar[],
): Pillar[] {
  const messageBottom = messageBox.y + (messageBox.height ?? MESSAGE_BOX_MIN_HEIGHT);

  return pillars
    .filter((pillar) => pillar.y >= messageBottom - 8)
    .sort((a, b) => a.y - b.y || a.x - b.x);
}

export function getMessageBoxVirtualPillar(
  whatCard: Pillar,
  messageBoxId: string,
  height: number = MESSAGE_BOX_MIN_HEIGHT,
): Pillar {
  const size = getPillarSize(whatCard);
  const rawX = whatCard.x + (size.width - MESSAGE_BOX_WIDTH) / 2;

  return snapVirtualPillar({
    id: messageBoxId,
    label: "Message",
    x: Math.max(MESSAGE_BOX_MIN_CARD_LEFT, rawX),
    y: whatCard.y + size.height + MESSAGE_BOX_GAP,
    width: MESSAGE_BOX_WIDTH,
    height,
  });
}

export function isValidMessageBoxPosition(
  storedPosition: MessageBoxPosition,
  whatCard: Pillar,
  height: number,
  obstacleRects: BoardRect[],
): boolean {
  const size: PillarSize = { width: MESSAGE_BOX_WIDTH, height };
  const whatSize = getPillarSize(whatCard);
  const minY = whatCard.y + whatSize.height + MESSAGE_BOX_GAP;

  if (storedPosition.y < minY - BOARD_LAYOUT_POSITION_EPSILON) {
    return false;
  }

  if (storedBoxOverlapsAnyRect(storedPosition, size, obstacleRects)) {
    return false;
  }

  return true;
}

export function resolveMessageBoxPillar(
  whatCard: Pillar,
  messageBoxId: string,
  storedPosition?: MessageBoxPosition | null,
  height: number = MESSAGE_BOX_MIN_HEIGHT,
  obstacleRects: BoardRect[] = [],
): Pillar {
  const defaultPillar = getMessageBoxVirtualPillar(whatCard, messageBoxId, height);

  if (!storedPosition) {
    return defaultPillar;
  }

  const snapped = snapBoardPoint(storedPosition);
  if (
    !isValidMessageBoxPosition(snapped, whatCard, height, obstacleRects)
  ) {
    return defaultPillar;
  }

  return snapVirtualPillar({
    ...defaultPillar,
    x: snapped.x,
    y: snapped.y,
  });
}

/** Padding around chart content in exported JPGs (board coordinates). */
export const BOARD_EXPORT_PADDING = 40;
/** Device pixel ratio for HD board exports. */
export const BOARD_EXPORT_PIXEL_RATIO = 2;

export function unionBoardRects(rects: BoardRect[]): BoardRect | null {
  if (rects.length === 0) {
    return null;
  }

  let left = Infinity;
  let top = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;

  for (const rect of rects) {
    left = Math.min(left, rect.left);
    top = Math.min(top, rect.top);
    right = Math.max(right, rect.right);
    bottom = Math.max(bottom, rect.bottom);
  }

  return { left, top, right, bottom };
}

export function expandBoardRect(rect: BoardRect, padding: number): BoardRect {
  return {
    left: rect.left - padding,
    top: rect.top - padding,
    right: rect.right + padding,
    bottom: rect.bottom + padding,
  };
}

export function getBoardRectSize(rect: BoardRect): { width: number; height: number } {
  return {
    width: Math.max(0, rect.right - rect.left),
    height: Math.max(0, rect.bottom - rect.top),
  };
}

export type BoardExportCapture = {
  bounds: BoardRect;
  width: number;
  height: number;
};

export function getBoardContentBounds(
  pillars: Pillar[],
  pillarSizes: Record<string, PillarSize>,
  connections: Connection[],
  extraRects: BoardRect[] = [],
): BoardRect | null {
  const rects: BoardRect[] = [...extraRects];

  for (const pillar of pillars) {
    const size = pillarSizes[pillar.id] ?? getPillarSize(pillar);
    rects.push(getPillarBounds(pillar, size));
  }

  const pillarById = new Map(pillars.map((pillar) => [pillar.id, pillar]));

  for (const connection of connections) {
    const fromPillar = pillarById.get(connection.fromPillarId);
    const toPillar = pillarById.get(connection.toPillarId);
    if (!fromPillar || !toPillar) {
      continue;
    }

    const fromSize = pillarSizes[fromPillar.id] ?? getPillarSize(fromPillar);
    const toSize = pillarSizes[toPillar.id] ?? getPillarSize(toPillar);
    const { from, to } = getConnectionPoints(
      fromPillar,
      connection.fromAnchor,
      toPillar,
      connection.toAnchor,
      fromSize,
      toSize,
    );
    rects.push(normalizeRect(from.x, from.y, to.x, to.y));
  }

  return unionBoardRects(rects);
}

export function getBoardExportCapture(
  pillars: Pillar[],
  pillarSizes: Record<string, PillarSize>,
  connections: Connection[],
  padding = BOARD_EXPORT_PADDING,
  extraRects: BoardRect[] = [],
): BoardExportCapture | null {
  const content = getBoardContentBounds(
    pillars,
    pillarSizes,
    connections,
    extraRects,
  );
  if (!content) {
    return null;
  }

  const bounds = expandBoardRect(content, padding);
  const size = getBoardRectSize(bounds);

  return {
    bounds,
    width: Math.ceil(size.width),
    height: Math.ceil(size.height),
  };
}
