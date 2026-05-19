import {
  clampPillarSize,
  getAudienceFrameworkAnchorSize,
  getContentPillarHeightFromMessageBox,
  getContentPillarsBoxDimensions,
  getFrameworkCardBounds,
  getPillarBounds,
  getPillarSize,
  inferDefaultAnchors,
  isValidAudienceBoxPosition,
  isValidContentPillarsBoxPosition,
  isValidInstagramCreatorsBoxPosition,
  isValidMessageBoxPosition,
  isValidPsychographicTraitsBoxPosition,
  AUDIENCE_FRAMEWORK_CARD_MIN_HEIGHT,
  MESSAGE_BOX_MIN_HEIGHT,
  MESSAGE_BOX_WIDTH,
  PILLAR_CARD_HEIGHT,
  PILLAR_CARD_WIDTH,
  rectsIntersect,
  resolveAudienceBoxPillar,
  resolveInstagramCreatorsBoxPillar,
  resolvePsychographicTraitsBoxPillar,
  resolveContentPillarsBoxPillar,
  resolveMessageBoxPillar,
  snapBoardPoint,
  storedPositionNear,
  BOARD_LAYOUT_POSITION_EPSILON,
  type BoardRect,
  type ContentPillarsBoxPosition,
  type MessageBoxPosition,
} from "@/lib/board-geometry";
import {
  BOARD_LAYOUT_VERSION,
  BOARD_LAYOUT_WHO_ROW3_Y,
  CANONICAL_FRAMEWORK_LAYOUT,
  getDefaultMessageBoxPosition,
  hasFrameworkCardsOverlap,
} from "@/lib/board-layout";

export { BOARD_LAYOUT_VERSION, CANONICAL_FRAMEWORK_LAYOUT } from "@/lib/board-layout";
import type { EcosystemCategory } from "@/lib/ecosystem-category";
import { clampDemographicAgeRangeInLabel } from "@/lib/demographic-age-range";

export const STORAGE_KEY = "creator-vision";
export const VISION_CARD_ID = "creator-vision-card";
export const VISION_CARD_LABEL = "CREATOR VISION";
export const MESSAGE_BOX_ID = "message-box";
export const CONTENT_PILLARS_BOX_ID = "content-pillars-box";
export const DEMOGRAPHIC_BOX_ID = "demographic-box";
export const INSTAGRAM_CREATORS_BOX_ID = "instagram-creators-box";
export const PSYCHOGRAPHIC_BOX_ID = "psychographic-box";
export const PAIN_BOX_ID = "pain-box";
export const PASSION_BOX_ID = "passion-box";
export const EXPERIENCE_BOX_ID = "experience-box";
export const SKILL_BOX_ID = "skill-box";
export const ONE_OFF_BOX_ID = "one-off-box";
export const ONGOING_CONTENT_BOX_ID = "ongoing-content-box";
export const HIGH_VALUE_PARTNERS_BOX_ID = "high-value-partners-box";
export const REINVEST_BOX_ID = "reinvest-box";

export type PillarContainer =
  | "content"
  | "demographic"
  | "psychographic"
  | "pain"
  | "passion"
  | "experience"
  | "skill"
  | "one-off"
  | "ongoing-content"
  | "high-value-partners"
  | "reinvest";

export type PsychographicKind = "creator" | "trait";

export const FRAMEWORK_CARD_IDS = {
  what: "framework-what",
  who: "framework-who",
  uniqueness: "framework-uniqueness",
  monetization: "framework-monetization",
  avatar: "framework-avatar",
  demographic: "framework-demographic",
  psychographic: "framework-psychographic",
  yourTruth: "framework-your-truth",
  pain: "framework-pain",
  passion: "framework-passion",
  experience: "framework-experience",
  skill: "framework-skill",
  ecosystem: "framework-ecosystem",
  oneOff: "framework-one-off",
  ongoingContent: "framework-ongoing-content",
  highValuePartners: "framework-high-value-partners",
  reinvest: "framework-reinvest",
} as const;

const CANONICAL_FRAMEWORK_BY_ID = new Map(
  CANONICAL_FRAMEWORK_LAYOUT.map((entry) => [entry.id, entry]),
);

/** Top-row framework pillars connected from Creator vision. */
export const VISION_FRAMEWORK_CARDS = [
  CANONICAL_FRAMEWORK_BY_ID.get(FRAMEWORK_CARD_IDS.what)!,
  CANONICAL_FRAMEWORK_BY_ID.get(FRAMEWORK_CARD_IDS.who)!,
  CANONICAL_FRAMEWORK_BY_ID.get(FRAMEWORK_CARD_IDS.uniqueness)!,
  CANONICAL_FRAMEWORK_BY_ID.get(FRAMEWORK_CARD_IDS.monetization)!,
] as const;

/** WHO subtree static pillars (not connected directly from Creator vision). */
export const WHO_SUBTREE_CARDS = [
  CANONICAL_FRAMEWORK_BY_ID.get(FRAMEWORK_CARD_IDS.avatar)!,
  CANONICAL_FRAMEWORK_BY_ID.get(FRAMEWORK_CARD_IDS.demographic)!,
  CANONICAL_FRAMEWORK_BY_ID.get(FRAMEWORK_CARD_IDS.psychographic)!,
] as const;

/** UNIQUENESS subtree static pillars (shown with audience areas). */
export const UNIQUENESS_SUBTREE_CARDS = [
  CANONICAL_FRAMEWORK_BY_ID.get(FRAMEWORK_CARD_IDS.yourTruth)!,
  CANONICAL_FRAMEWORK_BY_ID.get(FRAMEWORK_CARD_IDS.pain)!,
  CANONICAL_FRAMEWORK_BY_ID.get(FRAMEWORK_CARD_IDS.passion)!,
  CANONICAL_FRAMEWORK_BY_ID.get(FRAMEWORK_CARD_IDS.experience)!,
  CANONICAL_FRAMEWORK_BY_ID.get(FRAMEWORK_CARD_IDS.skill)!,
] as const;

/** MONETIZATION subtree static pillars (shown with audience areas). */
export const MONETIZATION_SUBTREE_CARDS = [
  CANONICAL_FRAMEWORK_BY_ID.get(FRAMEWORK_CARD_IDS.ecosystem)!,
  CANONICAL_FRAMEWORK_BY_ID.get(FRAMEWORK_CARD_IDS.oneOff)!,
  CANONICAL_FRAMEWORK_BY_ID.get(FRAMEWORK_CARD_IDS.ongoingContent)!,
  CANONICAL_FRAMEWORK_BY_ID.get(FRAMEWORK_CARD_IDS.highValuePartners)!,
  CANONICAL_FRAMEWORK_BY_ID.get(FRAMEWORK_CARD_IDS.reinvest)!,
] as const;

export const FRAMEWORK_CARDS = CANONICAL_FRAMEWORK_LAYOUT.filter(
  (entry) => entry.id !== VISION_CARD_ID,
) as readonly (typeof CANONICAL_FRAMEWORK_LAYOUT)[number][];

const UNIQUENESS_SUBTREE_CARD_IDS = new Set<string>(
  UNIQUENESS_SUBTREE_CARDS.map((card) => card.id),
);

const MONETIZATION_SUBTREE_CARD_IDS = new Set<string>(
  MONETIZATION_SUBTREE_CARDS.map((card) => card.id),
);

/** Non-deletable UNIQUENESS + MONETIZATION subtree framework label card IDs. */
export const PROTECTED_UNIQUENESS_MONETIZATION_SUBTREE_CARD_IDS = [
  ...UNIQUENESS_SUBTREE_CARDS.map((card) => card.id),
  ...MONETIZATION_SUBTREE_CARDS.map((card) => card.id),
] as const;

const STATIC_PILLAR_IDS = new Set<string>([
  VISION_CARD_ID,
  ...FRAMEWORK_CARDS.map((card) => card.id),
]);

const WHO_SUBTREE_CONNECTION_SPECS = [
  {
    fromId: FRAMEWORK_CARD_IDS.who,
    toId: FRAMEWORK_CARD_IDS.avatar,
  },
  {
    fromId: FRAMEWORK_CARD_IDS.avatar,
    toId: FRAMEWORK_CARD_IDS.demographic,
  },
  {
    fromId: FRAMEWORK_CARD_IDS.avatar,
    toId: FRAMEWORK_CARD_IDS.psychographic,
  },
] as const;

const UNIQUENESS_SUBTREE_CONNECTION_SPECS = [
  {
    fromId: FRAMEWORK_CARD_IDS.uniqueness,
    toId: FRAMEWORK_CARD_IDS.yourTruth,
  },
  {
    fromId: FRAMEWORK_CARD_IDS.yourTruth,
    toId: FRAMEWORK_CARD_IDS.pain,
  },
  {
    fromId: FRAMEWORK_CARD_IDS.yourTruth,
    toId: FRAMEWORK_CARD_IDS.passion,
  },
  {
    fromId: FRAMEWORK_CARD_IDS.yourTruth,
    toId: FRAMEWORK_CARD_IDS.experience,
  },
  {
    fromId: FRAMEWORK_CARD_IDS.yourTruth,
    toId: FRAMEWORK_CARD_IDS.skill,
  },
] as const;

const MONETIZATION_SUBTREE_CONNECTION_SPECS = [
  {
    fromId: FRAMEWORK_CARD_IDS.monetization,
    toId: FRAMEWORK_CARD_IDS.ecosystem,
  },
  {
    fromId: FRAMEWORK_CARD_IDS.ecosystem,
    toId: FRAMEWORK_CARD_IDS.oneOff,
  },
  {
    fromId: FRAMEWORK_CARD_IDS.ecosystem,
    toId: FRAMEWORK_CARD_IDS.ongoingContent,
  },
  {
    fromId: FRAMEWORK_CARD_IDS.ecosystem,
    toId: FRAMEWORK_CARD_IDS.highValuePartners,
  },
  {
    fromId: FRAMEWORK_CARD_IDS.ecosystem,
    toId: FRAMEWORK_CARD_IDS.reinvest,
  },
] as const;

export type Pillar = {
  id: string;
  label: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  /** Grid container for non-static pillars; omitted means content. */
  container?: PillarContainer;
  /** Psychographic sub-category; traits when omitted on legacy data. */
  psychographicKind?: PsychographicKind;
};

export type ConnectionAnchor = "top" | "right" | "bottom" | "left";

export type Connection = {
  id: string;
  fromPillarId: string;
  fromAnchor: ConnectionAnchor;
  toPillarId: string;
  toAnchor: ConnectionAnchor;
};

export type {
  ContentPillarsBoxPosition,
  MessageBoxPosition,
} from "@/lib/board-geometry";

export type CreatorVision = {
  message: string;
  pillars: Pillar[];
  connections: Connection[];
  /** Canonical framework layout generation; missing values migrate on load. */
  layoutVersion?: number;
  messageBoxPosition?: MessageBoxPosition;
  contentPillarsBoxPosition?: ContentPillarsBoxPosition;
  demographicBoxPosition?: ContentPillarsBoxPosition;
  instagramCreatorsBoxPosition?: ContentPillarsBoxPosition;
  psychographicBoxPosition?: ContentPillarsBoxPosition;
  painBoxPosition?: ContentPillarsBoxPosition;
  passionBoxPosition?: ContentPillarsBoxPosition;
  experienceBoxPosition?: ContentPillarsBoxPosition;
  skillBoxPosition?: ContentPillarsBoxPosition;
  oneOffBoxPosition?: ContentPillarsBoxPosition;
  ongoingContentBoxPosition?: ContentPillarsBoxPosition;
  highValuePartnersBoxPosition?: ContentPillarsBoxPosition;
  reinvestBoxPosition?: ContentPillarsBoxPosition;
  updatedAt: number;
};

export type EcosystemGeneration = {
  oneOff: string[];
  ongoingContent: string[];
  highValuePartners: string[];
  reinvest: string[];
};

export function createDefaultVisionCard(): Pillar {
  const layout = CANONICAL_FRAMEWORK_BY_ID.get(VISION_CARD_ID)!;
  return {
    id: VISION_CARD_ID,
    label: VISION_CARD_LABEL,
    x: layout.x,
    y: layout.y,
  };
}

export function createDefaultFrameworkCards(): Pillar[] {
  return FRAMEWORK_CARDS.map(({ id, label, x, y }) => ({ id, label, x, y }));
}

export function createDefaultStaticPillars(): Pillar[] {
  return [createDefaultVisionCard(), ...createDefaultFrameworkCards()];
}

export function isVisionCard(pillar: Pillar | string): boolean {
  const id = typeof pillar === "string" ? pillar : pillar.id;
  return id === VISION_CARD_ID;
}

export function isFrameworkCard(pillar: Pillar | string): boolean {
  const id = typeof pillar === "string" ? pillar : pillar.id;
  return FRAMEWORK_CARDS.some((card) => card.id === id);
}

export function isUniquenessSubtreeCard(pillar: Pillar | string): boolean {
  const id = typeof pillar === "string" ? pillar : pillar.id;
  return UNIQUENESS_SUBTREE_CARD_IDS.has(id);
}

export function isMonetizationSubtreeCard(pillar: Pillar | string): boolean {
  const id = typeof pillar === "string" ? pillar : pillar.id;
  return MONETIZATION_SUBTREE_CARD_IDS.has(id);
}

export function isStaticCard(pillar: Pillar | string): boolean {
  const id = typeof pillar === "string" ? pillar : pillar.id;
  return STATIC_PILLAR_IDS.has(id);
}

export function getVisionCard(pillars: Pillar[]): Pillar | undefined {
  return pillars.find((pillar) => pillar.id === VISION_CARD_ID);
}

const LEGACY_STATIC_CARD_LABELS: Partial<Record<string, string>> = {
  [VISION_CARD_ID]: "Creator vision",
  [FRAMEWORK_CARD_IDS.avatar]: "Avatar",
};

function migrateStaticCardLabel(pillar: Pillar): Pillar {
  const legacyLabel = LEGACY_STATIC_CARD_LABELS[pillar.id];
  if (legacyLabel && pillar.label === legacyLabel) {
    const defaultLabel =
      pillar.id === VISION_CARD_ID
        ? VISION_CARD_LABEL
        : FRAMEWORK_CARDS.find((card) => card.id === pillar.id)?.label;
    if (defaultLabel) {
      return { ...pillar, label: defaultLabel };
    }
  }

  return pillar;
}

function getFrameworkCardBoundsForObstacles(pillar: Pillar): BoardRect {
  if (
    pillar.id === FRAMEWORK_CARD_IDS.demographic ||
    pillar.id === FRAMEWORK_CARD_IDS.psychographic ||
    pillar.id === FRAMEWORK_CARD_IDS.pain ||
    pillar.id === FRAMEWORK_CARD_IDS.passion ||
    pillar.id === FRAMEWORK_CARD_IDS.experience ||
    pillar.id === FRAMEWORK_CARD_IDS.skill ||
    pillar.id === FRAMEWORK_CARD_IDS.oneOff ||
    pillar.id === FRAMEWORK_CARD_IDS.ongoingContent ||
    pillar.id === FRAMEWORK_CARD_IDS.highValuePartners ||
    pillar.id === FRAMEWORK_CARD_IDS.reinvest
  ) {
    return getPillarBounds(pillar, getAudienceFrameworkAnchorSize(pillar));
  }

  return getFrameworkCardBounds(pillar);
}

function shouldResetFrameworkCardPosition(
  pillar: Pillar,
  pillars: Pillar[],
  options: { forceCanonical?: boolean } = {},
): boolean {
  if (options.forceCanonical) {
    return true;
  }

  const canonical = FRAMEWORK_CARDS.find((card) => card.id === pillar.id);
  if (!canonical) {
    return false;
  }

  if (pillar.x === canonical.x && pillar.y === canonical.y) {
    return false;
  }

  if (hasFrameworkCardsOverlap(pillars)) {
    return true;
  }

  const bounds = getFrameworkCardBoundsForObstacles(pillar);

  for (const card of FRAMEWORK_CARDS) {
    if (card.id === pillar.id) {
      continue;
    }

    const other =
      pillars.find((item) => item.id === card.id) ??
      ({ id: card.id, label: card.label, x: card.x, y: card.y } as Pillar);
    if (rectsIntersect(bounds, getFrameworkCardBoundsForObstacles(other))) {
      return true;
    }
  }

  if (
    (isUniquenessSubtreeCard(pillar.id) || isMonetizationSubtreeCard(pillar.id)) &&
    pillar.y < BOARD_LAYOUT_WHO_ROW3_Y
  ) {
    return true;
  }

  if (
    (pillar.id === FRAMEWORK_CARD_IDS.demographic ||
      pillar.id === FRAMEWORK_CARD_IDS.psychographic) &&
    pillar.y < BOARD_LAYOUT_WHO_ROW3_Y - BOARD_LAYOUT_POSITION_EPSILON
  ) {
    return true;
  }

  if (
    pillar.id === FRAMEWORK_CARD_IDS.psychographic &&
    pillar.y > BOARD_LAYOUT_WHO_ROW3_Y + BOARD_LAYOUT_POSITION_EPSILON
  ) {
    return true;
  }

  if (
    pillar.id === FRAMEWORK_CARD_IDS.psychographic &&
    pillar.x === CANONICAL_FRAMEWORK_BY_ID.get(FRAMEWORK_CARD_IDS.demographic)!.x
  ) {
    return true;
  }

  const monetizationFooterIds = new Set<string>([
    FRAMEWORK_CARD_IDS.oneOff,
    FRAMEWORK_CARD_IDS.ongoingContent,
    FRAMEWORK_CARD_IDS.highValuePartners,
    FRAMEWORK_CARD_IDS.reinvest,
  ]);

  if (monetizationFooterIds.has(pillar.id) && pillar.y !== canonical.y) {
    return true;
  }

  return false;
}

function needsLayoutVersionMigration(vision: CreatorVision): boolean {
  return (vision.layoutVersion ?? 0) < BOARD_LAYOUT_VERSION;
}

function clearStoredBoxPositions(vision: CreatorVision): CreatorVision {
  return {
    ...vision,
    messageBoxPosition: undefined,
    contentPillarsBoxPosition: undefined,
    demographicBoxPosition: undefined,
    instagramCreatorsBoxPosition: undefined,
    psychographicBoxPosition: undefined,
    painBoxPosition: undefined,
    passionBoxPosition: undefined,
    experienceBoxPosition: undefined,
    skillBoxPosition: undefined,
    oneOffBoxPosition: undefined,
    ongoingContentBoxPosition: undefined,
    highValuePartnersBoxPosition: undefined,
    reinvestBoxPosition: undefined,
  };
}

export function getFrameworkObstacleRects(
  pillars: Pillar[],
  options: { excludeWhat?: boolean } = {},
): BoardRect[] {
  return FRAMEWORK_CARDS.filter(
    (card) => !options.excludeWhat || card.id !== FRAMEWORK_CARD_IDS.what,
  ).map((card) => {
    const pillar =
      pillars.find((item) => item.id === card.id) ??
      ({ id: card.id, label: card.label, x: card.x, y: card.y } as Pillar);

    return getFrameworkCardBoundsForObstacles(pillar);
  });
}

function sanitizeStoredBoxPosition<T extends MessageBoxPosition>(
  stored: T | undefined,
  isValid: (position: T) => boolean,
): T | undefined {
  if (!stored) {
    return undefined;
  }

  const snapped = snapBoardPoint(stored) as T;
  return isValid(snapped) ? snapped : undefined;
}

export function migrateVisionBoxPositions(vision: CreatorVision): CreatorVision {
  const pillars = vision.pillars;
  const whatCard = pillars.find((pillar) => pillar.id === FRAMEWORK_CARD_IDS.what);
  if (!whatCard) {
    return vision;
  }

  const messageObstacles = getFrameworkObstacleRects(pillars, { excludeWhat: true });
  const allObstacles = getFrameworkObstacleRects(pillars);
  const messageHeight = MESSAGE_BOX_MIN_HEIGHT;
  const contentPillarCount = getContentPillars(pillars).length;
  const demographicCount = getDemographicPillars(pillars).length;
  const creatorCount = getPsychographicCreatorPillars(pillars).length;
  const traitCount = getPsychographicTraitPillars(pillars).length;
  const painCount = getPainPillars(pillars).length;
  const passionCount = getPassionPillars(pillars).length;
  const experienceCount = getExperiencePillars(pillars).length;
  const skillCount = getSkillPillars(pillars).length;
  const oneOffCount = getOneOffPillars(pillars).length;
  const ongoingContentCount = getOngoingContentPillars(pillars).length;
  const highValuePartnersCount = getHighValuePartnersPillars(pillars).length;
  const reinvestCount = getReinvestPillars(pillars).length;

  let messageBoxPosition = sanitizeStoredBoxPosition(
    vision.messageBoxPosition,
    (position) =>
      isValidMessageBoxPosition(position, whatCard, messageHeight, messageObstacles),
  );

  const messageBox = resolveMessageBoxPillar(
    whatCard,
    MESSAGE_BOX_ID,
    messageBoxPosition,
    messageHeight,
    messageObstacles,
  );
  const messageBoxRect = getPillarBounds(messageBox, {
    width: MESSAGE_BOX_WIDTH,
    height: messageBox.height ?? messageHeight,
  });

  let contentPillarsBoxPosition = vision.contentPillarsBoxPosition;
  if (contentPillarCount > 0) {
    const cellHeight = getContentPillarHeightFromMessageBox(messageBox);
    contentPillarsBoxPosition = sanitizeStoredBoxPosition(
      contentPillarsBoxPosition,
      (position) =>
        isValidContentPillarsBoxPosition(
          position,
          messageBox,
          contentPillarCount,
          cellHeight,
          allObstacles,
        ),
    );
  } else {
    contentPillarsBoxPosition = undefined;
  }

  const contentCellHeight = getContentPillarHeightFromMessageBox(messageBox);
  const contentPillarsBox =
    contentPillarCount > 0
      ? resolveContentPillarsBoxPillar(
          messageBox,
          CONTENT_PILLARS_BOX_ID,
          contentPillarCount,
          contentPillarsBoxPosition,
          allObstacles,
        )
      : null;
  const contentBoxRect = contentPillarsBox
    ? getPillarBounds(contentPillarsBox, {
        width: contentPillarsBox.width ?? MESSAGE_BOX_WIDTH,
        height:
          contentPillarsBox.height ??
          getContentPillarsBoxDimensions(contentPillarCount, contentCellHeight).height,
      })
    : null;

  const demographicCard = pillars.find(
    (pillar) => pillar.id === FRAMEWORK_CARD_IDS.demographic,
  );
  const psychographicCard = pillars.find(
    (pillar) => pillar.id === FRAMEWORK_CARD_IDS.psychographic,
  );

  let demographicBoxPosition = vision.demographicBoxPosition;
  if (demographicCard && demographicCount > 0) {
    const obstacles = [
      ...allObstacles,
      messageBoxRect,
      ...(contentBoxRect ? [contentBoxRect] : []),
    ];
    demographicBoxPosition = sanitizeStoredBoxPosition(
      demographicBoxPosition,
      (position) =>
        isValidAudienceBoxPosition(
          position,
          demographicCard,
          demographicCount,
          PILLAR_CARD_HEIGHT,
          obstacles,
        ),
    );
  } else {
    demographicBoxPosition = undefined;
  }

  const demographicBox =
    demographicCard && demographicCount > 0
      ? resolveAudienceBoxPillar(
          demographicCard,
          DEMOGRAPHIC_BOX_ID,
          demographicCount,
          PILLAR_CARD_HEIGHT,
          demographicBoxPosition,
          "grid",
          true,
          allObstacles,
        )
      : null;
  const demographicBoxRect = demographicBox
    ? getPillarBounds(demographicBox, {
        width: demographicBox.width ?? MESSAGE_BOX_WIDTH,
        height:
          demographicBox.height ??
          getContentPillarsBoxDimensions(demographicCount, PILLAR_CARD_HEIGHT).height,
      })
    : null;

  let instagramCreatorsBoxPosition = vision.instagramCreatorsBoxPosition;
  let psychographicBoxPosition = vision.psychographicBoxPosition;

  if (psychographicCard && creatorCount > 0) {
    const obstacles = [
      ...allObstacles,
      messageBoxRect,
      ...(contentBoxRect ? [contentBoxRect] : []),
      ...(demographicBoxRect ? [demographicBoxRect] : []),
    ];
    instagramCreatorsBoxPosition = sanitizeStoredBoxPosition(
      instagramCreatorsBoxPosition,
      (position) =>
        isValidInstagramCreatorsBoxPosition(
          position,
          psychographicCard,
          creatorCount,
          PILLAR_CARD_HEIGHT,
          obstacles,
        ),
    );
  } else {
    instagramCreatorsBoxPosition = undefined;
  }

  const instagramCreatorsBox =
    psychographicCard && creatorCount > 0
      ? resolveInstagramCreatorsBoxPillar(
          psychographicCard,
          INSTAGRAM_CREATORS_BOX_ID,
          creatorCount,
          PILLAR_CARD_HEIGHT,
          traitCount,
          instagramCreatorsBoxPosition,
          allObstacles,
        )
      : null;

  if (psychographicCard && traitCount > 0 && instagramCreatorsBox) {
    const obstacles = [
      ...allObstacles,
      messageBoxRect,
      ...(contentBoxRect ? [contentBoxRect] : []),
      ...(demographicBoxRect ? [demographicBoxRect] : []),
      getPillarBounds(instagramCreatorsBox, {
        width: instagramCreatorsBox.width ?? MESSAGE_BOX_WIDTH,
        height:
          instagramCreatorsBox.height ??
          getContentPillarsBoxDimensions(creatorCount, PILLAR_CARD_HEIGHT).height,
      }),
    ];
    psychographicBoxPosition = sanitizeStoredBoxPosition(
      psychographicBoxPosition,
      (position) =>
        isValidPsychographicTraitsBoxPosition(
          position,
          psychographicCard,
          traitCount,
          PILLAR_CARD_HEIGHT,
          instagramCreatorsBox,
          obstacles,
        ),
    );
  } else {
    psychographicBoxPosition = undefined;
  }

  const baseUniquenessObstacles = [
    ...allObstacles,
    messageBoxRect,
    ...(contentBoxRect ? [contentBoxRect] : []),
    ...(demographicBoxRect ? [demographicBoxRect] : []),
  ];

  const uniquenessBoxSpecs = [
    {
      cardId: FRAMEWORK_CARD_IDS.pain,
      boxId: PAIN_BOX_ID,
      count: painCount,
      stored: vision.painBoxPosition,
    },
    {
      cardId: FRAMEWORK_CARD_IDS.passion,
      boxId: PASSION_BOX_ID,
      count: passionCount,
      stored: vision.passionBoxPosition,
    },
    {
      cardId: FRAMEWORK_CARD_IDS.experience,
      boxId: EXPERIENCE_BOX_ID,
      count: experienceCount,
      stored: vision.experienceBoxPosition,
    },
    {
      cardId: FRAMEWORK_CARD_IDS.skill,
      boxId: SKILL_BOX_ID,
      count: skillCount,
      stored: vision.skillBoxPosition,
    },
  ] as const;

  let uniquenessObstacles = [...baseUniquenessObstacles];
  let painBoxPosition = vision.painBoxPosition;
  let passionBoxPosition = vision.passionBoxPosition;
  let experienceBoxPosition = vision.experienceBoxPosition;
  let skillBoxPosition = vision.skillBoxPosition;

  for (const spec of uniquenessBoxSpecs) {
    const anchorCard = pillars.find((pillar) => pillar.id === spec.cardId);
    if (!anchorCard || spec.count <= 0) {
      if (spec.boxId === PAIN_BOX_ID) {
        painBoxPosition = undefined;
      } else if (spec.boxId === PASSION_BOX_ID) {
        passionBoxPosition = undefined;
      } else if (spec.boxId === EXPERIENCE_BOX_ID) {
        experienceBoxPosition = undefined;
      } else {
        skillBoxPosition = undefined;
      }
      continue;
    }

    const sanitized = sanitizeStoredBoxPosition(spec.stored, (position) =>
      isValidAudienceBoxPosition(
        position,
        anchorCard,
        spec.count,
        PILLAR_CARD_HEIGHT,
        uniquenessObstacles,
      ),
    );

    if (spec.boxId === PAIN_BOX_ID) {
      painBoxPosition = sanitized;
    } else if (spec.boxId === PASSION_BOX_ID) {
      passionBoxPosition = sanitized;
    } else if (spec.boxId === EXPERIENCE_BOX_ID) {
      experienceBoxPosition = sanitized;
    } else {
      skillBoxPosition = sanitized;
    }

    const resolvedBox = resolveAudienceBoxPillar(
      anchorCard,
      spec.boxId,
      spec.count,
      PILLAR_CARD_HEIGHT,
      sanitized,
      "grid",
      true,
      uniquenessObstacles,
    );
    uniquenessObstacles = [
      ...uniquenessObstacles,
      getPillarBounds(resolvedBox, {
        width: resolvedBox.width ?? MESSAGE_BOX_WIDTH,
        height:
          resolvedBox.height ??
          getContentPillarsBoxDimensions(spec.count, PILLAR_CARD_HEIGHT).height,
      }),
    ];
  }

  const ecosystemBoxSpecs = [
    {
      cardId: FRAMEWORK_CARD_IDS.oneOff,
      boxId: ONE_OFF_BOX_ID,
      count: oneOffCount,
      stored: vision.oneOffBoxPosition,
    },
    {
      cardId: FRAMEWORK_CARD_IDS.ongoingContent,
      boxId: ONGOING_CONTENT_BOX_ID,
      count: ongoingContentCount,
      stored: vision.ongoingContentBoxPosition,
    },
    {
      cardId: FRAMEWORK_CARD_IDS.highValuePartners,
      boxId: HIGH_VALUE_PARTNERS_BOX_ID,
      count: highValuePartnersCount,
      stored: vision.highValuePartnersBoxPosition,
    },
    {
      cardId: FRAMEWORK_CARD_IDS.reinvest,
      boxId: REINVEST_BOX_ID,
      count: reinvestCount,
      stored: vision.reinvestBoxPosition,
    },
  ] as const;

  let monetizationObstacles = [...uniquenessObstacles];
  let oneOffBoxPosition = vision.oneOffBoxPosition;
  let ongoingContentBoxPosition = vision.ongoingContentBoxPosition;
  let highValuePartnersBoxPosition = vision.highValuePartnersBoxPosition;
  let reinvestBoxPosition = vision.reinvestBoxPosition;

  for (const spec of ecosystemBoxSpecs) {
    const anchorCard = pillars.find((pillar) => pillar.id === spec.cardId);
    if (!anchorCard || spec.count <= 0) {
      if (spec.boxId === ONE_OFF_BOX_ID) {
        oneOffBoxPosition = undefined;
      } else if (spec.boxId === ONGOING_CONTENT_BOX_ID) {
        ongoingContentBoxPosition = undefined;
      } else if (spec.boxId === HIGH_VALUE_PARTNERS_BOX_ID) {
        highValuePartnersBoxPosition = undefined;
      } else {
        reinvestBoxPosition = undefined;
      }
      continue;
    }

    const sanitized = sanitizeStoredBoxPosition(spec.stored, (position) =>
      isValidAudienceBoxPosition(
        position,
        anchorCard,
        spec.count,
        PILLAR_CARD_HEIGHT,
        monetizationObstacles,
      ),
    );

    if (spec.boxId === ONE_OFF_BOX_ID) {
      oneOffBoxPosition = sanitized;
    } else if (spec.boxId === ONGOING_CONTENT_BOX_ID) {
      ongoingContentBoxPosition = sanitized;
    } else if (spec.boxId === HIGH_VALUE_PARTNERS_BOX_ID) {
      highValuePartnersBoxPosition = sanitized;
    } else {
      reinvestBoxPosition = sanitized;
    }

    const resolvedBox = resolveAudienceBoxPillar(
      anchorCard,
      spec.boxId,
      spec.count,
      PILLAR_CARD_HEIGHT,
      sanitized,
      "grid",
      true,
      monetizationObstacles,
    );
    monetizationObstacles = [
      ...monetizationObstacles,
      getPillarBounds(resolvedBox, {
        width: resolvedBox.width ?? MESSAGE_BOX_WIDTH,
        height:
          resolvedBox.height ??
          getContentPillarsBoxDimensions(spec.count, PILLAR_CARD_HEIGHT).height,
      }),
    ];
  }

  const storedBoxes = [
    messageBoxPosition,
    contentPillarsBoxPosition,
    demographicBoxPosition,
    instagramCreatorsBoxPosition,
    psychographicBoxPosition,
    painBoxPosition,
    passionBoxPosition,
    experienceBoxPosition,
    skillBoxPosition,
    oneOffBoxPosition,
    ongoingContentBoxPosition,
    highValuePartnersBoxPosition,
    reinvestBoxPosition,
  ].filter((position): position is MessageBoxPosition => Boolean(position));

  for (let index = 0; index < storedBoxes.length; index += 1) {
    for (let other = index + 1; other < storedBoxes.length; other += 1) {
      if (!storedPositionNear(storedBoxes[index], storedBoxes[other])) {
        continue;
      }

      return {
        ...vision,
        messageBoxPosition: undefined,
        contentPillarsBoxPosition: undefined,
        demographicBoxPosition: undefined,
        instagramCreatorsBoxPosition: undefined,
        psychographicBoxPosition: undefined,
        painBoxPosition: undefined,
        passionBoxPosition: undefined,
        experienceBoxPosition: undefined,
        skillBoxPosition: undefined,
        oneOffBoxPosition: undefined,
        ongoingContentBoxPosition: undefined,
        highValuePartnersBoxPosition: undefined,
        reinvestBoxPosition: undefined,
      };
    }
  }

  return {
    ...vision,
    messageBoxPosition,
    contentPillarsBoxPosition,
    demographicBoxPosition,
    instagramCreatorsBoxPosition,
    psychographicBoxPosition,
    painBoxPosition,
    passionBoxPosition,
    experienceBoxPosition,
    skillBoxPosition,
    oneOffBoxPosition,
    ongoingContentBoxPosition,
    highValuePartnersBoxPosition,
    reinvestBoxPosition,
  };
}

export function getStaticPillars(
  pillars: Pillar[],
  options: { forceCanonicalLayout?: boolean } = {},
): Pillar[] {
  const pillarMap = new Map(pillars.map((pillar) => [pillar.id, pillar]));
  const mergedPillars = [
    migrateStaticCardLabel(
      pillarMap.get(VISION_CARD_ID) ?? createDefaultVisionCard(),
    ),
    ...FRAMEWORK_CARDS.map((card) =>
      migrateStaticCardLabel(
        pillarMap.get(card.id) ?? {
          id: card.id,
          label: card.label,
          x: card.x,
          y: card.y,
        },
      ),
    ),
  ];

  const forceCanonical = options.forceCanonicalLayout === true;

  return mergedPillars.map((pillar) => {
    if (!isFrameworkCard(pillar.id)) {
      if (pillar.id === VISION_CARD_ID && forceCanonical) {
        const canonical = CANONICAL_FRAMEWORK_BY_ID.get(VISION_CARD_ID)!;
        return { ...pillar, x: canonical.x, y: canonical.y };
      }
      return pillar;
    }

    const canonical = FRAMEWORK_CARDS.find((card) => card.id === pillar.id);
    if (!canonical) {
      return pillar;
    }

    if (
      shouldResetFrameworkCardPosition(pillar, mergedPillars, {
        forceCanonical,
      })
    ) {
      return { ...pillar, x: canonical.x, y: canonical.y };
    }

    return pillar;
  });
}

export function ensureStaticCards(pillars: Pillar[]): Pillar[] {
  const staticCards = getStaticPillars(pillars);
  const contentPillars = pillars.filter((pillar) => !isStaticCard(pillar));

  return [...staticCards, ...contentPillars];
}

/** @deprecated Use ensureStaticCards */
export function ensureVisionCard(pillars: Pillar[]): Pillar[] {
  return ensureStaticCards(pillars);
}

export function getPillarContainer(pillar: Pillar): PillarContainer {
  return pillar.container ?? "content";
}

export function getContentPillars(pillars: Pillar[]): Pillar[] {
  return pillars.filter(
    (pillar) => !isStaticCard(pillar) && getPillarContainer(pillar) === "content",
  );
}

export function getDemographicPillars(pillars: Pillar[]): Pillar[] {
  return pillars.filter(
    (pillar) => !isStaticCard(pillar) && getPillarContainer(pillar) === "demographic",
  );
}

export function isPsychographicCreatorPillar(pillar: Pillar): boolean {
  return getPillarContainer(pillar) === "psychographic" && pillar.psychographicKind === "creator";
}

export function getPsychographicCreatorPillars(pillars: Pillar[]): Pillar[] {
  return pillars.filter(
    (pillar) => !isStaticCard(pillar) && isPsychographicCreatorPillar(pillar),
  );
}

export function getPsychographicTraitPillars(pillars: Pillar[]): Pillar[] {
  return pillars.filter(
    (pillar) =>
      !isStaticCard(pillar) &&
      getPillarContainer(pillar) === "psychographic" &&
      pillar.psychographicKind !== "creator",
  );
}

export function getPsychographicPillars(pillars: Pillar[]): Pillar[] {
  return [
    ...getPsychographicCreatorPillars(pillars),
    ...getPsychographicTraitPillars(pillars),
  ];
}

export function getPainPillars(pillars: Pillar[]): Pillar[] {
  return pillars.filter(
    (pillar) => !isStaticCard(pillar) && getPillarContainer(pillar) === "pain",
  );
}

export function getPassionPillars(pillars: Pillar[]): Pillar[] {
  return pillars.filter(
    (pillar) => !isStaticCard(pillar) && getPillarContainer(pillar) === "passion",
  );
}

export function getExperiencePillars(pillars: Pillar[]): Pillar[] {
  return pillars.filter(
    (pillar) => !isStaticCard(pillar) && getPillarContainer(pillar) === "experience",
  );
}

export function getSkillPillars(pillars: Pillar[]): Pillar[] {
  return pillars.filter(
    (pillar) => !isStaticCard(pillar) && getPillarContainer(pillar) === "skill",
  );
}

export function getOneOffPillars(pillars: Pillar[]): Pillar[] {
  return pillars.filter(
    (pillar) => !isStaticCard(pillar) && getPillarContainer(pillar) === "one-off",
  );
}

export function getOngoingContentPillars(pillars: Pillar[]): Pillar[] {
  return pillars.filter(
    (pillar) => !isStaticCard(pillar) && getPillarContainer(pillar) === "ongoing-content",
  );
}

export function getHighValuePartnersPillars(pillars: Pillar[]): Pillar[] {
  return pillars.filter(
    (pillar) =>
      !isStaticCard(pillar) && getPillarContainer(pillar) === "high-value-partners",
  );
}

export function getReinvestPillars(pillars: Pillar[]): Pillar[] {
  return pillars.filter(
    (pillar) => !isStaticCard(pillar) && getPillarContainer(pillar) === "reinvest",
  );
}

export function isContentPillarsBox(pillar: Pillar | string): boolean {
  const id = typeof pillar === "string" ? pillar : pillar.id;
  return id === CONTENT_PILLARS_BOX_ID;
}

export function isAudienceBoxId(id: string): boolean {
  return (
    id === DEMOGRAPHIC_BOX_ID ||
    id === INSTAGRAM_CREATORS_BOX_ID ||
    id === PSYCHOGRAPHIC_BOX_ID ||
    id === PAIN_BOX_ID ||
    id === PASSION_BOX_ID ||
    id === EXPERIENCE_BOX_ID ||
    id === SKILL_BOX_ID ||
    id === ONE_OFF_BOX_ID ||
    id === ONGOING_CONTENT_BOX_ID ||
    id === HIGH_VALUE_PARTNERS_BOX_ID ||
    id === REINVEST_BOX_ID
  );
}

export type AudienceBoxTarget =
  | "demographic"
  | "instagram-creators"
  | "psychographic-traits"
  | "pain"
  | "passion"
  | "experience"
  | "skill"
  | "one-off"
  | "ongoing-content"
  | "high-value-partners"
  | "reinvest";

export function getAudienceBoxTarget(id: string): AudienceBoxTarget | null {
  if (id === DEMOGRAPHIC_BOX_ID) {
    return "demographic";
  }
  if (id === INSTAGRAM_CREATORS_BOX_ID) {
    return "instagram-creators";
  }
  if (id === PSYCHOGRAPHIC_BOX_ID) {
    return "psychographic-traits";
  }
  if (id === PAIN_BOX_ID) {
    return "pain";
  }
  if (id === PASSION_BOX_ID) {
    return "passion";
  }
  if (id === EXPERIENCE_BOX_ID) {
    return "experience";
  }
  if (id === SKILL_BOX_ID) {
    return "skill";
  }
  if (id === ONE_OFF_BOX_ID) {
    return "one-off";
  }
  if (id === ONGOING_CONTENT_BOX_ID) {
    return "ongoing-content";
  }
  if (id === HIGH_VALUE_PARTNERS_BOX_ID) {
    return "high-value-partners";
  }
  if (id === REINVEST_BOX_ID) {
    return "reinvest";
  }
  return null;
}

/** IDs the board delete toolbar / Delete key may act on (not static framework cards). */
export function isDeletableBoardId(id: string): boolean {
  if (isStaticCard(id) || id === MESSAGE_BOX_ID) {
    return false;
  }
  return true;
}

function collectPillarIdsForRemoval(
  vision: CreatorVision,
  ids: string[],
): {
  pillarIds: Set<string>;
  clearDemographicBox: boolean;
  clearInstagramCreatorsBox: boolean;
  clearPsychographicTraitsBox: boolean;
  clearPainBox: boolean;
  clearPassionBox: boolean;
  clearExperienceBox: boolean;
  clearSkillBox: boolean;
  clearOneOffBox: boolean;
  clearOngoingContentBox: boolean;
  clearHighValuePartnersBox: boolean;
  clearReinvestBox: boolean;
} {
  const pillarIds = new Set<string>();
  let clearDemographicBox = false;
  let clearInstagramCreatorsBox = false;
  let clearPsychographicTraitsBox = false;
  let clearPainBox = false;
  let clearPassionBox = false;
  let clearExperienceBox = false;
  let clearSkillBox = false;
  let clearOneOffBox = false;
  let clearOngoingContentBox = false;
  let clearHighValuePartnersBox = false;
  let clearReinvestBox = false;

  for (const id of ids) {
    if (isStaticCard(id)) {
      continue;
    }

    const audienceBoxTarget = getAudienceBoxTarget(id);
    if (audienceBoxTarget) {
      if (audienceBoxTarget === "demographic") {
        clearDemographicBox = true;
        for (const pillar of getDemographicPillars(vision.pillars)) {
          pillarIds.add(pillar.id);
        }
      } else if (audienceBoxTarget === "instagram-creators") {
        clearInstagramCreatorsBox = true;
        for (const pillar of getPsychographicCreatorPillars(vision.pillars)) {
          pillarIds.add(pillar.id);
        }
      } else if (audienceBoxTarget === "pain") {
        clearPainBox = true;
        for (const pillar of getPainPillars(vision.pillars)) {
          pillarIds.add(pillar.id);
        }
      } else if (audienceBoxTarget === "passion") {
        clearPassionBox = true;
        for (const pillar of getPassionPillars(vision.pillars)) {
          pillarIds.add(pillar.id);
        }
      } else if (audienceBoxTarget === "experience") {
        clearExperienceBox = true;
        for (const pillar of getExperiencePillars(vision.pillars)) {
          pillarIds.add(pillar.id);
        }
      } else if (audienceBoxTarget === "skill") {
        clearSkillBox = true;
        for (const pillar of getSkillPillars(vision.pillars)) {
          pillarIds.add(pillar.id);
        }
      } else if (audienceBoxTarget === "one-off") {
        clearOneOffBox = true;
        for (const pillar of getOneOffPillars(vision.pillars)) {
          pillarIds.add(pillar.id);
        }
      } else if (audienceBoxTarget === "ongoing-content") {
        clearOngoingContentBox = true;
        for (const pillar of getOngoingContentPillars(vision.pillars)) {
          pillarIds.add(pillar.id);
        }
      } else if (audienceBoxTarget === "high-value-partners") {
        clearHighValuePartnersBox = true;
        for (const pillar of getHighValuePartnersPillars(vision.pillars)) {
          pillarIds.add(pillar.id);
        }
      } else if (audienceBoxTarget === "reinvest") {
        clearReinvestBox = true;
        for (const pillar of getReinvestPillars(vision.pillars)) {
          pillarIds.add(pillar.id);
        }
      } else {
        clearPsychographicTraitsBox = true;
        for (const pillar of getPsychographicTraitPillars(vision.pillars)) {
          pillarIds.add(pillar.id);
        }
      }
      continue;
    }

    pillarIds.add(id);
  }

  for (const id of pillarIds) {
    if (isStaticCard(id)) {
      pillarIds.delete(id);
    }
  }

  return {
    pillarIds,
    clearDemographicBox,
    clearInstagramCreatorsBox,
    clearPsychographicTraitsBox,
    clearPainBox,
    clearPassionBox,
    clearExperienceBox,
    clearSkillBox,
    clearOneOffBox,
    clearOngoingContentBox,
    clearHighValuePartnersBox,
    clearReinvestBox,
  };
}

function getContentPillarIds(pillars: Pillar[]): Set<string> {
  return new Set(getContentPillars(pillars).map((pillar) => pillar.id));
}

export function ensureContentPillarsBoxConnection(
  connections: Connection[],
  pillars: Pillar[],
  hasMessage: boolean,
): Connection[] {
  const contentIds = getContentPillarIds(pillars);
  if (contentIds.size === 0 || !hasMessage) {
    return connections.filter(
      (connection) =>
        connection.fromPillarId !== MESSAGE_BOX_ID ||
        connection.toPillarId !== CONTENT_PILLARS_BOX_ID,
    );
  }

  const withoutLegacyMessageLinks = connections.filter((connection) => {
    if (connection.fromPillarId !== MESSAGE_BOX_ID) {
      return true;
    }

    return !contentIds.has(connection.toPillarId);
  });

  const hasBoxConnection = withoutLegacyMessageLinks.some(
    (connection) =>
      connection.fromPillarId === MESSAGE_BOX_ID &&
      connection.toPillarId === CONTENT_PILLARS_BOX_ID,
  );

  if (hasBoxConnection) {
    return withoutLegacyMessageLinks;
  }

  return ensureFrameworkToBoxConnection(
    withoutLegacyMessageLinks,
    MESSAGE_BOX_ID,
    CONTENT_PILLARS_BOX_ID,
    true,
  );
}

function ensureFrameworkToBoxConnection(
  connections: Connection[],
  fromCardId: string,
  boxId: string,
  hasItems: boolean,
): Connection[] {
  if (!hasItems) {
    return connections.filter(
      (connection) =>
        !(
          (connection.fromPillarId === fromCardId &&
            connection.toPillarId === boxId) ||
          (connection.fromPillarId === boxId && connection.toPillarId === fromCardId)
        ),
    );
  }

  const hasBoxConnection = connections.some(
    (connection) =>
      connection.fromPillarId === fromCardId && connection.toPillarId === boxId,
  );

  if (hasBoxConnection) {
    return connections;
  }

  return [
    ...connections,
    {
      id: `default-${fromCardId}-${boxId}`,
      fromPillarId: fromCardId,
      fromAnchor: "bottom",
      toPillarId: boxId,
      toAnchor: "top",
    },
  ];
}

export function ensureDemographicBoxConnection(
  connections: Connection[],
  pillars: Pillar[],
): Connection[] {
  return ensureFrameworkToBoxConnection(
    connections,
    FRAMEWORK_CARD_IDS.demographic,
    DEMOGRAPHIC_BOX_ID,
    getDemographicPillars(pillars).length > 0,
  );
}

export function ensureInstagramCreatorsBoxConnection(
  connections: Connection[],
  pillars: Pillar[],
): Connection[] {
  return ensureFrameworkToBoxConnection(
    connections,
    FRAMEWORK_CARD_IDS.psychographic,
    INSTAGRAM_CREATORS_BOX_ID,
    getPsychographicCreatorPillars(pillars).length > 0,
  );
}

export function ensurePsychographicTraitsBoxConnection(
  connections: Connection[],
  pillars: Pillar[],
): Connection[] {
  return ensureFrameworkToBoxConnection(
    connections,
    FRAMEWORK_CARD_IDS.psychographic,
    PSYCHOGRAPHIC_BOX_ID,
    getPsychographicTraitPillars(pillars).length > 0,
  );
}

export function ensurePainBoxConnection(
  connections: Connection[],
  pillars: Pillar[],
): Connection[] {
  return ensureFrameworkToBoxConnection(
    connections,
    FRAMEWORK_CARD_IDS.pain,
    PAIN_BOX_ID,
    getPainPillars(pillars).length > 0,
  );
}

export function ensurePassionBoxConnection(
  connections: Connection[],
  pillars: Pillar[],
): Connection[] {
  return ensureFrameworkToBoxConnection(
    connections,
    FRAMEWORK_CARD_IDS.passion,
    PASSION_BOX_ID,
    getPassionPillars(pillars).length > 0,
  );
}

export function ensureExperienceBoxConnection(
  connections: Connection[],
  pillars: Pillar[],
): Connection[] {
  return ensureFrameworkToBoxConnection(
    connections,
    FRAMEWORK_CARD_IDS.experience,
    EXPERIENCE_BOX_ID,
    getExperiencePillars(pillars).length > 0,
  );
}

export function ensureSkillBoxConnection(
  connections: Connection[],
  pillars: Pillar[],
): Connection[] {
  return ensureFrameworkToBoxConnection(
    connections,
    FRAMEWORK_CARD_IDS.skill,
    SKILL_BOX_ID,
    getSkillPillars(pillars).length > 0,
  );
}

export function ensureOneOffBoxConnection(
  connections: Connection[],
  pillars: Pillar[],
): Connection[] {
  return ensureFrameworkToBoxConnection(
    connections,
    FRAMEWORK_CARD_IDS.oneOff,
    ONE_OFF_BOX_ID,
    getOneOffPillars(pillars).length > 0,
  );
}

export function ensureOngoingContentBoxConnection(
  connections: Connection[],
  pillars: Pillar[],
): Connection[] {
  return ensureFrameworkToBoxConnection(
    connections,
    FRAMEWORK_CARD_IDS.ongoingContent,
    ONGOING_CONTENT_BOX_ID,
    getOngoingContentPillars(pillars).length > 0,
  );
}

export function ensureHighValuePartnersBoxConnection(
  connections: Connection[],
  pillars: Pillar[],
): Connection[] {
  return ensureFrameworkToBoxConnection(
    connections,
    FRAMEWORK_CARD_IDS.highValuePartners,
    HIGH_VALUE_PARTNERS_BOX_ID,
    getHighValuePartnersPillars(pillars).length > 0,
  );
}

export function ensureReinvestBoxConnection(
  connections: Connection[],
  pillars: Pillar[],
): Connection[] {
  return ensureFrameworkToBoxConnection(
    connections,
    FRAMEWORK_CARD_IDS.reinvest,
    REINVEST_BOX_ID,
    getReinvestPillars(pillars).length > 0,
  );
}

export function ensureEcosystemBoxConnections(
  connections: Connection[],
  pillars: Pillar[],
): Connection[] {
  return ensureReinvestBoxConnection(
    ensureHighValuePartnersBoxConnection(
      ensureOngoingContentBoxConnection(
        ensureOneOffBoxConnection(connections, pillars),
        pillars,
      ),
      pillars,
    ),
    pillars,
  );
}

export function ensureUniquenessBoxConnections(
  connections: Connection[],
  pillars: Pillar[],
): Connection[] {
  return ensureSkillBoxConnection(
    ensureExperienceBoxConnection(
      ensurePassionBoxConnection(ensurePainBoxConnection(connections, pillars), pillars),
      pillars,
    ),
    pillars,
  );
}

export function ensureAudienceBoxConnections(
  connections: Connection[],
  pillars: Pillar[],
): Connection[] {
  return ensureEcosystemBoxConnections(
    ensureUniquenessBoxConnections(
      ensurePsychographicTraitsBoxConnection(
        ensureInstagramCreatorsBoxConnection(
          ensureDemographicBoxConnection(connections, pillars),
          pillars,
        ),
        pillars,
      ),
      pillars,
    ),
    pillars,
  );
}

export function createDefaultFrameworkConnections(): Connection[] {
  return VISION_FRAMEWORK_CARDS.map((card) => ({
    id: `default-${VISION_CARD_ID}-${card.id}`,
    fromPillarId: VISION_CARD_ID,
    fromAnchor: "bottom" as const,
    toPillarId: card.id,
    toAnchor: "top" as const,
  }));
}

export function createDefaultWhoSubtreeConnections(): Connection[] {
  return WHO_SUBTREE_CONNECTION_SPECS.map(({ fromId, toId }) => ({
    id: `default-${fromId}-${toId}`,
    fromPillarId: fromId,
    fromAnchor: "bottom" as const,
    toPillarId: toId,
    toAnchor: "top" as const,
  }));
}

export function createDefaultUniquenessSubtreeConnections(): Connection[] {
  return UNIQUENESS_SUBTREE_CONNECTION_SPECS.map(({ fromId, toId }) => ({
    id: `default-${fromId}-${toId}`,
    fromPillarId: fromId,
    fromAnchor: "bottom" as const,
    toPillarId: toId,
    toAnchor: "top" as const,
  }));
}

export function createDefaultMonetizationSubtreeConnections(): Connection[] {
  return MONETIZATION_SUBTREE_CONNECTION_SPECS.map(({ fromId, toId }) => ({
    id: `default-${fromId}-${toId}`,
    fromPillarId: fromId,
    fromAnchor: "bottom" as const,
    toPillarId: toId,
    toAnchor: "top" as const,
  }));
}

export function ensureWhatMessageConnection(
  connections: Connection[],
  pillars: Pillar[],
  _hasMessage: boolean,
): Connection[] {
  const whatId = FRAMEWORK_CARD_IDS.what;
  if (!pillars.some((pillar) => pillar.id === whatId)) {
    return connections;
  }

  const hasConnection = connections.some(
    (connection) =>
      (connection.fromPillarId === whatId &&
        connection.toPillarId === MESSAGE_BOX_ID) ||
      (connection.fromPillarId === MESSAGE_BOX_ID &&
        connection.toPillarId === whatId),
  );

  if (hasConnection) {
    return connections;
  }

  return [
    ...connections,
    {
      id: `default-${whatId}-${MESSAGE_BOX_ID}`,
      fromPillarId: whatId,
      fromAnchor: "bottom",
      toPillarId: MESSAGE_BOX_ID,
      toAnchor: "top",
    },
  ];
}

export function ensureFrameworkConnections(
  connections: Connection[],
  pillars: Pillar[],
): Connection[] {
  const pillarIds = new Set(pillars.map((pillar) => pillar.id));
  const nextConnections = [...connections];

  for (const card of VISION_FRAMEWORK_CARDS) {
    if (!pillarIds.has(VISION_CARD_ID) || !pillarIds.has(card.id)) {
      continue;
    }

    const hasConnection = nextConnections.some(
      (connection) =>
        (connection.fromPillarId === VISION_CARD_ID &&
          connection.toPillarId === card.id) ||
        (connection.fromPillarId === card.id &&
          connection.toPillarId === VISION_CARD_ID),
    );

    if (hasConnection) {
      continue;
    }

    const visionCard = getVisionCard(pillars) ?? createDefaultVisionCard();
    const frameworkCard =
      pillars.find((pillar) => pillar.id === card.id) ??
      createDefaultFrameworkCards().find((pillar) => pillar.id === card.id)!;
    const anchors = inferDefaultAnchors(visionCard, frameworkCard);

    nextConnections.push({
      id: `default-${VISION_CARD_ID}-${card.id}`,
      fromPillarId: VISION_CARD_ID,
      fromAnchor: anchors.fromAnchor,
      toPillarId: card.id,
      toAnchor: anchors.toAnchor,
    });
  }

  return nextConnections;
}

export function ensureWhoSubtreeConnections(
  connections: Connection[],
  pillars: Pillar[],
): Connection[] {
  const pillarMap = new Map(pillars.map((pillar) => [pillar.id, pillar]));
  const nextConnections = [...connections];

  for (const { fromId, toId } of WHO_SUBTREE_CONNECTION_SPECS) {
    const fromPillar = pillarMap.get(fromId);
    const toPillar = pillarMap.get(toId);

    if (!fromPillar || !toPillar) {
      continue;
    }

    const hasConnection = nextConnections.some(
      (connection) =>
        (connection.fromPillarId === fromId && connection.toPillarId === toId) ||
        (connection.fromPillarId === toId && connection.toPillarId === fromId),
    );

    if (hasConnection) {
      continue;
    }

    const anchors = inferDefaultAnchors(fromPillar, toPillar);

    nextConnections.push({
      id: `default-${fromId}-${toId}`,
      fromPillarId: fromId,
      fromAnchor: anchors.fromAnchor,
      toPillarId: toId,
      toAnchor: anchors.toAnchor,
    });
  }

  return nextConnections;
}

export function ensureUniquenessSubtreeConnections(
  connections: Connection[],
  pillars: Pillar[],
): Connection[] {
  const pillarMap = new Map(pillars.map((pillar) => [pillar.id, pillar]));
  const nextConnections = [...connections];

  for (const { fromId, toId } of UNIQUENESS_SUBTREE_CONNECTION_SPECS) {
    const fromPillar = pillarMap.get(fromId);
    const toPillar = pillarMap.get(toId);

    if (!fromPillar || !toPillar) {
      continue;
    }

    const hasConnection = nextConnections.some(
      (connection) =>
        (connection.fromPillarId === fromId && connection.toPillarId === toId) ||
        (connection.fromPillarId === toId && connection.toPillarId === fromId),
    );

    if (hasConnection) {
      continue;
    }

    const anchors = inferDefaultAnchors(fromPillar, toPillar);

    nextConnections.push({
      id: `default-${fromId}-${toId}`,
      fromPillarId: fromId,
      fromAnchor: anchors.fromAnchor,
      toPillarId: toId,
      toAnchor: anchors.toAnchor,
    });
  }

  return nextConnections;
}

export function ensureMonetizationSubtreeConnections(
  connections: Connection[],
  pillars: Pillar[],
): Connection[] {
  const pillarMap = new Map(pillars.map((pillar) => [pillar.id, pillar]));
  const nextConnections = [...connections];

  for (const { fromId, toId } of MONETIZATION_SUBTREE_CONNECTION_SPECS) {
    const fromPillar = pillarMap.get(fromId);
    const toPillar = pillarMap.get(toId);

    if (!fromPillar || !toPillar) {
      continue;
    }

    const hasConnection = nextConnections.some(
      (connection) =>
        (connection.fromPillarId === fromId && connection.toPillarId === toId) ||
        (connection.fromPillarId === toId && connection.toPillarId === fromId),
    );

    if (hasConnection) {
      continue;
    }

    const anchors = inferDefaultAnchors(fromPillar, toPillar);

    nextConnections.push({
      id: `default-${fromId}-${toId}`,
      fromPillarId: fromId,
      fromAnchor: anchors.fromAnchor,
      toPillarId: toId,
      toAnchor: anchors.toAnchor,
    });
  }

  return nextConnections;
}

export function createEmptyVision(): CreatorVision {
  const pillars = createDefaultStaticPillars();

  return {
    message: "",
    layoutVersion: BOARD_LAYOUT_VERSION,
    pillars,
    connections: [
      ...createDefaultFrameworkConnections(),
      ...createDefaultWhoSubtreeConnections(),
      ...createDefaultUniquenessSubtreeConnections(),
      ...createDefaultMonetizationSubtreeConnections(),
      {
        id: `default-${FRAMEWORK_CARD_IDS.what}-${MESSAGE_BOX_ID}`,
        fromPillarId: FRAMEWORK_CARD_IDS.what,
        fromAnchor: "bottom",
        toPillarId: MESSAGE_BOX_ID,
        toAnchor: "top",
      },
    ],
    updatedAt: Date.now(),
  };
}

export function loadVision(): CreatorVision {
  if (typeof window === "undefined") {
    return createEmptyVision();
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createEmptyVision();
    }

    const parsed = JSON.parse(raw) as CreatorVision;
    const layoutMigration = needsLayoutVersionMigration(parsed);
    const pillars = ensureStaticCards(
      getStaticPillars(
        Array.isArray(parsed.pillars)
          ? parsed.pillars.map((pillar) => {
              if (pillar.width === undefined && pillar.height === undefined) {
                return pillar;
              }

              const size = clampPillarSize({
                width: pillar.width ?? PILLAR_CARD_WIDTH,
                height: pillar.height ?? PILLAR_CARD_HEIGHT,
              });

              return {
                ...pillar,
                width: size.width,
                height: size.height,
              };
            })
          : [],
        { forceCanonicalLayout: layoutMigration },
      ),
    );
    const pillarMap = new Map(pillars.map((pillar) => [pillar.id, pillar]));

    const message = parsed.message ?? "";
    const hasMessage = message.trim().length > 0;
    const connections = ensureAudienceBoxConnections(
      ensureContentPillarsBoxConnection(
        ensureWhatMessageConnection(
          ensureMonetizationSubtreeConnections(
            ensureUniquenessSubtreeConnections(
              ensureWhoSubtreeConnections(
                ensureFrameworkConnections(
                Array.isArray(parsed.connections)
                  ? parsed.connections.map((connection) => {
                      const fromPillar = pillarMap.get(connection.fromPillarId);
                      const toPillar = pillarMap.get(connection.toPillarId);
                      const defaults =
                        fromPillar && toPillar
                          ? inferDefaultAnchors(fromPillar, toPillar)
                          : { fromAnchor: "right" as const, toAnchor: "left" as const };

                      return {
                        id: connection.id,
                        fromPillarId: connection.fromPillarId,
                        toPillarId: connection.toPillarId,
                        fromAnchor: connection.fromAnchor ?? defaults.fromAnchor,
                        toAnchor: connection.toAnchor ?? defaults.toAnchor,
                      };
                    })
                  : [],
                  pillars,
                ),
                pillars,
              ),
              pillars,
            ),
            pillars,
          ),
          pillars,
          hasMessage,
        ),
        pillars,
        hasMessage,
      ),
      pillars,
    );

    const messageBoxPosition =
      parsed.messageBoxPosition &&
      typeof parsed.messageBoxPosition.x === "number" &&
      typeof parsed.messageBoxPosition.y === "number"
        ? {
            x: parsed.messageBoxPosition.x,
            y: parsed.messageBoxPosition.y,
          }
        : undefined;

    const contentPillarsBoxPosition =
      parsed.contentPillarsBoxPosition &&
      typeof parsed.contentPillarsBoxPosition.x === "number" &&
      typeof parsed.contentPillarsBoxPosition.y === "number"
        ? {
            x: parsed.contentPillarsBoxPosition.x,
            y: parsed.contentPillarsBoxPosition.y,
          }
        : undefined;

    const demographicBoxPosition =
      parsed.demographicBoxPosition &&
      typeof parsed.demographicBoxPosition.x === "number" &&
      typeof parsed.demographicBoxPosition.y === "number"
        ? {
            x: parsed.demographicBoxPosition.x,
            y: parsed.demographicBoxPosition.y,
          }
        : undefined;

    const instagramCreatorsBoxPosition =
      parsed.instagramCreatorsBoxPosition &&
      typeof parsed.instagramCreatorsBoxPosition.x === "number" &&
      typeof parsed.instagramCreatorsBoxPosition.y === "number"
        ? {
            x: parsed.instagramCreatorsBoxPosition.x,
            y: parsed.instagramCreatorsBoxPosition.y,
          }
        : undefined;

    const psychographicBoxPosition =
      parsed.psychographicBoxPosition &&
      typeof parsed.psychographicBoxPosition.x === "number" &&
      typeof parsed.psychographicBoxPosition.y === "number"
        ? {
            x: parsed.psychographicBoxPosition.x,
            y: parsed.psychographicBoxPosition.y,
          }
        : undefined;

    const painBoxPosition =
      parsed.painBoxPosition &&
      typeof parsed.painBoxPosition.x === "number" &&
      typeof parsed.painBoxPosition.y === "number"
        ? {
            x: parsed.painBoxPosition.x,
            y: parsed.painBoxPosition.y,
          }
        : undefined;

    const passionBoxPosition =
      parsed.passionBoxPosition &&
      typeof parsed.passionBoxPosition.x === "number" &&
      typeof parsed.passionBoxPosition.y === "number"
        ? {
            x: parsed.passionBoxPosition.x,
            y: parsed.passionBoxPosition.y,
          }
        : undefined;

    const experienceBoxPosition =
      parsed.experienceBoxPosition &&
      typeof parsed.experienceBoxPosition.x === "number" &&
      typeof parsed.experienceBoxPosition.y === "number"
        ? {
            x: parsed.experienceBoxPosition.x,
            y: parsed.experienceBoxPosition.y,
          }
        : undefined;

    const skillBoxPosition =
      parsed.skillBoxPosition &&
      typeof parsed.skillBoxPosition.x === "number" &&
      typeof parsed.skillBoxPosition.y === "number"
        ? {
            x: parsed.skillBoxPosition.x,
            y: parsed.skillBoxPosition.y,
          }
        : undefined;

    const oneOffBoxPosition =
      parsed.oneOffBoxPosition &&
      typeof parsed.oneOffBoxPosition.x === "number" &&
      typeof parsed.oneOffBoxPosition.y === "number"
        ? {
            x: parsed.oneOffBoxPosition.x,
            y: parsed.oneOffBoxPosition.y,
          }
        : undefined;

    const ongoingContentBoxPosition =
      parsed.ongoingContentBoxPosition &&
      typeof parsed.ongoingContentBoxPosition.x === "number" &&
      typeof parsed.ongoingContentBoxPosition.y === "number"
        ? {
            x: parsed.ongoingContentBoxPosition.x,
            y: parsed.ongoingContentBoxPosition.y,
          }
        : undefined;

    const highValuePartnersBoxPosition =
      parsed.highValuePartnersBoxPosition &&
      typeof parsed.highValuePartnersBoxPosition.x === "number" &&
      typeof parsed.highValuePartnersBoxPosition.y === "number"
        ? {
            x: parsed.highValuePartnersBoxPosition.x,
            y: parsed.highValuePartnersBoxPosition.y,
          }
        : undefined;

    const reinvestBoxPosition =
      parsed.reinvestBoxPosition &&
      typeof parsed.reinvestBoxPosition.x === "number" &&
      typeof parsed.reinvestBoxPosition.y === "number"
        ? {
            x: parsed.reinvestBoxPosition.x,
            y: parsed.reinvestBoxPosition.y,
          }
        : undefined;

    const visionBeforeBoxes: CreatorVision = {
      message,
      layoutVersion: BOARD_LAYOUT_VERSION,
      pillars,
      connections,
      messageBoxPosition,
      contentPillarsBoxPosition,
      demographicBoxPosition,
      instagramCreatorsBoxPosition,
      psychographicBoxPosition,
      painBoxPosition,
      passionBoxPosition,
      experienceBoxPosition,
      skillBoxPosition,
      oneOffBoxPosition,
      ongoingContentBoxPosition,
      highValuePartnersBoxPosition,
      reinvestBoxPosition,
      updatedAt: parsed.updatedAt ?? Date.now(),
    };

    return migrateVisionBoxPositions(
      layoutMigration ? clearStoredBoxPositions(visionBeforeBoxes) : visionBeforeBoxes,
    );
  } catch {
    return createEmptyVision();
  }
}

export function saveVision(vision: CreatorVision): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      ...vision,
      layoutVersion: vision.layoutVersion ?? BOARD_LAYOUT_VERSION,
      updatedAt: Date.now(),
    }),
  );
}

function getMessageBoxPillarForPlacement(vision: CreatorVision): Pillar {
  const whatCard = vision.pillars.find((pillar) => pillar.id === FRAMEWORK_CARD_IDS.what);

  if (!whatCard) {
    const fallbackWhat = CANONICAL_FRAMEWORK_BY_ID.get(FRAMEWORK_CARD_IDS.what)!;
    const position = getDefaultMessageBoxPosition({
      id: FRAMEWORK_CARD_IDS.what,
      label: "WHAT",
      x: fallbackWhat.x,
      y: fallbackWhat.y,
    });
    return {
      id: MESSAGE_BOX_ID,
      label: "Message",
      x: position.x,
      y: position.y,
      width: MESSAGE_BOX_WIDTH,
      height: MESSAGE_BOX_MIN_HEIGHT,
    };
  }

  return resolveMessageBoxPillar(
    whatCard,
    MESSAGE_BOX_ID,
    vision.messageBoxPosition,
    MESSAGE_BOX_MIN_HEIGHT,
  );
}

function normalizeContainerLabels(
  labels: string[],
  container: PillarContainer,
): string[] {
  if (container !== "demographic") {
    return labels;
  }

  return labels.map((label) => clampDemographicAgeRangeInLabel(label));
}

function createPillarsForContainer(
  labels: string[],
  container: PillarContainer,
  height: number,
  psychographicKind?: PsychographicKind,
): Pillar[] {
  const normalizedLabels = normalizeContainerLabels(labels, container);

  return normalizedLabels.map((label) => ({
    id: crypto.randomUUID(),
    label,
    x: 0,
    y: 0,
    height,
    container,
    ...(container === "psychographic" && psychographicKind
      ? { psychographicKind }
      : {}),
  }));
}

function appendPillarsToVision(
  vision: CreatorVision,
  labels: string[],
  container: PillarContainer,
): CreatorVision {
  if (labels.length === 0) {
    return vision;
  }

  const height =
    container === "content"
      ? getContentPillarHeightFromMessageBox(getMessageBoxPillarForPlacement(vision))
      : PILLAR_CARD_HEIGHT;

  const psychographicKind = container === "psychographic" ? "trait" : undefined;
  const newPillars = createPillarsForContainer(
    labels,
    container,
    height,
    psychographicKind,
  );
  const hasMessage = vision.message.trim().length > 0;
  const nextVision = {
    ...vision,
    pillars: [...vision.pillars, ...newPillars],
    updatedAt: Date.now(),
  };

  let connections = nextVision.connections;
  if (container === "content") {
    connections = ensureContentPillarsBoxConnection(
      connections,
      nextVision.pillars,
      hasMessage,
    );
  } else if (
    container === "pain" ||
    container === "passion" ||
    container === "experience" ||
    container === "skill"
  ) {
    connections = ensureUniquenessBoxConnections(connections, nextVision.pillars);
  } else if (
    container === "one-off" ||
    container === "ongoing-content" ||
    container === "high-value-partners" ||
    container === "reinvest"
  ) {
    connections = ensureEcosystemBoxConnections(connections, nextVision.pillars);
  } else {
    connections = ensureAudienceBoxConnections(connections, nextVision.pillars);
  }

  return {
    ...nextVision,
    connections,
    updatedAt: Date.now(),
  };
}

function replaceContainerPillars(
  vision: CreatorVision,
  labels: string[],
  container: PillarContainer,
): CreatorVision {
  const withoutContainer = vision.pillars.filter(
    (pillar) => isStaticCard(pillar) || getPillarContainer(pillar) !== container,
  );

  return appendPillarsToVision(
    { ...vision, pillars: withoutContainer, updatedAt: Date.now() },
    labels,
    container,
  );
}

export function setMessage(vision: CreatorVision, message: string): CreatorVision {
  const hasMessage = message.trim().length > 0;
  const nextVision = { ...vision, message, updatedAt: Date.now() };

  return {
    ...nextVision,
    connections: ensureContentPillarsBoxConnection(
      ensureWhatMessageConnection(
        nextVision.connections,
        nextVision.pillars,
        hasMessage,
      ),
      nextVision.pillars,
      hasMessage,
    ),
  };
}

export function setPillars(vision: CreatorVision, pillars: Pillar[]): CreatorVision {
  const staticCards = getStaticPillars(vision.pillars);
  const staticIds = new Set(staticCards.map((pillar) => pillar.id));
  const contentPillars = pillars.filter((pillar) => !isStaticCard(pillar));
  const staticConnections = vision.connections.filter(
    (connection) =>
      staticIds.has(connection.fromPillarId) && staticIds.has(connection.toPillarId),
  );
  const nextPillars = [...staticCards, ...contentPillars];
  const hasMessage = vision.message.trim().length > 0;

  return {
    ...vision,
    pillars: nextPillars,
    connections: ensureAudienceBoxConnections(
      ensureContentPillarsBoxConnection(
        ensureWhatMessageConnection(staticConnections, nextPillars, hasMessage),
        nextPillars,
        hasMessage,
      ),
      nextPillars,
    ),
    updatedAt: Date.now(),
  };
}

export function updatePillarSize(
  vision: CreatorVision,
  id: string,
  width: number,
  height: number,
): CreatorVision {
  const nextSize = clampPillarSize({ width, height });

  return {
    ...vision,
    pillars: vision.pillars.map((pillar) =>
      pillar.id === id
        ? { ...pillar, width: nextSize.width, height: nextSize.height }
        : pillar,
    ),
    updatedAt: Date.now(),
  };
}

export function updatePillarPosition(
  vision: CreatorVision,
  id: string,
  x: number,
  y: number,
): CreatorVision {
  return {
    ...vision,
    pillars: vision.pillars.map((pillar) =>
      pillar.id === id ? { ...pillar, x, y } : pillar,
    ),
    updatedAt: Date.now(),
  };
}

export function updatePillarLabel(
  vision: CreatorVision,
  id: string,
  label: string,
): CreatorVision {
  const target = vision.pillars.find((pillar) => pillar.id === id);
  const normalizedLabel =
    target && getPillarContainer(target) === "demographic"
      ? clampDemographicAgeRangeInLabel(label)
      : label;

  return {
    ...vision,
    pillars: vision.pillars.map((pillar) =>
      pillar.id === id ? { ...pillar, label: normalizedLabel } : pillar,
    ),
    updatedAt: Date.now(),
  };
}

export function addPillar(vision: CreatorVision, label = "New pillar"): CreatorVision {
  return appendPillarsToVision(vision, [label], "content");
}

export function addPillarsFromLabels(
  vision: CreatorVision,
  labels: string[],
  container: PillarContainer = "content",
): CreatorVision {
  return appendPillarsToVision(vision, labels, container);
}

export function setAudiencePillarsFromLabels(
  vision: CreatorVision,
  labels: string[],
  container: "demographic" | "psychographic",
): CreatorVision {
  return replaceContainerPillars(vision, labels, container);
}

export function setPainPillarsFromLabels(
  vision: CreatorVision,
  labels: string[],
): CreatorVision {
  return replaceContainerPillars(vision, labels, "pain");
}

export function setPassionPillarsFromLabels(
  vision: CreatorVision,
  labels: string[],
): CreatorVision {
  return replaceContainerPillars(vision, labels, "passion");
}

export function setExperiencePillarsFromLabels(
  vision: CreatorVision,
  labels: string[],
): CreatorVision {
  return replaceContainerPillars(vision, labels, "experience");
}

export function setSkillPillarsFromLabels(
  vision: CreatorVision,
  labels: string[],
): CreatorVision {
  return replaceContainerPillars(vision, labels, "skill");
}

export function setOneOffPillarsFromLabels(
  vision: CreatorVision,
  labels: string[],
): CreatorVision {
  return replaceContainerPillars(vision, labels, "one-off");
}

export function setOngoingContentPillarsFromLabels(
  vision: CreatorVision,
  labels: string[],
): CreatorVision {
  return replaceContainerPillars(vision, labels, "ongoing-content");
}

export function setHighValuePartnersPillarsFromLabels(
  vision: CreatorVision,
  labels: string[],
): CreatorVision {
  return replaceContainerPillars(vision, labels, "high-value-partners");
}

export function setReinvestPillarsFromLabels(
  vision: CreatorVision,
  labels: string[],
): CreatorVision {
  return replaceContainerPillars(vision, labels, "reinvest");
}

export function setEcosystemFromGeneration(
  vision: CreatorVision,
  data: EcosystemGeneration,
  category?: EcosystemCategory,
): CreatorVision {
  let nextVision = vision;

  if (!category) {
    nextVision = setOneOffPillarsFromLabels(nextVision, data.oneOff);
    nextVision = setOngoingContentPillarsFromLabels(nextVision, data.ongoingContent);
    nextVision = setHighValuePartnersPillarsFromLabels(nextVision, data.highValuePartners);
    nextVision = setReinvestPillarsFromLabels(nextVision, data.reinvest);
  } else {
    switch (category) {
      case "oneOff":
        nextVision = setOneOffPillarsFromLabels(nextVision, data.oneOff);
        break;
      case "ongoingContent":
        nextVision = setOngoingContentPillarsFromLabels(nextVision, data.ongoingContent);
        break;
      case "highValuePartners":
        nextVision = setHighValuePartnersPillarsFromLabels(nextVision, data.highValuePartners);
        break;
      case "reinvest":
        nextVision = setReinvestPillarsFromLabels(nextVision, data.reinvest);
        break;
    }
  }

  return {
    ...nextVision,
    connections: ensureEcosystemBoxConnections(nextVision.connections, nextVision.pillars),
    updatedAt: Date.now(),
  };
}

export function addPainPillar(
  vision: CreatorVision,
  label = "New pain point",
): CreatorVision {
  return appendPillarsToVision(vision, [label], "pain");
}

export function addPassionPillar(
  vision: CreatorVision,
  label = "New passion point",
): CreatorVision {
  return appendPillarsToVision(vision, [label], "passion");
}

export function addExperiencePillar(
  vision: CreatorVision,
  label = "New experience",
): CreatorVision {
  return appendPillarsToVision(vision, [label], "experience");
}

export function addSkillPillar(
  vision: CreatorVision,
  label = "New skill",
): CreatorVision {
  return appendPillarsToVision(vision, [label], "skill");
}

export function addOneOffPillar(
  vision: CreatorVision,
  label = "New one-off offer",
): CreatorVision {
  return appendPillarsToVision(vision, [label], "one-off");
}

export function addOngoingContentPillar(
  vision: CreatorVision,
  label = "New recurring offer",
): CreatorVision {
  return appendPillarsToVision(vision, [label], "ongoing-content");
}

export function addHighValuePartnersPillar(
  vision: CreatorVision,
  label = "New partnership",
): CreatorVision {
  return appendPillarsToVision(vision, [label], "high-value-partners");
}

export function addReinvestPillar(
  vision: CreatorVision,
  label = "New reinvest idea",
): CreatorVision {
  return appendPillarsToVision(vision, [label], "reinvest");
}

export function setPsychographicTraitsFromSuggestions(
  vision: CreatorVision,
  traits: string[],
): CreatorVision {
  const preservedCreators = getPsychographicCreatorPillars(vision.pillars);
  const withoutPsychographic = vision.pillars.filter(
    (pillar) => isStaticCard(pillar) || getPillarContainer(pillar) !== "psychographic",
  );

  const height = PILLAR_CARD_HEIGHT;
  const newTraits = createPillarsForContainer(traits, "psychographic", height, "trait");

  const nextVision = {
    ...vision,
    pillars: [...withoutPsychographic, ...preservedCreators, ...newTraits],
    updatedAt: Date.now(),
  };

  return {
    ...nextVision,
    connections: ensureAudienceBoxConnections(nextVision.connections, nextVision.pillars),
    updatedAt: Date.now(),
  };
}

export function addPsychographicCreatorPillar(
  vision: CreatorVision,
  label = "",
): CreatorVision {
  return appendPsychographicPillars(vision, [label], "creator");
}

export function addPsychographicTraitPillar(
  vision: CreatorVision,
  label = "New trait",
): CreatorVision {
  return appendPsychographicPillars(vision, [label], "trait");
}

function appendPsychographicPillars(
  vision: CreatorVision,
  labels: string[],
  kind: PsychographicKind,
): CreatorVision {
  if (labels.length === 0) {
    return vision;
  }

  const newPillars = createPillarsForContainer(
    labels,
    "psychographic",
    PILLAR_CARD_HEIGHT,
    kind,
  );
  const nextVision = {
    ...vision,
    pillars: [...vision.pillars, ...newPillars],
    updatedAt: Date.now(),
  };

  return {
    ...nextVision,
    connections: ensureAudienceBoxConnections(nextVision.connections, nextVision.pillars),
    updatedAt: Date.now(),
  };
}

export function removePillar(vision: CreatorVision, id: string): CreatorVision {
  return removePillars(vision, [id]);
}

export function removePillars(vision: CreatorVision, ids: string[]): CreatorVision {
  const {
    pillarIds,
    clearDemographicBox,
    clearInstagramCreatorsBox,
    clearPsychographicTraitsBox,
    clearPainBox,
    clearPassionBox,
    clearExperienceBox,
    clearSkillBox,
    clearOneOffBox,
    clearOngoingContentBox,
    clearHighValuePartnersBox,
    clearReinvestBox,
  } = collectPillarIdsForRemoval(vision, ids);

  if (
    pillarIds.size === 0 &&
    !clearDemographicBox &&
    !clearInstagramCreatorsBox &&
    !clearPsychographicTraitsBox &&
    !clearPainBox &&
    !clearPassionBox &&
    !clearExperienceBox &&
    !clearSkillBox &&
    !clearOneOffBox &&
    !clearOngoingContentBox &&
    !clearHighValuePartnersBox &&
    !clearReinvestBox
  ) {
    return vision;
  }

  const nextPillars = ensureStaticCards(
    vision.pillars.filter((pillar) => !pillarIds.has(pillar.id)),
  );
  const hasMessage = vision.message.trim().length > 0;

  const filteredConnections = vision.connections.filter(
    (connection) =>
      !pillarIds.has(connection.fromPillarId) && !pillarIds.has(connection.toPillarId),
  );

  return {
    ...vision,
    pillars: nextPillars,
    ...(clearDemographicBox ? { demographicBoxPosition: undefined } : {}),
    ...(clearInstagramCreatorsBox ? { instagramCreatorsBoxPosition: undefined } : {}),
    ...(clearPsychographicTraitsBox ? { psychographicBoxPosition: undefined } : {}),
    ...(clearPainBox ? { painBoxPosition: undefined } : {}),
    ...(clearPassionBox ? { passionBoxPosition: undefined } : {}),
    ...(clearExperienceBox ? { experienceBoxPosition: undefined } : {}),
    ...(clearSkillBox ? { skillBoxPosition: undefined } : {}),
    ...(clearOneOffBox ? { oneOffBoxPosition: undefined } : {}),
    ...(clearOngoingContentBox ? { ongoingContentBoxPosition: undefined } : {}),
    ...(clearHighValuePartnersBox ? { highValuePartnersBoxPosition: undefined } : {}),
    ...(clearReinvestBox ? { reinvestBoxPosition: undefined } : {}),
    connections: ensureAudienceBoxConnections(
      ensureContentPillarsBoxConnection(filteredConnections, nextPillars, hasMessage),
      nextPillars,
    ),
    updatedAt: Date.now(),
  };
}

export function moveMessageBox(
  vision: CreatorVision,
  delta: { x: number; y: number },
): CreatorVision {
  if (delta.x === 0 && delta.y === 0) {
    return vision;
  }

  const whatCard = vision.pillars.find((pillar) => pillar.id === FRAMEWORK_CARD_IDS.what);
  if (!whatCard) {
    return vision;
  }

  const current = resolveMessageBoxPillar(
    whatCard,
    MESSAGE_BOX_ID,
    vision.messageBoxPosition,
    MESSAGE_BOX_MIN_HEIGHT,
  );

  return {
    ...vision,
    messageBoxPosition: {
      x: Math.max(0, current.x + delta.x),
      y: Math.max(0, current.y + delta.y),
    },
    updatedAt: Date.now(),
  };
}

export function moveContentPillarsBox(
  vision: CreatorVision,
  delta: { x: number; y: number },
): CreatorVision {
  if (delta.x === 0 && delta.y === 0) {
    return vision;
  }

  if (getContentPillars(vision.pillars).length === 0) {
    return vision;
  }

  const messageBox = getMessageBoxPillarForPlacement(vision);
  const current = resolveContentPillarsBoxPillar(
    messageBox,
    CONTENT_PILLARS_BOX_ID,
    getContentPillars(vision.pillars).length,
    vision.contentPillarsBoxPosition,
  );

  return {
    ...vision,
    contentPillarsBoxPosition: {
      x: Math.max(0, current.x + delta.x),
      y: Math.max(0, current.y + delta.y),
    },
    updatedAt: Date.now(),
  };
}

function moveDemographicAudienceBox(
  vision: CreatorVision,
  delta: { x: number; y: number },
): CreatorVision {
  if (delta.x === 0 && delta.y === 0) {
    return vision;
  }

  const anchorCard = vision.pillars.find(
    (pillar) => pillar.id === FRAMEWORK_CARD_IDS.demographic,
  );
  if (!anchorCard || getDemographicPillars(vision.pillars).length === 0) {
    return vision;
  }

  const current = resolveAudienceBoxPillar(
    anchorCard,
    DEMOGRAPHIC_BOX_ID,
    getDemographicPillars(vision.pillars).length,
    PILLAR_CARD_HEIGHT,
    vision.demographicBoxPosition,
  );

  return {
    ...vision,
    demographicBoxPosition: {
      x: Math.max(0, current.x + delta.x),
      y: Math.max(0, current.y + delta.y),
    },
    updatedAt: Date.now(),
  };
}

function getPsychographicAnchorCard(vision: CreatorVision) {
  return vision.pillars.find((pillar) => pillar.id === FRAMEWORK_CARD_IDS.psychographic);
}

function getInstagramCreatorsBoxPlacement(vision: CreatorVision) {
  const anchorCard = getPsychographicAnchorCard(vision);
  if (!anchorCard) {
    return null;
  }

  return resolveInstagramCreatorsBoxPillar(
    anchorCard,
    INSTAGRAM_CREATORS_BOX_ID,
    getPsychographicCreatorPillars(vision.pillars).length,
    PILLAR_CARD_HEIGHT,
    getPsychographicTraitPillars(vision.pillars).length,
    vision.instagramCreatorsBoxPosition,
  );
}

export function moveInstagramCreatorsBox(
  vision: CreatorVision,
  delta: { x: number; y: number },
): CreatorVision {
  if (delta.x === 0 && delta.y === 0) {
    return vision;
  }

  const current = getInstagramCreatorsBoxPlacement(vision);
  if (!current) {
    return vision;
  }

  return {
    ...vision,
    instagramCreatorsBoxPosition: {
      x: Math.max(0, current.x + delta.x),
      y: Math.max(0, current.y + delta.y),
    },
    updatedAt: Date.now(),
  };
}

export function movePsychographicTraitsBox(
  vision: CreatorVision,
  delta: { x: number; y: number },
): CreatorVision {
  if (delta.x === 0 && delta.y === 0) {
    return vision;
  }

  const anchorCard = getPsychographicAnchorCard(vision);
  const creatorsBox = getInstagramCreatorsBoxPlacement(vision);
  if (!anchorCard || !creatorsBox || getPsychographicTraitPillars(vision.pillars).length === 0) {
    return vision;
  }

  const current = resolvePsychographicTraitsBoxPillar(
    anchorCard,
    PSYCHOGRAPHIC_BOX_ID,
    getPsychographicTraitPillars(vision.pillars).length,
    PILLAR_CARD_HEIGHT,
    creatorsBox,
    vision.psychographicBoxPosition,
  );

  return {
    ...vision,
    psychographicBoxPosition: {
      x: Math.max(0, current.x + delta.x),
      y: Math.max(0, current.y + delta.y),
    },
    updatedAt: Date.now(),
  };
}

export function moveDemographicBox(
  vision: CreatorVision,
  delta: { x: number; y: number },
): CreatorVision {
  return moveDemographicAudienceBox(vision, delta);
}

export function movePainBox(
  vision: CreatorVision,
  delta: { x: number; y: number },
): CreatorVision {
  return moveUniquenessBox(vision, FRAMEWORK_CARD_IDS.pain, PAIN_BOX_ID, getPainPillars, delta);
}

export function movePassionBox(
  vision: CreatorVision,
  delta: { x: number; y: number },
): CreatorVision {
  return moveUniquenessBox(
    vision,
    FRAMEWORK_CARD_IDS.passion,
    PASSION_BOX_ID,
    getPassionPillars,
    delta,
  );
}

export function moveExperienceBox(
  vision: CreatorVision,
  delta: { x: number; y: number },
): CreatorVision {
  return moveUniquenessBox(
    vision,
    FRAMEWORK_CARD_IDS.experience,
    EXPERIENCE_BOX_ID,
    getExperiencePillars,
    delta,
  );
}

export function moveSkillBox(
  vision: CreatorVision,
  delta: { x: number; y: number },
): CreatorVision {
  return moveUniquenessBox(
    vision,
    FRAMEWORK_CARD_IDS.skill,
    SKILL_BOX_ID,
    getSkillPillars,
    delta,
  );
}

export function moveOneOffBox(
  vision: CreatorVision,
  delta: { x: number; y: number },
): CreatorVision {
  return moveEcosystemBox(
    vision,
    FRAMEWORK_CARD_IDS.oneOff,
    ONE_OFF_BOX_ID,
    getOneOffPillars,
    delta,
  );
}

export function moveOngoingContentBox(
  vision: CreatorVision,
  delta: { x: number; y: number },
): CreatorVision {
  return moveEcosystemBox(
    vision,
    FRAMEWORK_CARD_IDS.ongoingContent,
    ONGOING_CONTENT_BOX_ID,
    getOngoingContentPillars,
    delta,
  );
}

export function moveHighValuePartnersBox(
  vision: CreatorVision,
  delta: { x: number; y: number },
): CreatorVision {
  return moveEcosystemBox(
    vision,
    FRAMEWORK_CARD_IDS.highValuePartners,
    HIGH_VALUE_PARTNERS_BOX_ID,
    getHighValuePartnersPillars,
    delta,
  );
}

export function moveReinvestBox(
  vision: CreatorVision,
  delta: { x: number; y: number },
): CreatorVision {
  return moveEcosystemBox(
    vision,
    FRAMEWORK_CARD_IDS.reinvest,
    REINVEST_BOX_ID,
    getReinvestPillars,
    delta,
  );
}

function moveUniquenessBox(
  vision: CreatorVision,
  anchorCardId: string,
  boxId: string,
  getPillars: (pillars: Pillar[]) => Pillar[],
  delta: { x: number; y: number },
): CreatorVision {
  if (delta.x === 0 && delta.y === 0) {
    return vision;
  }

  const anchorCard = vision.pillars.find((pillar) => pillar.id === anchorCardId);
  if (!anchorCard || getPillars(vision.pillars).length === 0) {
    return vision;
  }

  const positionKey =
    boxId === PAIN_BOX_ID
      ? "painBoxPosition"
      : boxId === PASSION_BOX_ID
        ? "passionBoxPosition"
        : boxId === EXPERIENCE_BOX_ID
          ? "experienceBoxPosition"
          : "skillBoxPosition";

  const storedPosition = vision[positionKey];
  const current = resolveAudienceBoxPillar(
    anchorCard,
    boxId,
    getPillars(vision.pillars).length,
    PILLAR_CARD_HEIGHT,
    storedPosition,
  );

  return {
    ...vision,
    [positionKey]: {
      x: Math.max(0, current.x + delta.x),
      y: Math.max(0, current.y + delta.y),
    },
    updatedAt: Date.now(),
  };
}

function moveEcosystemBox(
  vision: CreatorVision,
  anchorCardId: string,
  boxId: string,
  getPillars: (pillars: Pillar[]) => Pillar[],
  delta: { x: number; y: number },
): CreatorVision {
  if (delta.x === 0 && delta.y === 0) {
    return vision;
  }

  const anchorCard = vision.pillars.find((pillar) => pillar.id === anchorCardId);
  if (!anchorCard || getPillars(vision.pillars).length === 0) {
    return vision;
  }

  const positionKey =
    boxId === ONE_OFF_BOX_ID
      ? "oneOffBoxPosition"
      : boxId === ONGOING_CONTENT_BOX_ID
        ? "ongoingContentBoxPosition"
        : boxId === HIGH_VALUE_PARTNERS_BOX_ID
          ? "highValuePartnersBoxPosition"
          : "reinvestBoxPosition";

  const storedPosition = vision[positionKey];
  const current = resolveAudienceBoxPillar(
    anchorCard,
    boxId,
    getPillars(vision.pillars).length,
    PILLAR_CARD_HEIGHT,
    storedPosition,
  );

  return {
    ...vision,
    [positionKey]: {
      x: Math.max(0, current.x + delta.x),
      y: Math.max(0, current.y + delta.y),
    },
    updatedAt: Date.now(),
  };
}

/** @deprecated Use movePsychographicTraitsBox */
export function movePsychographicBox(
  vision: CreatorVision,
  delta: { x: number; y: number },
): CreatorVision {
  return movePsychographicTraitsBox(vision, delta);
}

export function movePillars(
  vision: CreatorVision,
  ids: string[],
  delta: { x: number; y: number },
): CreatorVision {
  const idSet = new Set(ids);
  if (idSet.size === 0 || (delta.x === 0 && delta.y === 0)) {
    return vision;
  }

  return {
    ...vision,
    pillars: vision.pillars.map((pillar) =>
      idSet.has(pillar.id)
        ? {
            ...pillar,
            x: Math.max(0, pillar.x + delta.x),
            y: Math.max(0, pillar.y + delta.y),
          }
        : pillar,
    ),
    updatedAt: Date.now(),
  };
}

export function addConnection(
  vision: CreatorVision,
  fromPillarId: string,
  fromAnchor: ConnectionAnchor,
  toPillarId: string,
  toAnchor: ConnectionAnchor,
): CreatorVision {
  if (fromPillarId === toPillarId && fromAnchor === toAnchor) {
    return vision;
  }

  const duplicate = vision.connections.some(
    (connection) =>
      connection.fromPillarId === fromPillarId &&
      connection.fromAnchor === fromAnchor &&
      connection.toPillarId === toPillarId &&
      connection.toAnchor === toAnchor,
  );

  if (duplicate) {
    return vision;
  }

  return {
    ...vision,
    connections: [
      ...vision.connections,
      {
        id: crypto.randomUUID(),
        fromPillarId,
        fromAnchor,
        toPillarId,
        toAnchor,
      },
    ],
    updatedAt: Date.now(),
  };
}

export function removeConnection(vision: CreatorVision, connectionId: string): CreatorVision {
  return {
    ...vision,
    connections: vision.connections.filter(
      (connection) => connection.id !== connectionId,
    ),
    updatedAt: Date.now(),
  };
}
