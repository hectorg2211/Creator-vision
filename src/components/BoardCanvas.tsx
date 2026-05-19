"use client";

import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { flushSync } from "react-dom";
import { BoardConnections } from "@/components/BoardConnections";
import { AudiencePillarsBox } from "@/components/AudiencePillarsBox";
import { AudienceFrameworkFooter } from "@/components/AudienceFrameworkFooter";
import { PsychographicFrameworkFooter } from "@/components/PsychographicFrameworkFooter";
import { PainFrameworkFooter } from "@/components/PainFrameworkFooter";
import { PassionFrameworkFooter } from "@/components/PassionFrameworkFooter";
import { ExperienceFrameworkFooter } from "@/components/ExperienceFrameworkFooter";
import { SkillFrameworkFooter } from "@/components/SkillFrameworkFooter";
import { MonetizationCategoryFooter } from "@/components/MonetizationCategoryFooter";
import {
  BuildPainPointsDialog,
  type PainPointAnswers,
} from "@/components/BuildPainPointsDialog";
import {
  BuildPassionPointsDialog,
  type PassionPointAnswers,
} from "@/components/BuildPassionPointsDialog";
import { BuildExperienceDialog, type ExperienceAnswers } from "@/components/BuildExperienceDialog";
import { BuildSkillsDialog, type SkillAnswers } from "@/components/BuildSkillsDialog";
import {
  BuildEcosystemDialog,
  type EcosystemAnswers,
} from "@/components/BuildEcosystemDialog";
import { ContentPillarsBox } from "@/components/ContentPillarsBox";
import { MessageBox } from "@/components/MessageBox";
import { PillarCard } from "@/components/PillarCard";
import { BoardThemeSelector } from "@/components/BoardThemeSelector";
import { WelcomeOnboardingModal } from "@/components/WelcomeOnboardingModal";
import { downloadBoardAsJpg } from "@/lib/download-board-image";
import { useBoardTheme } from "@/hooks/useBoardTheme";
import {
  hasSeenWelcomeOnboarding,
  markWelcomeOnboardingSeen,
} from "@/lib/welcome-onboarding";
import type { MessageAnswers } from "@/components/GenerateMessageDialog";
import {
  ECOSYSTEM_CATEGORY_BUILD_LABELS,
  type EcosystemCategory,
} from "@/lib/ecosystem-category";
import { getDefaultBoardContentBounds } from "@/lib/board-layout";
import {
  getAnchorPoint,
  resolveMessageBoxPillar,
  getPillarSize,
  getPillarBounds,
  getBoardExportCapture,
  getMessageBoxExportBounds,
  normalizeRect,
  rectsIntersect,
  getContentPillarHeightFromMessageBox,
  getContentPillarsBoxDimensions,
  AUDIENCE_FRAMEWORK_CARD_MIN_HEIGHT,
  resolveAudienceBoxPillar,
  resolveInstagramCreatorsBoxPillar,
  resolvePsychographicTraitsBoxPillar,
  resolveContentPillarsBoxPillar,
  MESSAGE_BOX_MIN_HEIGHT,
  PILLAR_CARD_HEIGHT,
  type BoardRect,
  type PillarSize,
} from "@/lib/board-geometry";
import {
  getContentPillars,
  getDemographicPillars,
  getPsychographicCreatorPillars,
  getPsychographicTraitPillars,
  getPainPillars,
  getPassionPillars,
  getExperiencePillars,
  getSkillPillars,
  getOneOffPillars,
  getOngoingContentPillars,
  getHighValuePartnersPillars,
  getReinvestPillars,
  isDeletableBoardId,
  isStaticCard,
  isVisionCard,
  FRAMEWORK_CARD_IDS,
  getFrameworkObstacleRects,
  CONTENT_PILLARS_BOX_ID,
  DEMOGRAPHIC_BOX_ID,
  INSTAGRAM_CREATORS_BOX_ID,
  PSYCHOGRAPHIC_BOX_ID,
  PAIN_BOX_ID,
  PASSION_BOX_ID,
  EXPERIENCE_BOX_ID,
  SKILL_BOX_ID,
  ONE_OFF_BOX_ID,
  ONGOING_CONTENT_BOX_ID,
  HIGH_VALUE_PARTNERS_BOX_ID,
  REINVEST_BOX_ID,
  MESSAGE_BOX_ID,
  type Connection,
  type ConnectionAnchor,
  type ContentPillarsBoxPosition,
  type MessageBoxPosition,
  type Pillar,
} from "@/lib/vision-store";

type HandleTarget = {
  pillarId: string;
  anchor: ConnectionAnchor;
};

type ConnectionDragState = {
  from: HandleTarget;
  previewX: number;
  previewY: number;
  hoveredTarget: HandleTarget | null;
};

type MarqueeState = {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
};

type PanOffset = {
  x: number;
  y: number;
};

type BoardViewport = {
  pan: PanOffset;
  scale: number;
};

const MIN_BOARD_SCALE = 0.25;
const MAX_BOARD_SCALE = 3;
const ZOOM_WHEEL_INTENSITY = 0.001;
const INITIAL_BOARD_FIT_PADDING = 48;

const FRAMEWORK_CARDS_WITH_FOOTERS = new Set<string>([
  FRAMEWORK_CARD_IDS.demographic,
  FRAMEWORK_CARD_IDS.psychographic,
  FRAMEWORK_CARD_IDS.pain,
  FRAMEWORK_CARD_IDS.passion,
  FRAMEWORK_CARD_IDS.experience,
  FRAMEWORK_CARD_IDS.skill,
  FRAMEWORK_CARD_IDS.oneOff,
  FRAMEWORK_CARD_IDS.ongoingContent,
  FRAMEWORK_CARD_IDS.highValuePartners,
  FRAMEWORK_CARD_IDS.reinvest,
]);

function clampBoardScale(scale: number) {
  return Math.min(MAX_BOARD_SCALE, Math.max(MIN_BOARD_SCALE, scale));
}

function getFrameworkPillarSize(pillar: Pillar): PillarSize {
  let size = getPillarSize(pillar);
  if (FRAMEWORK_CARDS_WITH_FOOTERS.has(pillar.id)) {
    size = {
      ...size,
      height: Math.max(size.height, AUDIENCE_FRAMEWORK_CARD_MIN_HEIGHT),
    };
  }
  return size;
}

function computeInitialBoardBounds(
  staticPillars: Pillar[],
  messageBoxPillar: Pillar | null,
): BoardRect | null {
  return getDefaultBoardContentBounds(staticPillars, messageBoxPillar);
}

function fitBoardViewportToBounds(
  viewportWidth: number,
  viewportHeight: number,
  bounds: BoardRect,
  padding = INITIAL_BOARD_FIT_PADDING,
): BoardViewport {
  const contentWidth = bounds.right - bounds.left;
  const contentHeight = bounds.bottom - bounds.top;
  const scaleX = (viewportWidth - padding * 2) / contentWidth;
  const scaleY = (viewportHeight - padding * 2) / contentHeight;
  const scale = clampBoardScale(Math.min(scaleX, scaleY, 1));
  const panX = (viewportWidth - contentWidth * scale) / 2 - bounds.left * scale;
  const panY = (viewportHeight - contentHeight * scale) / 2 - bounds.top * scale;

  return {
    pan: { x: panX, y: panY },
    scale,
  };
}

type PanSession = {
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startPanX: number;
  startPanY: number;
};

type BoardCanvasProps = {
  readOnly?: boolean;
  message: string;
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
  pillars: Pillar[];
  connections: Connection[];
  isGeneratingMessage: boolean;
  isGeneratingPillars: boolean;
  isGeneratingDemographic: boolean;
  isGeneratingPsychographic: boolean;
  isGeneratingPainPoints: boolean;
  isGeneratingPassionPoints: boolean;
  isGeneratingExperience: boolean;
  isGeneratingSkills: boolean;
  isGeneratingEcosystem: boolean;
  ecosystemGeneratingCategory: EcosystemCategory | null;
  messageError: string | null;
  pillarsError: string | null;
  demographicError: string | null;
  psychographicError: string | null;
  painError: string | null;
  passionError: string | null;
  experienceError: string | null;
  skillError: string | null;
  ecosystemError: string | null;
  onMessageChange: (message: string) => void;
  onGenerateMessage: (answers: MessageAnswers) => Promise<boolean>;
  onGeneratePillars: (replaceExisting: boolean) => Promise<{ needsConfirmation: boolean }>;
  onGenerateDemographic: () => void;
  onGeneratePsychographic: () => void;
  onGeneratePainPoints: (answers: PainPointAnswers) => Promise<boolean>;
  onGeneratePassionPoints: (answers: PassionPointAnswers) => Promise<boolean>;
  onGenerateExperience: (answers: ExperienceAnswers) => Promise<boolean>;
  onGenerateSkills: (answers: SkillAnswers) => Promise<boolean>;
  onGenerateEcosystem: (
    answers: EcosystemAnswers,
    category?: EcosystemCategory,
  ) => Promise<boolean>;
  onAddDemographicPillar: () => void;
  onAddInstagramCreatorPillar: () => void;
  onAddPsychographicTraitPillar: () => void;
  onAddPainPillar: () => void;
  onAddPassionPillar: () => void;
  onAddExperiencePillar: () => void;
  onAddSkillPillar: () => void;
  onAddOneOffPillar: () => void;
  onAddOngoingContentPillar: () => void;
  onAddHighValuePartnersPillar: () => void;
  onAddReinvestPillar: () => void;
  suggestedPillars: string[];
  onAddSelectedPillars: (labels: string[]) => void;
  onClearSuggestedPillars: () => void;
  onAddPillar: () => void;
  onUpdateLabel: (id: string, label: string) => void;
  onRemovePillars: (ids: string[]) => void;
  onMovePillars: (ids: string[], delta: { x: number; y: number }) => void;
  onMoveMessageBox: (delta: { x: number; y: number }) => void;
  onMoveContentPillarsBox: (delta: { x: number; y: number }) => void;
  onMoveDemographicBox: (delta: { x: number; y: number }) => void;
  onMoveInstagramCreatorsBox: (delta: { x: number; y: number }) => void;
  onMovePsychographicTraitsBox: (delta: { x: number; y: number }) => void;
  onMovePainBox: (delta: { x: number; y: number }) => void;
  onMovePassionBox: (delta: { x: number; y: number }) => void;
  onMoveExperienceBox: (delta: { x: number; y: number }) => void;
  onMoveSkillBox: (delta: { x: number; y: number }) => void;
  onMoveOneOffBox: (delta: { x: number; y: number }) => void;
  onMoveOngoingContentBox: (delta: { x: number; y: number }) => void;
  onMoveHighValuePartnersBox: (delta: { x: number; y: number }) => void;
  onMoveReinvestBox: (delta: { x: number; y: number }) => void;
  onUpdatePillarSize: (id: string, width: number, height: number) => void;
  onResizeStart?: () => void;
  onResizeEnd?: () => void;
  onAddConnection: (
    fromPillarId: string,
    fromAnchor: ConnectionAnchor,
    toPillarId: string,
    toAnchor: ConnectionAnchor,
  ) => void;
  onRemoveConnection: (connectionId: string) => void;
  onShare?: () => void | Promise<void>;
};

const MARQUEE_MIN_SIZE = 4;

const BOARD_BOX_IDS = new Set([
  MESSAGE_BOX_ID,
  CONTENT_PILLARS_BOX_ID,
  DEMOGRAPHIC_BOX_ID,
  INSTAGRAM_CREATORS_BOX_ID,
  PSYCHOGRAPHIC_BOX_ID,
  PAIN_BOX_ID,
  PASSION_BOX_ID,
  EXPERIENCE_BOX_ID,
  SKILL_BOX_ID,
  ONE_OFF_BOX_ID,
  ONGOING_CONTENT_BOX_ID,
  HIGH_VALUE_PARTNERS_BOX_ID,
  REINVEST_BOX_ID,
]);

function getGroupDragDelta(
  boxId: string,
  activeId: string | null,
  dragDelta: { x: number; y: number } | null,
  selectedIds: string[],
) {
  return activeId && dragDelta && selectedIds.includes(boxId) && activeId !== boxId
    ? dragDelta
    : null;
}

function getBoardPoint(
  board: HTMLDivElement,
  clientX: number,
  clientY: number,
  viewport: BoardViewport = { pan: { x: 0, y: 0 }, scale: 1 },
) {
  const rect = board.getBoundingClientRect();
  return {
    x: (clientX - rect.left - viewport.pan.x) / viewport.scale,
    y: (clientY - rect.top - viewport.pan.y) / viewport.scale,
  };
}

function getBoardViewportFromRefs(
  panRef: RefObject<PanOffset>,
  scaleRef: RefObject<number>,
): BoardViewport {
  return { pan: panRef.current ?? { x: 0, y: 0 }, scale: scaleRef.current ?? 1 };
}

function canStartPanFromTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (target.closest("input, textarea, select")) {
    return false;
  }

  if (target.closest("[data-connection-handle]") || target.closest("[data-resize-handle]")) {
    return false;
  }

  return true;
}

function getHandleFromElement(element: Element | null): HandleTarget | null {
  const handle = element?.closest("[data-connection-handle]");
  if (!handle || !(handle instanceof HTMLElement)) {
    return null;
  }

  const pillarId = handle.dataset.pillarId;
  const anchor = handle.dataset.anchor as ConnectionAnchor | undefined;
  if (!pillarId || !anchor) {
    return null;
  }

  return { pillarId, anchor };
}

function isSameHandle(
  a: HandleTarget | null | undefined,
  b: HandleTarget | null | undefined,
) {
  return a?.pillarId === b?.pillarId && a?.anchor === b?.anchor;
}

function isBoardBackgroundTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    !target.closest("[data-pillar-card]") &&
    !target.closest("[data-message-box]") &&
    !target.closest("[data-content-pillars-box]") &&
    !target.closest("[data-audience-pillars-box]") &&
    !target.closest("[data-connection-handle]") &&
    !target.closest("[data-resize-handle]") &&
    !target.closest("[data-selection-toolbar]")
  );
}

function TrashIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}

const BOARD_HINTS = [
  "Middle-click or Space + drag to pan",
  "Scroll or pinch to zoom in or out",
  "Drag empty space to select; Shift-click to add/remove",
  "Drag from connection circles to link cards",
  "Ctrl+Z to undo board changes",
] as const;

type BoardFloatingToolbarProps = {
  readOnly?: boolean;
  isDownloading: boolean;
  isSharing: boolean;
  shareMessage: string | null;
  onDownload: () => void;
  onShare?: () => void;
  boardTheme: ReturnType<typeof useBoardTheme>["theme"];
  onBoardThemeChange: ReturnType<typeof useBoardTheme>["setTheme"];
};

function ShareIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
      <path d="M16 6l-4-4-4 4" />
      <path d="M12 2v14" />
    </svg>
  );
}

function BoardFloatingToolbar({
  readOnly = false,
  isDownloading,
  isSharing,
  shareMessage,
  onDownload,
  onShare,
  boardTheme,
  onBoardThemeChange,
}: BoardFloatingToolbarProps) {
  return (
    <div className="pointer-events-auto fixed top-4 right-4 z-50">
      <div
        data-board-toolbar
        data-export-hide
        className="relative flex w-fit max-w-[calc(100vw-2rem)] items-center gap-1 rounded-xl border border-zinc-200/80 bg-white/90 p-1.5 shadow-lg backdrop-blur-md"
      >
      {readOnly ? (
        <span className="rounded-lg bg-violet-100 px-3 py-1.5 text-xs font-medium text-violet-800">
          View only
        </span>
      ) : null}
      <BoardThemeSelector theme={boardTheme} onThemeChange={onBoardThemeChange} />
      <div className="group relative">
        <button
          type="button"
          aria-label="Board shortcuts"
          aria-describedby="board-shortcuts-hints"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-700"
        >
          <InfoIcon />
        </button>
        <div
          id="board-shortcuts-hints"
          role="tooltip"
          className="pointer-events-none absolute right-0 top-full z-50 mt-2 hidden w-64 rounded-lg border border-zinc-200/80 bg-white/95 p-3 text-xs leading-relaxed text-zinc-600 shadow-lg backdrop-blur-md group-hover:block group-focus-within:block"
        >
          <p className="mb-2 font-medium text-zinc-800">Shortcuts</p>
          <ul className="space-y-1.5">
            {BOARD_HINTS.map((hint) => (
              <li key={hint}>{hint}</li>
            ))}
          </ul>
        </div>
      </div>
      {!readOnly && onShare ? (
        <button
          type="button"
          onClick={onShare}
          disabled={isSharing}
          aria-label="Share board link"
          title="Share board link"
          className="flex h-9 items-center gap-2 rounded-lg border border-zinc-200/80 bg-white/80 px-3 text-sm font-medium text-zinc-700 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 disabled:cursor-wait disabled:opacity-60"
        >
          <ShareIcon />
          <span className="hidden sm:inline">{isSharing ? "Sharing…" : "Share link"}</span>
        </button>
      ) : null}
      <button
        type="button"
        onClick={onDownload}
        disabled={isDownloading}
        aria-label="Download board as JPG"
        title="Download board as JPG"
        className="flex h-9 items-center gap-2 rounded-lg border border-zinc-200/80 bg-white/80 px-3 text-sm font-medium text-zinc-700 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 disabled:cursor-wait disabled:opacity-60"
      >
        <DownloadIcon />
        <span className="hidden sm:inline">{isDownloading ? "Exporting…" : "Download JPG"}</span>
      </button>
      {shareMessage ? (
        <p className="pointer-events-none absolute right-0 top-full z-50 mt-2 max-w-xs rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs text-violet-900 shadow-md">
          {shareMessage}
        </p>
      ) : null}
      </div>
    </div>
  );
}

export function BoardCanvas({
  readOnly = false,
  message,
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
  pillars,
  connections,
  isGeneratingMessage,
  isGeneratingPillars,
  isGeneratingDemographic,
  isGeneratingPsychographic,
  isGeneratingPainPoints,
  isGeneratingPassionPoints,
  isGeneratingExperience,
  isGeneratingSkills,
  isGeneratingEcosystem,
  ecosystemGeneratingCategory,
  messageError,
  pillarsError,
  demographicError,
  psychographicError,
  painError,
  passionError,
  experienceError,
  skillError,
  ecosystemError,
  onMessageChange,
  onGenerateMessage,
  onGeneratePillars,
  onGenerateDemographic,
  onGeneratePsychographic,
  onGeneratePainPoints,
  onGeneratePassionPoints,
  onGenerateExperience,
  onGenerateSkills,
  onGenerateEcosystem,
  onAddDemographicPillar,
  onAddInstagramCreatorPillar,
  onAddPsychographicTraitPillar,
  onAddPainPillar,
  onAddPassionPillar,
  onAddExperiencePillar,
  onAddSkillPillar,
  onAddOneOffPillar,
  onAddOngoingContentPillar,
  onAddHighValuePartnersPillar,
  onAddReinvestPillar,
  suggestedPillars,
  onAddSelectedPillars,
  onClearSuggestedPillars,
  onAddPillar,
  onUpdateLabel,
  onRemovePillars,
  onMovePillars,
  onMoveMessageBox,
  onMoveContentPillarsBox,
  onMoveDemographicBox,
  onMoveInstagramCreatorsBox,
  onMovePsychographicTraitsBox,
  onMovePainBox,
  onMovePassionBox,
  onMoveExperienceBox,
  onMoveSkillBox,
  onMoveOneOffBox,
  onMoveOngoingContentBox,
  onMoveHighValuePartnersBox,
  onMoveReinvestBox,
  onUpdatePillarSize,
  onResizeStart,
  onResizeEnd,
  onAddConnection,
  onRemoveConnection,
  onShare,
}: BoardCanvasProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggingPillarIds, setDraggingPillarIds] = useState<string[]>([]);
  const [dragDelta, setDragDelta] = useState<{ x: number; y: number } | null>(null);
  const [selectedPillarIds, setSelectedPillarIds] = useState<string[]>([]);
  const [connectionDrag, setConnectionDrag] = useState<ConnectionDragState | null>(
    null,
  );
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(
    null,
  );
  const [marquee, setMarquee] = useState<MarqueeState | null>(null);
  const [pan, setPan] = useState<PanOffset>({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [spacePressed, setSpacePressed] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [painPointsDialogOpen, setPainPointsDialogOpen] = useState(false);
  const [passionPointsDialogOpen, setPassionPointsDialogOpen] = useState(false);
  const [experienceDialogOpen, setExperienceDialogOpen] = useState(false);
  const [skillsDialogOpen, setSkillsDialogOpen] = useState(false);
  const [ecosystemDialogOpen, setEcosystemDialogOpen] = useState(false);
  const [ecosystemDialogCategory, setEcosystemDialogCategory] =
    useState<EcosystemCategory | null>(null);
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const { theme: boardTheme, setTheme: setBoardTheme } = useBoardTheme();
  const boardRef = useRef<HTMLDivElement>(null);
  const connectionDragRef = useRef<ConnectionDragState | null>(null);
  const selectedPillarIdsRef = useRef(selectedPillarIds);
  const panRef = useRef(pan);
  const scaleRef = useRef(scale);
  const panSessionRef = useRef<PanSession | null>(null);
  const spacePressedRef = useRef(false);
  const suppressMarqueeRef = useRef(false);
  const hasUserInteractedWithViewportRef = useRef(false);
  const hasInitialFitRef = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  const isConnecting = connectionDrag !== null;
  const activeDrag = useMemo(
    () =>
      activeId && dragDelta
        ? { pillarIds: draggingPillarIds, delta: dragDelta }
        : null,
    [activeId, dragDelta, draggingPillarIds],
  );
  const contentPillars = getContentPillars(pillars);
  const demographicPillars = getDemographicPillars(pillars);
  const psychographicCreatorPillars = getPsychographicCreatorPillars(pillars);
  const psychographicTraitPillars = getPsychographicTraitPillars(pillars);
  const painPillars = getPainPillars(pillars);
  const passionPillars = getPassionPillars(pillars);
  const experiencePillars = getExperiencePillars(pillars);
  const skillPillars = getSkillPillars(pillars);
  const oneOffPillars = getOneOffPillars(pillars);
  const ongoingContentPillars = getOngoingContentPillars(pillars);
  const highValuePartnersPillars = getHighValuePartnersPillars(pillars);
  const reinvestPillars = getReinvestPillars(pillars);
  const hasContentPillars = contentPillars.length > 0;
  const hasMessage = message.trim().length > 0;

  const openEcosystemDialog = useCallback((category: EcosystemCategory) => {
    setEcosystemDialogCategory(category);
    setEcosystemDialogOpen(true);
  }, []);

  const renderMonetizationCategoryFooter = useCallback(
    (category: EcosystemCategory, onAddManually: () => void) => (
      <MonetizationCategoryFooter
        buildLabel={ECOSYSTEM_CATEGORY_BUILD_LABELS[category]}
        canBuildSuggestions={hasContentPillars}
        isGenerating={isGeneratingEcosystem && ecosystemGeneratingCategory === category}
        generateError={ecosystemGeneratingCategory === category ? ecosystemError : null}
        onBuildSuggestions={() => openEcosystemDialog(category)}
        onAddManually={onAddManually}
      />
    ),
    [
      ecosystemError,
      ecosystemGeneratingCategory,
      hasContentPillars,
      isGeneratingEcosystem,
      openEcosystemDialog,
    ],
  );
  const audienceCellHeight = PILLAR_CARD_HEIGHT;
  const boardPillars = useMemo(
    () => pillars.filter((pillar) => isStaticCard(pillar)),
    [pillars],
  );
  const demographicPillar = useMemo(
    () => pillars.find((pillar) => pillar.id === FRAMEWORK_CARD_IDS.demographic),
    [pillars],
  );
  const psychographicPillar = useMemo(
    () => pillars.find((pillar) => pillar.id === FRAMEWORK_CARD_IDS.psychographic),
    [pillars],
  );
  const painPillar = useMemo(
    () => pillars.find((pillar) => pillar.id === FRAMEWORK_CARD_IDS.pain),
    [pillars],
  );
  const passionPillar = useMemo(
    () => pillars.find((pillar) => pillar.id === FRAMEWORK_CARD_IDS.passion),
    [pillars],
  );
  const experiencePillar = useMemo(
    () => pillars.find((pillar) => pillar.id === FRAMEWORK_CARD_IDS.experience),
    [pillars],
  );
  const skillPillar = useMemo(
    () => pillars.find((pillar) => pillar.id === FRAMEWORK_CARD_IDS.skill),
    [pillars],
  );
  const oneOffPillar = useMemo(
    () => pillars.find((pillar) => pillar.id === FRAMEWORK_CARD_IDS.oneOff),
    [pillars],
  );
  const ongoingContentPillar = useMemo(
    () => pillars.find((pillar) => pillar.id === FRAMEWORK_CARD_IDS.ongoingContent),
    [pillars],
  );
  const highValuePartnersPillar = useMemo(
    () => pillars.find((pillar) => pillar.id === FRAMEWORK_CARD_IDS.highValuePartners),
    [pillars],
  );
  const reinvestPillar = useMemo(
    () => pillars.find((pillar) => pillar.id === FRAMEWORK_CARD_IDS.reinvest),
    [pillars],
  );
  const whatCard = pillars.find((pillar) => pillar.id === FRAMEWORK_CARD_IDS.what);
  const layoutObstacleRects = useMemo(
    () => getFrameworkObstacleRects(pillars),
    [pillars],
  );
  const messageLayoutObstacleRects = useMemo(
    () => getFrameworkObstacleRects(pillars, { excludeWhat: true }),
    [pillars],
  );
  const [messageBoxLayoutHeight, setMessageBoxLayoutHeight] = useState(
    MESSAGE_BOX_MIN_HEIGHT,
  );

  const messageBoxPlacementHeight = hasMessage
    ? messageBoxLayoutHeight
    : Math.max(MESSAGE_BOX_MIN_HEIGHT, messageBoxLayoutHeight);

  const handleMessageBoxLayoutHeight = useCallback((height: number) => {
    setMessageBoxLayoutHeight((current) =>
      current === height ? current : height,
    );
  }, []);

  const messageBoxPillar = useMemo(() => {
    if (!whatCard) {
      return null;
    }

    return resolveMessageBoxPillar(
      whatCard,
      MESSAGE_BOX_ID,
      messageBoxPosition,
      messageBoxPlacementHeight,
      messageLayoutObstacleRects,
    );
  }, [
    messageBoxPlacementHeight,
    messageBoxPosition,
    messageLayoutObstacleRects,
    whatCard,
  ]);

  const messageBoxDisplayPosition = useMemo(
    () => ({
      x: messageBoxPillar?.x ?? 0,
      y: messageBoxPillar?.y ?? 272,
    }),
    [messageBoxPillar],
  );

  const contentPillarsBoxPillar = useMemo(() => {
    if (!hasContentPillars || !messageBoxPillar) {
      return null;
    }

    return resolveContentPillarsBoxPillar(
      messageBoxPillar,
      CONTENT_PILLARS_BOX_ID,
      contentPillars.length,
      contentPillarsBoxPosition,
      layoutObstacleRects,
    );
  }, [
    contentPillars.length,
    contentPillarsBoxPosition,
    hasContentPillars,
    layoutObstacleRects,
    messageBoxPillar,
  ]);

  const contentPillarsCellHeight = messageBoxPillar
    ? getContentPillarHeightFromMessageBox(messageBoxPillar)
    : MESSAGE_BOX_MIN_HEIGHT;

  const contentPillarsBoxSize = useMemo(
    () =>
      getContentPillarsBoxDimensions(contentPillars.length, contentPillarsCellHeight),
    [contentPillars.length, contentPillarsCellHeight],
  );

  const contentPillarsBoxDisplayPosition = useMemo(
    () => ({
      x: contentPillarsBoxPillar?.x ?? messageBoxDisplayPosition.x,
      y: contentPillarsBoxPillar?.y ?? messageBoxDisplayPosition.y,
    }),
    [contentPillarsBoxPillar, messageBoxDisplayPosition],
  );

  const demographicBoxPillar = useMemo(() => {
    if (!demographicPillar || demographicPillars.length === 0) {
      return null;
    }

    return resolveAudienceBoxPillar(
      demographicPillar,
      DEMOGRAPHIC_BOX_ID,
      demographicPillars.length,
      audienceCellHeight,
      demographicBoxPosition,
      "grid",
      true,
      layoutObstacleRects,
    );
  }, [
    audienceCellHeight,
    demographicBoxPosition,
    demographicPillar,
    demographicPillars.length,
    layoutObstacleRects,
  ]);

  const instagramCreatorsBoxPillar = useMemo(() => {
    if (!psychographicPillar) {
      return null;
    }

    return resolveInstagramCreatorsBoxPillar(
      psychographicPillar,
      INSTAGRAM_CREATORS_BOX_ID,
      psychographicCreatorPillars.length,
      audienceCellHeight,
      psychographicTraitPillars.length,
      instagramCreatorsBoxPosition,
      layoutObstacleRects,
    );
  }, [
    audienceCellHeight,
    instagramCreatorsBoxPosition,
    layoutObstacleRects,
    psychographicCreatorPillars.length,
    psychographicTraitPillars.length,
    psychographicPillar,
  ]);

  const psychographicTraitsBoxPillar = useMemo(() => {
    if (
      !psychographicPillar ||
      !instagramCreatorsBoxPillar ||
      psychographicTraitPillars.length === 0
    ) {
      return null;
    }

    return resolvePsychographicTraitsBoxPillar(
      psychographicPillar,
      PSYCHOGRAPHIC_BOX_ID,
      psychographicTraitPillars.length,
      audienceCellHeight,
      instagramCreatorsBoxPillar,
      psychographicBoxPosition,
      layoutObstacleRects,
    );
  }, [
    audienceCellHeight,
    instagramCreatorsBoxPillar,
    layoutObstacleRects,
    psychographicBoxPosition,
    psychographicPillar,
    psychographicTraitPillars.length,
  ]);

  const painBoxPillar = useMemo(() => {
    if (!painPillar || painPillars.length === 0) {
      return null;
    }

    return resolveAudienceBoxPillar(
      painPillar,
      PAIN_BOX_ID,
      painPillars.length,
      audienceCellHeight,
      painBoxPosition,
      "grid",
      true,
      layoutObstacleRects,
    );
  }, [
    audienceCellHeight,
    layoutObstacleRects,
    painBoxPosition,
    painPillar,
    painPillars.length,
  ]);

  const passionBoxPillar = useMemo(() => {
    if (!passionPillar || passionPillars.length === 0) {
      return null;
    }

    return resolveAudienceBoxPillar(
      passionPillar,
      PASSION_BOX_ID,
      passionPillars.length,
      audienceCellHeight,
      passionBoxPosition,
      "grid",
      true,
      layoutObstacleRects,
    );
  }, [
    audienceCellHeight,
    layoutObstacleRects,
    passionBoxPosition,
    passionPillar,
    passionPillars.length,
  ]);

  const experienceBoxPillar = useMemo(() => {
    if (!experiencePillar || experiencePillars.length === 0) {
      return null;
    }

    return resolveAudienceBoxPillar(
      experiencePillar,
      EXPERIENCE_BOX_ID,
      experiencePillars.length,
      audienceCellHeight,
      experienceBoxPosition,
      "grid",
      true,
      layoutObstacleRects,
    );
  }, [
    audienceCellHeight,
    experienceBoxPosition,
    experiencePillar,
    experiencePillars.length,
    layoutObstacleRects,
  ]);

  const skillBoxPillar = useMemo(() => {
    if (!skillPillar || skillPillars.length === 0) {
      return null;
    }

    return resolveAudienceBoxPillar(
      skillPillar,
      SKILL_BOX_ID,
      skillPillars.length,
      audienceCellHeight,
      skillBoxPosition,
      "grid",
      true,
      layoutObstacleRects,
    );
  }, [
    audienceCellHeight,
    layoutObstacleRects,
    skillBoxPosition,
    skillPillar,
    skillPillars.length,
  ]);

  const oneOffBoxPillar = useMemo(() => {
    if (!oneOffPillar || oneOffPillars.length === 0) {
      return null;
    }

    return resolveAudienceBoxPillar(
      oneOffPillar,
      ONE_OFF_BOX_ID,
      oneOffPillars.length,
      audienceCellHeight,
      oneOffBoxPosition,
      "grid",
      true,
      layoutObstacleRects,
    );
  }, [
    audienceCellHeight,
    layoutObstacleRects,
    oneOffBoxPosition,
    oneOffPillar,
    oneOffPillars.length,
  ]);

  const ongoingContentBoxPillar = useMemo(() => {
    if (!ongoingContentPillar || ongoingContentPillars.length === 0) {
      return null;
    }

    return resolveAudienceBoxPillar(
      ongoingContentPillar,
      ONGOING_CONTENT_BOX_ID,
      ongoingContentPillars.length,
      audienceCellHeight,
      ongoingContentBoxPosition,
      "grid",
      true,
      layoutObstacleRects,
    );
  }, [
    audienceCellHeight,
    layoutObstacleRects,
    ongoingContentBoxPosition,
    ongoingContentPillar,
    ongoingContentPillars.length,
  ]);

  const highValuePartnersBoxPillar = useMemo(() => {
    if (!highValuePartnersPillar || highValuePartnersPillars.length === 0) {
      return null;
    }

    return resolveAudienceBoxPillar(
      highValuePartnersPillar,
      HIGH_VALUE_PARTNERS_BOX_ID,
      highValuePartnersPillars.length,
      audienceCellHeight,
      highValuePartnersBoxPosition,
      "grid",
      true,
      layoutObstacleRects,
    );
  }, [
    audienceCellHeight,
    highValuePartnersBoxPosition,
    highValuePartnersPillar,
    highValuePartnersPillars.length,
    layoutObstacleRects,
  ]);

  const reinvestBoxPillar = useMemo(() => {
    if (!reinvestPillar || reinvestPillars.length === 0) {
      return null;
    }

    return resolveAudienceBoxPillar(
      reinvestPillar,
      REINVEST_BOX_ID,
      reinvestPillars.length,
      audienceCellHeight,
      reinvestBoxPosition,
      "grid",
      true,
      layoutObstacleRects,
    );
  }, [
    audienceCellHeight,
    layoutObstacleRects,
    reinvestBoxPosition,
    reinvestPillar,
    reinvestPillars.length,
  ]);

  const demographicBoxSize = useMemo(
    () =>
      getContentPillarsBoxDimensions(
        demographicPillars.length,
        audienceCellHeight,
      ),
    [audienceCellHeight, demographicPillars.length],
  );

  const instagramCreatorsBoxSize = useMemo(
    () =>
      getContentPillarsBoxDimensions(
        Math.max(psychographicCreatorPillars.length, 1),
        audienceCellHeight,
      ),
    [audienceCellHeight, psychographicCreatorPillars.length],
  );

  const psychographicTraitsBoxSize = useMemo(
    () =>
      getContentPillarsBoxDimensions(
        psychographicTraitPillars.length,
        audienceCellHeight,
      ),
    [audienceCellHeight, psychographicTraitPillars.length],
  );

  const painBoxSize = useMemo(
    () => getContentPillarsBoxDimensions(painPillars.length, audienceCellHeight),
    [audienceCellHeight, painPillars.length],
  );

  const passionBoxSize = useMemo(
    () => getContentPillarsBoxDimensions(passionPillars.length, audienceCellHeight),
    [audienceCellHeight, passionPillars.length],
  );

  const experienceBoxSize = useMemo(
    () => getContentPillarsBoxDimensions(experiencePillars.length, audienceCellHeight),
    [audienceCellHeight, experiencePillars.length],
  );

  const skillBoxSize = useMemo(
    () => getContentPillarsBoxDimensions(skillPillars.length, audienceCellHeight),
    [audienceCellHeight, skillPillars.length],
  );

  const oneOffBoxSize = useMemo(
    () => getContentPillarsBoxDimensions(oneOffPillars.length, audienceCellHeight),
    [audienceCellHeight, oneOffPillars.length],
  );

  const ongoingContentBoxSize = useMemo(
    () =>
      getContentPillarsBoxDimensions(ongoingContentPillars.length, audienceCellHeight),
    [audienceCellHeight, ongoingContentPillars.length],
  );

  const highValuePartnersBoxSize = useMemo(
    () =>
      getContentPillarsBoxDimensions(highValuePartnersPillars.length, audienceCellHeight),
    [audienceCellHeight, highValuePartnersPillars.length],
  );

  const reinvestBoxSize = useMemo(
    () => getContentPillarsBoxDimensions(reinvestPillars.length, audienceCellHeight),
    [audienceCellHeight, reinvestPillars.length],
  );

  const demographicBoxDisplayPosition = useMemo(() => {
    if (!demographicBoxPillar) {
      return { x: 0, y: 0 };
    }

    return { x: demographicBoxPillar.x, y: demographicBoxPillar.y };
  }, [demographicBoxPillar]);

  const instagramCreatorsBoxDisplayPosition = useMemo(() => {
    if (!instagramCreatorsBoxPillar) {
      return { x: 0, y: 0 };
    }

    return {
      x: instagramCreatorsBoxPillar.x,
      y: instagramCreatorsBoxPillar.y,
    };
  }, [instagramCreatorsBoxPillar]);

  const psychographicTraitsBoxDisplayPosition = useMemo(() => {
    if (!psychographicTraitsBoxPillar) {
      return { x: 0, y: 0 };
    }

    return {
      x: psychographicTraitsBoxPillar.x,
      y: psychographicTraitsBoxPillar.y,
    };
  }, [psychographicTraitsBoxPillar]);

  const painBoxDisplayPosition = useMemo(() => {
    if (!painBoxPillar) {
      return { x: 0, y: 0 };
    }

    return { x: painBoxPillar.x, y: painBoxPillar.y };
  }, [painBoxPillar]);

  const passionBoxDisplayPosition = useMemo(() => {
    if (!passionBoxPillar) {
      return { x: 0, y: 0 };
    }

    return { x: passionBoxPillar.x, y: passionBoxPillar.y };
  }, [passionBoxPillar]);

  const experienceBoxDisplayPosition = useMemo(() => {
    if (!experienceBoxPillar) {
      return { x: 0, y: 0 };
    }

    return { x: experienceBoxPillar.x, y: experienceBoxPillar.y };
  }, [experienceBoxPillar]);

  const skillBoxDisplayPosition = useMemo(() => {
    if (!skillBoxPillar) {
      return { x: 0, y: 0 };
    }

    return { x: skillBoxPillar.x, y: skillBoxPillar.y };
  }, [skillBoxPillar]);

  const oneOffBoxDisplayPosition = useMemo(() => {
    if (!oneOffBoxPillar) {
      return { x: 0, y: 0 };
    }

    return { x: oneOffBoxPillar.x, y: oneOffBoxPillar.y };
  }, [oneOffBoxPillar]);

  const ongoingContentBoxDisplayPosition = useMemo(() => {
    if (!ongoingContentBoxPillar) {
      return { x: 0, y: 0 };
    }

    return { x: ongoingContentBoxPillar.x, y: ongoingContentBoxPillar.y };
  }, [ongoingContentBoxPillar]);

  const highValuePartnersBoxDisplayPosition = useMemo(() => {
    if (!highValuePartnersBoxPillar) {
      return { x: 0, y: 0 };
    }

    return { x: highValuePartnersBoxPillar.x, y: highValuePartnersBoxPillar.y };
  }, [highValuePartnersBoxPillar]);

  const reinvestBoxDisplayPosition = useMemo(() => {
    if (!reinvestBoxPillar) {
      return { x: 0, y: 0 };
    }

    return { x: reinvestBoxPillar.x, y: reinvestBoxPillar.y };
  }, [reinvestBoxPillar]);

  const connectionPillars = useMemo(() => {
    const next: Pillar[] = [...boardPillars];
    if (messageBoxPillar) {
      next.push(messageBoxPillar);
    }
    if (contentPillarsBoxPillar) {
      next.push(contentPillarsBoxPillar);
    }
    if (demographicBoxPillar && demographicPillars.length > 0) {
      next.push(demographicBoxPillar);
    }
    if (instagramCreatorsBoxPillar && psychographicCreatorPillars.length > 0) {
      next.push(instagramCreatorsBoxPillar);
    }
    if (psychographicTraitsBoxPillar && psychographicTraitPillars.length > 0) {
      next.push(psychographicTraitsBoxPillar);
    }
    if (painBoxPillar && painPillars.length > 0) {
      next.push(painBoxPillar);
    }
    if (passionBoxPillar && passionPillars.length > 0) {
      next.push(passionBoxPillar);
    }
    if (experienceBoxPillar && experiencePillars.length > 0) {
      next.push(experienceBoxPillar);
    }
    if (skillBoxPillar && skillPillars.length > 0) {
      next.push(skillBoxPillar);
    }
    if (oneOffBoxPillar && oneOffPillars.length > 0) {
      next.push(oneOffBoxPillar);
    }
    if (ongoingContentBoxPillar && ongoingContentPillars.length > 0) {
      next.push(ongoingContentBoxPillar);
    }
    if (highValuePartnersBoxPillar && highValuePartnersPillars.length > 0) {
      next.push(highValuePartnersBoxPillar);
    }
    if (reinvestBoxPillar && reinvestPillars.length > 0) {
      next.push(reinvestBoxPillar);
    }
    return next;
  }, [
    boardPillars,
    contentPillarsBoxPillar,
    demographicBoxPillar,
    demographicPillars.length,
    experienceBoxPillar,
    experiencePillars.length,
    highValuePartnersBoxPillar,
    highValuePartnersPillars.length,
    instagramCreatorsBoxPillar,
    messageBoxPillar,
    oneOffBoxPillar,
    oneOffPillars.length,
    ongoingContentBoxPillar,
    ongoingContentPillars.length,
    painBoxPillar,
    painPillars.length,
    passionBoxPillar,
    passionPillars.length,
    psychographicCreatorPillars.length,
    psychographicTraitPillars.length,
    psychographicTraitsBoxPillar,
    reinvestBoxPillar,
    reinvestPillars.length,
    skillBoxPillar,
    skillPillars.length,
  ]);

  const selectableBoardElements = useMemo(() => {
    const next: Pillar[] = [...boardPillars];
    if (messageBoxPillar) {
      next.push(messageBoxPillar);
    }
    if (contentPillarsBoxPillar) {
      next.push(contentPillarsBoxPillar);
    }
    if (demographicBoxPillar) {
      next.push(demographicBoxPillar);
    }
    if (instagramCreatorsBoxPillar) {
      next.push(instagramCreatorsBoxPillar);
    }
    if (psychographicTraitsBoxPillar) {
      next.push(psychographicTraitsBoxPillar);
    }
    if (painBoxPillar) {
      next.push(painBoxPillar);
    }
    if (passionBoxPillar) {
      next.push(passionBoxPillar);
    }
    if (experienceBoxPillar) {
      next.push(experienceBoxPillar);
    }
    if (skillBoxPillar) {
      next.push(skillBoxPillar);
    }
    if (oneOffBoxPillar) {
      next.push(oneOffBoxPillar);
    }
    if (ongoingContentBoxPillar) {
      next.push(ongoingContentBoxPillar);
    }
    if (highValuePartnersBoxPillar) {
      next.push(highValuePartnersBoxPillar);
    }
    if (reinvestBoxPillar) {
      next.push(reinvestBoxPillar);
    }
    return next;
  }, [
    boardPillars,
    contentPillarsBoxPillar,
    demographicBoxPillar,
    experienceBoxPillar,
    highValuePartnersBoxPillar,
    instagramCreatorsBoxPillar,
    messageBoxPillar,
    oneOffBoxPillar,
    ongoingContentBoxPillar,
    painBoxPillar,
    passionBoxPillar,
    psychographicTraitsBoxPillar,
    reinvestBoxPillar,
    skillBoxPillar,
  ]);

  const selectableById = useMemo(() => {
    const map = new Map<string, Pillar>();
    for (const item of selectableBoardElements) {
      map.set(item.id, item);
    }
    return map;
  }, [selectableBoardElements]);

  const pillarSizes = useMemo(() => {
    const sizes: Record<string, PillarSize> = {};
    for (const pillar of selectableBoardElements) {
      sizes[pillar.id] = getFrameworkPillarSize(pillar);
    }
    return sizes;
  }, [selectableBoardElements]);

  const getStoredPillarSize = useCallback(
    (pillarId: string) => pillarSizes[pillarId] ?? getPillarSize({ id: pillarId, label: "", x: 0, y: 0 }),
    [pillarSizes],
  );

  const boardExportOverflowRects = useMemo(() => {
    if (!messageBoxPillar) {
      return [];
    }

    const height = messageBoxPillar.height ?? messageBoxPlacementHeight;
    return [
      getMessageBoxExportBounds(
        { x: messageBoxPillar.x, y: messageBoxPillar.y },
        height,
      ),
    ];
  }, [messageBoxPillar, messageBoxPlacementHeight]);

  const boardExportCapture = useMemo(
    () =>
      getBoardExportCapture(
        connectionPillars,
        pillarSizes,
        connections,
        undefined,
        boardExportOverflowRects,
      ),
    [boardExportOverflowRects, connectionPillars, connections, pillarSizes],
  );

  const deletableSelectedIds = useMemo(
    () => selectedPillarIds.filter((id) => isDeletableBoardId(id)),
    [selectedPillarIds],
  );

  useEffect(() => {
    if (!hasSeenWelcomeOnboarding()) {
      setWelcomeOpen(true);
    }
  }, []);

  const handleWelcomeDismiss = useCallback(() => {
    markWelcomeOnboardingSeen();
    setWelcomeOpen(false);
  }, []);

  useEffect(() => {
    connectionDragRef.current = connectionDrag;
  }, [connectionDrag]);

  useEffect(() => {
    selectedPillarIdsRef.current = selectedPillarIds;
  }, [selectedPillarIds]);

  useEffect(() => {
    panRef.current = pan;
  }, [pan]);

  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  const fitBoardToView = useCallback(() => {
    const board = boardRef.current;
    if (
      !board ||
      hasUserInteractedWithViewportRef.current ||
      hasInitialFitRef.current
    ) {
      return;
    }

    const bounds = computeInitialBoardBounds(boardPillars, messageBoxPillar);
    if (!bounds) {
      return;
    }

    const viewportWidth = board.clientWidth;
    const viewportHeight = board.clientHeight;
    if (viewportWidth <= 0 || viewportHeight <= 0) {
      return;
    }

    const nextViewport = fitBoardViewportToBounds(
      viewportWidth,
      viewportHeight,
      bounds,
    );
    setPan(nextViewport.pan);
    setScale(nextViewport.scale);
    hasInitialFitRef.current = true;
  }, [boardPillars, messageBoxPillar]);

  useEffect(() => {
    const board = boardRef.current;
    if (!board) {
      return;
    }

    fitBoardToView();

    const observer = new ResizeObserver(() => {
      fitBoardToView();
    });
    observer.observe(board);

    return () => observer.disconnect();
  }, [fitBoardToView]);

  const beginPan = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      hasUserInteractedWithViewportRef.current = true;
      panSessionRef.current = {
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        startPanX: panRef.current.x,
        startPanY: panRef.current.y,
      };
      suppressMarqueeRef.current = true;
      setIsPanning(true);
      setMarquee(null);
      setConnectionDrag(null);
      event.currentTarget.setPointerCapture(event.pointerId);
      event.preventDefault();
    },
    [],
  );

  const updatePan = useCallback((clientX: number, clientY: number) => {
    const session = panSessionRef.current;
    if (!session) {
      return;
    }

    setPan({
      x: session.startPanX + (clientX - session.startClientX),
      y: session.startPanY + (clientY - session.startClientY),
    });
  }, []);

  const endPan = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const session = panSessionRef.current;
    if (!session || session.pointerId !== event.pointerId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    panSessionRef.current = null;
    suppressMarqueeRef.current = false;
    setIsPanning(false);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedPillarIds([]);
    setConnectionDrag(null);
    setSelectedConnectionId(null);
  }, []);

  const handleDragStart = (event: DragStartEvent) => {
    const draggedId = String(event.active.id);
    const nextDraggingIds = selectedPillarIdsRef.current.includes(draggedId)
      ? selectedPillarIdsRef.current
      : [draggedId];

    setDraggingPillarIds(nextDraggingIds);
    setSelectedPillarIds(nextDraggingIds);
    setActiveId(draggedId);
    setDragDelta({ x: 0, y: 0 });
    setSelectedConnectionId(null);
    setConnectionDrag(null);
    setMarquee(null);
  };

  const handleDragMove = (event: DragMoveEvent) => {
    const boardScale = scaleRef.current;
    setDragDelta({
      x: event.delta.x / boardScale,
      y: event.delta.y / boardScale,
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    const draggedId = String(active.id);
    const idsToMove = selectedPillarIdsRef.current.includes(draggedId)
      ? selectedPillarIdsRef.current
      : [draggedId];
    const boardScale = scaleRef.current;
    const boardDelta = { x: delta.x / boardScale, y: delta.y / boardScale };

    if (boardDelta.x !== 0 || boardDelta.y !== 0) {
      if (idsToMove.includes(MESSAGE_BOX_ID)) {
        onMoveMessageBox(boardDelta);
      }
      if (idsToMove.includes(CONTENT_PILLARS_BOX_ID)) {
        onMoveContentPillarsBox(boardDelta);
      }
      if (idsToMove.includes(DEMOGRAPHIC_BOX_ID)) {
        onMoveDemographicBox(boardDelta);
      }
      if (idsToMove.includes(INSTAGRAM_CREATORS_BOX_ID)) {
        onMoveInstagramCreatorsBox(boardDelta);
      }
      if (idsToMove.includes(PSYCHOGRAPHIC_BOX_ID)) {
        onMovePsychographicTraitsBox(boardDelta);
      }
      if (idsToMove.includes(PAIN_BOX_ID)) {
        onMovePainBox(boardDelta);
      }
      if (idsToMove.includes(PASSION_BOX_ID)) {
        onMovePassionBox(boardDelta);
      }
      if (idsToMove.includes(EXPERIENCE_BOX_ID)) {
        onMoveExperienceBox(boardDelta);
      }
      if (idsToMove.includes(SKILL_BOX_ID)) {
        onMoveSkillBox(boardDelta);
      }
      if (idsToMove.includes(ONE_OFF_BOX_ID)) {
        onMoveOneOffBox(boardDelta);
      }
      if (idsToMove.includes(ONGOING_CONTENT_BOX_ID)) {
        onMoveOngoingContentBox(boardDelta);
      }
      if (idsToMove.includes(HIGH_VALUE_PARTNERS_BOX_ID)) {
        onMoveHighValuePartnersBox(boardDelta);
      }
      if (idsToMove.includes(REINVEST_BOX_ID)) {
        onMoveReinvestBox(boardDelta);
      }

      const pillarIdsToMove = idsToMove.filter((id) => !BOARD_BOX_IDS.has(id));
      if (pillarIdsToMove.length > 0) {
        onMovePillars(pillarIdsToMove, boardDelta);
      }
    }

    setActiveId(null);
    setDraggingPillarIds([]);
    setDragDelta(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setDraggingPillarIds([]);
    setDragDelta(null);
  };

  const handleSelectPillar = useCallback((pillarId: string, additive = false) => {
    setSelectedPillarIds((current) => {
      if (additive) {
        return current.includes(pillarId)
          ? current.filter((id) => id !== pillarId)
          : [...current, pillarId];
      }

      return [pillarId];
    });
    setSelectedConnectionId(null);

    if (!connectionDragRef.current) {
      setConnectionDrag(null);
    }
  }, []);

  const handleRemoveSelection = useCallback(() => {
    if (deletableSelectedIds.length === 0) {
      return;
    }

    onRemovePillars(deletableSelectedIds);
    setSelectedPillarIds((current) => current.filter((id) => isStaticCard(id)));
    setSelectedConnectionId(null);
  }, [deletableSelectedIds, onRemovePillars]);

  const handleHandlePointerDown = useCallback(
    (
      pillarId: string,
      anchor: ConnectionAnchor,
      event: React.PointerEvent<HTMLButtonElement>,
    ) => {
      if (!boardRef.current) {
        return;
      }

      event.preventDefault();
      const point = getBoardPoint(
        boardRef.current,
        event.clientX,
        event.clientY,
        getBoardViewportFromRefs(panRef, scaleRef),
      );

      setSelectedPillarIds([pillarId]);
      setSelectedConnectionId(null);
      setConnectionDrag({
        from: { pillarId, anchor },
        previewX: point.x,
        previewY: point.y,
        hoveredTarget: null,
      });
    },
    [],
  );

  const handleBoardPointerDownCapture = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    const isMiddleMouse = event.button === 1;
    const isSpacePan = event.button === 0 && spacePressedRef.current;

    if (!isMiddleMouse && !isSpacePan) {
      return;
    }

    if (!canStartPanFromTarget(event.target)) {
      return;
    }

    beginPan(event);
  };

  const handleBoardPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (
      event.button !== 0 ||
      suppressMarqueeRef.current ||
      spacePressedRef.current ||
      isPanning
    ) {
      return;
    }

    if (!isBoardBackgroundTarget(event.target)) {
      return;
    }

    if (!boardRef.current) {
      return;
    }

    const point = getBoardPoint(
      boardRef.current,
      event.clientX,
      event.clientY,
      getBoardViewportFromRefs(panRef, scaleRef),
    );
    setMarquee({
      startX: point.x,
      startY: point.y,
      currentX: point.x,
      currentY: point.y,
    });
    setSelectedConnectionId(null);
    setConnectionDrag(null);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleBoardPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (panSessionRef.current) {
      updatePan(event.clientX, event.clientY);
      return;
    }

    if (!marquee) {
      return;
    }

    if (!boardRef.current) {
      return;
    }

    const point = getBoardPoint(
      boardRef.current,
      event.clientX,
      event.clientY,
      getBoardViewportFromRefs(panRef, scaleRef),
    );
    setMarquee((current) =>
      current
        ? {
            ...current,
            currentX: point.x,
            currentY: point.y,
          }
        : null,
    );
  };

  const finalizeMarquee = useCallback(
    (currentMarquee: MarqueeState) => {
      const rect = normalizeRect(
        currentMarquee.startX,
        currentMarquee.startY,
        currentMarquee.currentX,
        currentMarquee.currentY,
      );
      const width = rect.right - rect.left;
      const height = rect.bottom - rect.top;

      if (width < MARQUEE_MIN_SIZE && height < MARQUEE_MIN_SIZE) {
        clearSelection();
        return;
      }

      const nextSelected = selectableBoardElements
        .filter((pillar) => {
          const bounds = getPillarBounds(pillar, getStoredPillarSize(pillar.id));
          return rectsIntersect(rect, bounds);
        })
        .map((pillar) => pillar.id);

      setSelectedPillarIds(nextSelected);
    },
    [clearSelection, getStoredPillarSize, selectableBoardElements],
  );

  const handleBoardPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (panSessionRef.current) {
      endPan(event);
      return;
    }

    if (!marquee) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    finalizeMarquee(marquee);
    setMarquee(null);
  };

  useEffect(() => {
    if (!connectionDrag) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (!boardRef.current) {
        return;
      }

      const point = getBoardPoint(
        boardRef.current,
        event.clientX,
        event.clientY,
        getBoardViewportFromRefs(panRef, scaleRef),
      );
      const hoveredTarget = getHandleFromElement(
        document.elementFromPoint(event.clientX, event.clientY),
      );

      setConnectionDrag((current) =>
        current
          ? {
              ...current,
              previewX: point.x,
              previewY: point.y,
              hoveredTarget,
            }
          : null,
      );
    };

    const handlePointerUp = (event: PointerEvent) => {
      const current = connectionDragRef.current;
      if (!current) {
        return;
      }

      const target =
        getHandleFromElement(document.elementFromPoint(event.clientX, event.clientY)) ??
        current.hoveredTarget;

      if (target && !isSameHandle(current.from, target)) {
        onAddConnection(
          current.from.pillarId,
          current.from.anchor,
          target.pillarId,
          target.anchor,
        );
        setSelectedPillarIds([target.pillarId]);
      }

      setConnectionDrag(null);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [connectionDrag, onAddConnection]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isTypingTarget =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement;

      if (event.code === "Space" && !isTypingTarget) {
        event.preventDefault();
        if (!spacePressedRef.current) {
          spacePressedRef.current = true;
          setSpacePressed(true);
        }
        return;
      }

      if (event.key === "Escape") {
        setConnectionDrag(null);
        setSelectedConnectionId(null);
        setMarquee(null);
        if (panSessionRef.current) {
          panSessionRef.current = null;
          suppressMarqueeRef.current = false;
          setIsPanning(false);
        }
        return;
      }

      if (event.key !== "Delete" && event.key !== "Backspace") {
        return;
      }

      if (isTypingTarget) {
        return;
      }

      event.preventDefault();
      const deletable = selectedPillarIdsRef.current.filter((id) =>
        isDeletableBoardId(id),
      );
      if (deletable.length === 0) {
        return;
      }

      onRemovePillars(deletable);
      setSelectedPillarIds((current) => current.filter((id) => isStaticCard(id)));
      setSelectedConnectionId(null);
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code !== "Space") {
        return;
      }

      spacePressedRef.current = false;
      setSpacePressed(false);
    };

    const handleWindowBlur = () => {
      spacePressedRef.current = false;
      setSpacePressed(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleWindowBlur);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [onRemovePillars]);

  useEffect(() => {
    const board = boardRef.current;
    if (!board) {
      return;
    }

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      hasUserInteractedWithViewportRef.current = true;

      const rect = board.getBoundingClientRect();
      const pointerX = event.clientX - rect.left;
      const pointerY = event.clientY - rect.top;
      const oldScale = scaleRef.current;
      const nextScale = clampBoardScale(
        oldScale * Math.exp(-event.deltaY * ZOOM_WHEEL_INTENSITY),
      );

      if (nextScale === oldScale) {
        return;
      }

      const currentPan = panRef.current;
      const boardX = (pointerX - currentPan.x) / oldScale;
      const boardY = (pointerY - currentPan.y) / oldScale;

      setPan({
        x: pointerX - boardX * nextScale,
        y: pointerY - boardY * nextScale,
      });
      setScale(nextScale);
    };

    board.addEventListener("wheel", handleWheel, { passive: false });
    return () => board.removeEventListener("wheel", handleWheel);
  }, []);

  const marqueeRect: BoardRect | null = marquee
    ? normalizeRect(marquee.startX, marquee.startY, marquee.currentX, marquee.currentY)
    : null;

  const selectionToolbarPosition = useMemo(() => {
    if (deletableSelectedIds.length === 0) {
      return null;
    }

    let left = Infinity;
    let top = Infinity;
    let right = -Infinity;

    for (const id of selectedPillarIds) {
      const pillar = selectableById.get(id);
      if (!pillar) {
        continue;
      }

      const bounds = getPillarBounds(pillar, getStoredPillarSize(id));
      left = Math.min(left, bounds.left);
      top = Math.min(top, bounds.top);
      right = Math.max(right, bounds.right);
    }

    if (!Number.isFinite(left) || !Number.isFinite(top)) {
      return null;
    }

    return {
      left: (left + right) / 2,
      top: Math.max(8, top - 48),
    };
  }, [deletableSelectedIds.length, getStoredPillarSize, selectableById, selectedPillarIds]);

  const previewLine = connectionDrag
    ? (() => {
        const sourcePillar = connectionPillars.find(
          (pillar) => pillar.id === connectionDrag.from.pillarId,
        );
        if (!sourcePillar) {
          return null;
        }

        const fromCenter = getAnchorPoint(
          sourcePillar,
          connectionDrag.from.anchor,
          getStoredPillarSize(sourcePillar.id),
        );

        if (connectionDrag.hoveredTarget) {
          const targetPillar = connectionPillars.find(
            (pillar) => pillar.id === connectionDrag.hoveredTarget?.pillarId,
          );
          if (targetPillar) {
            const toCenter = getAnchorPoint(
              targetPillar,
              connectionDrag.hoveredTarget.anchor,
              getStoredPillarSize(targetPillar.id),
            );
            return {
              x1: fromCenter.x,
              y1: fromCenter.y,
              x2: toCenter.x,
              y2: toCenter.y,
            };
          }
        }

        return {
          x1: fromCenter.x,
          y1: fromCenter.y,
          x2: connectionDrag.previewX,
          y2: connectionDrag.previewY,
        };
      })()
    : null;

  const dragLocked = readOnly || spacePressed || isPanning;

  const showHandlesForCard = (pillarId: string) =>
    !readOnly &&
    ((selectedPillarIds.length === 1 && selectedPillarIds[0] === pillarId) ||
      isConnecting);

  const handleShareClick = useCallback(() => {
    if (!onShare || readOnly) {
      return;
    }

    setIsSharing(true);
    setShareMessage(null);

    void Promise.resolve(onShare())
      .then(() => {
        setShareMessage("Share link copied to clipboard.");
      })
      .catch((error: unknown) => {
        const message =
          error instanceof Error ? error.message : "Could not create share link.";
        setShareMessage(message);
      })
      .finally(() => {
        setIsSharing(false);
        window.setTimeout(() => setShareMessage(null), 5000);
      });
  }, [onShare, readOnly]);

  const handleDownloadBoard = useCallback(async () => {
    if (!boardRef.current || isDownloading || !boardExportCapture) {
      return;
    }

    const savedSelection = selectedPillarIds;
    const savedConnectionId = selectedConnectionId;

    setIsDownloading(true);

    flushSync(() => {
      clearSelection();
      setMarquee(null);
    });

    try {
      await downloadBoardAsJpg(boardRef.current, boardExportCapture);
    } catch (error) {
      console.error("Failed to download board image", error);
    } finally {
      flushSync(() => {
        setSelectedPillarIds(savedSelection);
        setSelectedConnectionId(savedConnectionId);
      });
      setIsDownloading(false);
    }
  }, [
    boardExportCapture,
    clearSelection,
    isDownloading,
    selectedConnectionId,
    selectedPillarIds,
  ]);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <section className="board-canvas relative h-screen min-w-0 flex-1 overflow-hidden">
        <BoardFloatingToolbar
          readOnly={readOnly}
          isDownloading={isDownloading}
          isSharing={isSharing}
          shareMessage={shareMessage}
          boardTheme={boardTheme}
          onBoardThemeChange={setBoardTheme}
          onShare={onShare ? handleShareClick : undefined}
          onDownload={() => {
            void handleDownloadBoard();
          }}
        />

        <div
          ref={boardRef}
          data-board-theme={boardTheme}
          className={`board-surface relative h-full w-full overflow-hidden ${
            isPanning ? "cursor-grabbing" : spacePressed ? "cursor-grab" : ""
          }`}
          onPointerDownCapture={handleBoardPointerDownCapture}
          onPointerDown={handleBoardPointerDown}
          onPointerMove={handleBoardPointerMove}
          onPointerUp={handleBoardPointerUp}
          onPointerCancel={handleBoardPointerUp}
          onContextMenu={(event) => {
            if (event.button === 1) {
              event.preventDefault();
            }
          }}
        >
          <div
            data-board-layer
            className="relative h-full w-full"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
              transformOrigin: "0 0",
            }}
          >
            <MessageBox
              readOnly={readOnly}
              position={messageBoxDisplayPosition}
              message={message}
              hasPillars={hasContentPillars}
              suggestedPillars={suggestedPillars}
              isGeneratingMessage={isGeneratingMessage}
              isGeneratingPillars={isGeneratingPillars}
              messageError={messageError}
              pillarsError={pillarsError}
              isDragging={activeId === MESSAGE_BOX_ID}
              isSelected={selectedPillarIds.includes(MESSAGE_BOX_ID)}
              groupDragDelta={getGroupDragDelta(
                MESSAGE_BOX_ID,
                activeId,
                dragDelta,
                selectedPillarIds,
              )}
              boardScale={scale}
              disableDrag={dragLocked}
              onMessageChange={onMessageChange}
              onGenerateMessage={onGenerateMessage}
              onGeneratePillars={onGeneratePillars}
              onAddSelectedPillars={onAddSelectedPillars}
              onClearSuggestedPillars={onClearSuggestedPillars}
              onAddPillar={onAddPillar}
              onSelect={handleSelectPillar}
              onLayoutHeightChange={handleMessageBoxLayoutHeight}
            />
            {hasContentPillars ? (
              <ContentPillarsBox
                position={contentPillarsBoxDisplayPosition}
                pillars={contentPillars}
                cellHeight={contentPillarsCellHeight}
                boxSize={contentPillarsBoxSize}
                isDragging={activeId === CONTENT_PILLARS_BOX_ID}
                isSelected={selectedPillarIds.includes(CONTENT_PILLARS_BOX_ID)}
                groupDragDelta={getGroupDragDelta(
                  CONTENT_PILLARS_BOX_ID,
                  activeId,
                  dragDelta,
                  selectedPillarIds,
                )}
                boardScale={scale}
                disableDrag={dragLocked}
                onSelect={handleSelectPillar}
                onUpdateLabel={onUpdateLabel}
                onRemovePillar={(id) => onRemovePillars([id])}
              />
            ) : null}
            {demographicPillars.length > 0 ? (
              <AudiencePillarsBox
                boxId={DEMOGRAPHIC_BOX_ID}
                title="Demographic"
                position={demographicBoxDisplayPosition}
                pillars={demographicPillars}
                cellHeight={audienceCellHeight}
                boxSize={demographicBoxSize}
                isDragging={activeId === DEMOGRAPHIC_BOX_ID}
                isSelected={selectedPillarIds.includes(DEMOGRAPHIC_BOX_ID)}
                groupDragDelta={getGroupDragDelta(
                  DEMOGRAPHIC_BOX_ID,
                  activeId,
                  dragDelta,
                  selectedPillarIds,
                )}
                boardScale={scale}
                disableDrag={dragLocked}
                onSelect={handleSelectPillar}
                onUpdateLabel={onUpdateLabel}
                onRemovePillar={(id) => onRemovePillars([id])}
              />
            ) : null}
            {psychographicCreatorPillars.length > 0 ? (
              <AudiencePillarsBox
                boxId={INSTAGRAM_CREATORS_BOX_ID}
                title="Creators"
                position={instagramCreatorsBoxDisplayPosition}
                pillars={psychographicCreatorPillars}
                cellHeight={audienceCellHeight}
                boxSize={instagramCreatorsBoxSize}
                isDragging={activeId === INSTAGRAM_CREATORS_BOX_ID}
                isSelected={selectedPillarIds.includes(INSTAGRAM_CREATORS_BOX_ID)}
                groupDragDelta={getGroupDragDelta(
                  INSTAGRAM_CREATORS_BOX_ID,
                  activeId,
                  dragDelta,
                  selectedPillarIds,
                )}
                boardScale={scale}
                disableDrag={dragLocked}
                onSelect={handleSelectPillar}
                onUpdateLabel={onUpdateLabel}
                onRemovePillar={(id) => onRemovePillars([id])}
              />
            ) : null}
            {psychographicTraitsBoxPillar ? (
              <AudiencePillarsBox
                boxId={PSYCHOGRAPHIC_BOX_ID}
                title="Psychological & behavioral traits"
                position={psychographicTraitsBoxDisplayPosition}
                pillars={psychographicTraitPillars}
                cellHeight={audienceCellHeight}
                boxSize={psychographicTraitsBoxSize}
                isDragging={activeId === PSYCHOGRAPHIC_BOX_ID}
                isSelected={selectedPillarIds.includes(PSYCHOGRAPHIC_BOX_ID)}
                groupDragDelta={getGroupDragDelta(
                  PSYCHOGRAPHIC_BOX_ID,
                  activeId,
                  dragDelta,
                  selectedPillarIds,
                )}
                boardScale={scale}
                disableDrag={dragLocked}
                onSelect={handleSelectPillar}
                onUpdateLabel={onUpdateLabel}
                onRemovePillar={(id) => onRemovePillars([id])}
              />
            ) : null}
            {painPillars.length > 0 ? (
              <AudiencePillarsBox
                boxId={PAIN_BOX_ID}
                title="Pain points"
                position={painBoxDisplayPosition}
                pillars={painPillars}
                cellHeight={audienceCellHeight}
                boxSize={painBoxSize}
                isDragging={activeId === PAIN_BOX_ID}
                isSelected={selectedPillarIds.includes(PAIN_BOX_ID)}
                groupDragDelta={getGroupDragDelta(
                  PAIN_BOX_ID,
                  activeId,
                  dragDelta,
                  selectedPillarIds,
                )}
                boardScale={scale}
                disableDrag={dragLocked}
                onSelect={handleSelectPillar}
                onUpdateLabel={onUpdateLabel}
                onRemovePillar={(id) => onRemovePillars([id])}
              />
            ) : null}
            {passionPillars.length > 0 ? (
              <AudiencePillarsBox
                boxId={PASSION_BOX_ID}
                title="Passion points"
                position={passionBoxDisplayPosition}
                pillars={passionPillars}
                cellHeight={audienceCellHeight}
                boxSize={passionBoxSize}
                isDragging={activeId === PASSION_BOX_ID}
                isSelected={selectedPillarIds.includes(PASSION_BOX_ID)}
                groupDragDelta={getGroupDragDelta(
                  PASSION_BOX_ID,
                  activeId,
                  dragDelta,
                  selectedPillarIds,
                )}
                boardScale={scale}
                disableDrag={dragLocked}
                onSelect={handleSelectPillar}
                onUpdateLabel={onUpdateLabel}
                onRemovePillar={(id) => onRemovePillars([id])}
              />
            ) : null}
            {experiencePillars.length > 0 ? (
              <AudiencePillarsBox
                boxId={EXPERIENCE_BOX_ID}
                title="Experience"
                position={experienceBoxDisplayPosition}
                pillars={experiencePillars}
                cellHeight={audienceCellHeight}
                boxSize={experienceBoxSize}
                isDragging={activeId === EXPERIENCE_BOX_ID}
                isSelected={selectedPillarIds.includes(EXPERIENCE_BOX_ID)}
                groupDragDelta={getGroupDragDelta(
                  EXPERIENCE_BOX_ID,
                  activeId,
                  dragDelta,
                  selectedPillarIds,
                )}
                boardScale={scale}
                disableDrag={dragLocked}
                onSelect={handleSelectPillar}
                onUpdateLabel={onUpdateLabel}
                onRemovePillar={(id) => onRemovePillars([id])}
              />
            ) : null}
            {skillPillars.length > 0 ? (
              <AudiencePillarsBox
                boxId={SKILL_BOX_ID}
                title="Skills"
                position={skillBoxDisplayPosition}
                pillars={skillPillars}
                cellHeight={audienceCellHeight}
                boxSize={skillBoxSize}
                isDragging={activeId === SKILL_BOX_ID}
                isSelected={selectedPillarIds.includes(SKILL_BOX_ID)}
                groupDragDelta={getGroupDragDelta(
                  SKILL_BOX_ID,
                  activeId,
                  dragDelta,
                  selectedPillarIds,
                )}
                boardScale={scale}
                disableDrag={dragLocked}
                onSelect={handleSelectPillar}
                onUpdateLabel={onUpdateLabel}
                onRemovePillar={(id) => onRemovePillars([id])}
              />
            ) : null}
            {oneOffPillars.length > 0 ? (
              <AudiencePillarsBox
                boxId={ONE_OFF_BOX_ID}
                title="One-off"
                position={oneOffBoxDisplayPosition}
                pillars={oneOffPillars}
                cellHeight={audienceCellHeight}
                boxSize={oneOffBoxSize}
                isDragging={activeId === ONE_OFF_BOX_ID}
                isSelected={selectedPillarIds.includes(ONE_OFF_BOX_ID)}
                groupDragDelta={getGroupDragDelta(
                  ONE_OFF_BOX_ID,
                  activeId,
                  dragDelta,
                  selectedPillarIds,
                )}
                boardScale={scale}
                disableDrag={dragLocked}
                onSelect={handleSelectPillar}
                onUpdateLabel={onUpdateLabel}
                onRemovePillar={(id) => onRemovePillars([id])}
              />
            ) : null}
            {ongoingContentPillars.length > 0 ? (
              <AudiencePillarsBox
                boxId={ONGOING_CONTENT_BOX_ID}
                title="Ongoing content"
                position={ongoingContentBoxDisplayPosition}
                pillars={ongoingContentPillars}
                cellHeight={audienceCellHeight}
                boxSize={ongoingContentBoxSize}
                isDragging={activeId === ONGOING_CONTENT_BOX_ID}
                isSelected={selectedPillarIds.includes(ONGOING_CONTENT_BOX_ID)}
                groupDragDelta={getGroupDragDelta(
                  ONGOING_CONTENT_BOX_ID,
                  activeId,
                  dragDelta,
                  selectedPillarIds,
                )}
                boardScale={scale}
                disableDrag={dragLocked}
                onSelect={handleSelectPillar}
                onUpdateLabel={onUpdateLabel}
                onRemovePillar={(id) => onRemovePillars([id])}
              />
            ) : null}
            {highValuePartnersPillars.length > 0 ? (
              <AudiencePillarsBox
                boxId={HIGH_VALUE_PARTNERS_BOX_ID}
                title="High value partners"
                position={highValuePartnersBoxDisplayPosition}
                pillars={highValuePartnersPillars}
                cellHeight={audienceCellHeight}
                boxSize={highValuePartnersBoxSize}
                isDragging={activeId === HIGH_VALUE_PARTNERS_BOX_ID}
                isSelected={selectedPillarIds.includes(HIGH_VALUE_PARTNERS_BOX_ID)}
                groupDragDelta={getGroupDragDelta(
                  HIGH_VALUE_PARTNERS_BOX_ID,
                  activeId,
                  dragDelta,
                  selectedPillarIds,
                )}
                boardScale={scale}
                disableDrag={dragLocked}
                onSelect={handleSelectPillar}
                onUpdateLabel={onUpdateLabel}
                onRemovePillar={(id) => onRemovePillars([id])}
              />
            ) : null}
            {reinvestPillars.length > 0 ? (
              <AudiencePillarsBox
                boxId={REINVEST_BOX_ID}
                title="Reinvest"
                position={reinvestBoxDisplayPosition}
                pillars={reinvestPillars}
                cellHeight={audienceCellHeight}
                boxSize={reinvestBoxSize}
                isDragging={activeId === REINVEST_BOX_ID}
                isSelected={selectedPillarIds.includes(REINVEST_BOX_ID)}
                groupDragDelta={getGroupDragDelta(
                  REINVEST_BOX_ID,
                  activeId,
                  dragDelta,
                  selectedPillarIds,
                )}
                boardScale={scale}
                disableDrag={dragLocked}
                onSelect={handleSelectPillar}
                onUpdateLabel={onUpdateLabel}
                onRemovePillar={(id) => onRemovePillars([id])}
              />
            ) : null}
            <BoardConnections
              pillars={connectionPillars}
              connections={connections}
              pillarSizes={pillarSizes}
              activeDrag={activeDrag}
              selectedConnectionId={selectedConnectionId}
              previewLine={previewLine}
              onSelectConnection={setSelectedConnectionId}
              onRemoveConnection={onRemoveConnection}
            />
            {marqueeRect ? (
              <div
                data-export-hide
                className="pointer-events-none absolute z-40 border"
                style={{
                  borderColor: "var(--board-marquee-border)",
                  backgroundColor: "var(--board-marquee-fill)",
                  left: marqueeRect.left,
                  top: marqueeRect.top,
                  width: marqueeRect.right - marqueeRect.left,
                  height: marqueeRect.bottom - marqueeRect.top,
                }}
              />
            ) : null}
            {selectionToolbarPosition ? (
              <div
                data-selection-toolbar
                className="absolute z-50 -translate-x-1/2"
                style={{
                  left: selectionToolbarPosition.left,
                  top: selectionToolbarPosition.top,
                }}
              >
                <button
                  type="button"
                  aria-label={`Remove ${deletableSelectedIds.length} selected pillars`}
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={(event) => {
                    event.stopPropagation();
                    handleRemoveSelection();
                  }}
                  className="flex h-9 items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 text-sm text-zinc-600 shadow-md transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                >
                  <TrashIcon />
                  <span>
                    {deletableSelectedIds.length === 1
                      ? "Delete"
                      : `Delete ${deletableSelectedIds.length}`}
                  </span>
                </button>
              </div>
            ) : null}
            {boardPillars.map((pillar) => (
              <PillarCard
                key={pillar.id}
                readOnly={readOnly}
                pillar={pillar}
                isVisionCard={isVisionCard(pillar)}
                isStaticCard={isStaticCard(pillar)}
                isDragging={activeId === pillar.id}
                isSelected={selectedPillarIds.includes(pillar.id)}
                showHandles={showHandlesForCard(pillar.id)}
                groupDragDelta={
                  activeId &&
                  dragDelta &&
                  draggingPillarIds.includes(pillar.id) &&
                  pillar.id !== activeId
                    ? dragDelta
                    : null
                }
                boardScale={scale}
                disableDrag={dragLocked}
                activeSource={connectionDrag?.from ?? null}
                hoveredTarget={connectionDrag?.hoveredTarget ?? null}
                onSelect={handleSelectPillar}
                onHandlePointerDown={handleHandlePointerDown}
                onUpdateLabel={onUpdateLabel}
                onResize={onUpdatePillarSize}
                onResizeStart={onResizeStart}
                onResizeEnd={onResizeEnd}
                footer={
                  readOnly ? undefined : pillar.id === FRAMEWORK_CARD_IDS.demographic ? (
                    <AudienceFrameworkFooter
                      canBuildSuggestions={hasContentPillars}
                      isGenerating={isGeneratingDemographic}
                      generateError={demographicError}
                      onGenerate={onGenerateDemographic}
                      onAddManually={onAddDemographicPillar}
                    />
                  ) : pillar.id === FRAMEWORK_CARD_IDS.psychographic ? (
                    <PsychographicFrameworkFooter
                      canBuildSuggestions={hasContentPillars}
                      isGenerating={isGeneratingPsychographic}
                      generateError={psychographicError}
                      onGenerateTraits={onGeneratePsychographic}
                      onAddCreator={onAddInstagramCreatorPillar}
                      onAddTrait={onAddPsychographicTraitPillar}
                    />
                  ) : pillar.id === FRAMEWORK_CARD_IDS.pain ? (
                    <PainFrameworkFooter
                      canBuildSuggestions={hasContentPillars}
                      isGenerating={isGeneratingPainPoints}
                      generateError={painError}
                      onBuildPainPoints={() => setPainPointsDialogOpen(true)}
                      onAddManually={onAddPainPillar}
                    />
                  ) : pillar.id === FRAMEWORK_CARD_IDS.passion ? (
                    <PassionFrameworkFooter
                      canBuildSuggestions={hasContentPillars}
                      isGenerating={isGeneratingPassionPoints}
                      generateError={passionError}
                      onBuildPassionPoints={() => setPassionPointsDialogOpen(true)}
                      onAddManually={onAddPassionPillar}
                    />
                  ) : pillar.id === FRAMEWORK_CARD_IDS.experience ? (
                    <ExperienceFrameworkFooter
                      canBuildSuggestions={hasContentPillars}
                      isGenerating={isGeneratingExperience}
                      generateError={experienceError}
                      onBuildExperience={() => setExperienceDialogOpen(true)}
                      onAddManually={onAddExperiencePillar}
                    />
                  ) : pillar.id === FRAMEWORK_CARD_IDS.skill ? (
                    <SkillFrameworkFooter
                      canBuildSuggestions={hasContentPillars}
                      isGenerating={isGeneratingSkills}
                      generateError={skillError}
                      onBuildSkills={() => setSkillsDialogOpen(true)}
                      onAddManually={onAddSkillPillar}
                    />
                  ) : pillar.id === FRAMEWORK_CARD_IDS.oneOff ? (
                    renderMonetizationCategoryFooter("oneOff", onAddOneOffPillar)
                  ) : pillar.id === FRAMEWORK_CARD_IDS.ongoingContent ? (
                    renderMonetizationCategoryFooter(
                      "ongoingContent",
                      onAddOngoingContentPillar,
                    )
                  ) : pillar.id === FRAMEWORK_CARD_IDS.highValuePartners ? (
                    renderMonetizationCategoryFooter(
                      "highValuePartners",
                      onAddHighValuePartnersPillar,
                    )
                  ) : pillar.id === FRAMEWORK_CARD_IDS.reinvest ? (
                    renderMonetizationCategoryFooter("reinvest", onAddReinvestPillar)
                  ) : undefined
                }
              />
            ))}
          </div>
        </div>
      </section>
      {!readOnly ? (
        <WelcomeOnboardingModal
          open={welcomeOpen && !isDownloading}
          onDismiss={handleWelcomeDismiss}
        />
      ) : null}
      {!readOnly ? (
        <>
      <BuildPainPointsDialog
        open={painPointsDialogOpen}
        isGenerating={isGeneratingPainPoints}
        error={painError}
        onClose={() => setPainPointsDialogOpen(false)}
        onSubmit={async (answers) => {
          const success = await onGeneratePainPoints(answers);
          if (success) {
            setPainPointsDialogOpen(false);
          }
        }}
      />
      <BuildPassionPointsDialog
        open={passionPointsDialogOpen}
        isGenerating={isGeneratingPassionPoints}
        error={passionError}
        onClose={() => setPassionPointsDialogOpen(false)}
        onSubmit={async (answers) => {
          const success = await onGeneratePassionPoints(answers);
          if (success) {
            setPassionPointsDialogOpen(false);
          }
        }}
      />
      <BuildExperienceDialog
        open={experienceDialogOpen}
        isGenerating={isGeneratingExperience}
        error={experienceError}
        onClose={() => setExperienceDialogOpen(false)}
        onSubmit={async (answers) => {
          const success = await onGenerateExperience(answers);
          if (success) {
            setExperienceDialogOpen(false);
          }
        }}
      />
      <BuildSkillsDialog
        open={skillsDialogOpen}
        isGenerating={isGeneratingSkills}
        error={skillError}
        onClose={() => setSkillsDialogOpen(false)}
        onSubmit={async (answers) => {
          const success = await onGenerateSkills(answers);
          if (success) {
            setSkillsDialogOpen(false);
          }
        }}
      />
      <BuildEcosystemDialog
        open={ecosystemDialogOpen}
        category={ecosystemDialogCategory}
        isGenerating={isGeneratingEcosystem}
        error={ecosystemError}
        onClose={() => {
          setEcosystemDialogOpen(false);
          setEcosystemDialogCategory(null);
        }}
        onSubmit={async (answers) => {
          if (!ecosystemDialogCategory) {
            return;
          }
          const success = await onGenerateEcosystem(answers, ecosystemDialogCategory);
          if (success) {
            setEcosystemDialogOpen(false);
            setEcosystemDialogCategory(null);
          }
        }}
      />
        </>
      ) : null}
    </DndContext>
  );
}
