"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useCallback, useRef, useState } from "react";
import {
  clampPillarSize,
  CONNECTION_ANCHORS,
  getAnchorOffsetStyles,
  getPillarSize,
  AUDIENCE_FRAMEWORK_CARD_MIN_HEIGHT,
  type PillarSize,
} from "@/lib/board-geometry";
import type { ConnectionAnchor, Pillar } from "@/lib/vision-store";
import type { ReactNode } from "react";

type HandleTarget = {
  pillarId: string;
  anchor: ConnectionAnchor;
};

type PillarCardProps = {
  pillar: Pillar;
  isVisionCard?: boolean;
  isStaticCard?: boolean;
  isDragging?: boolean;
  isSelected?: boolean;
  showHandles?: boolean;
  groupDragDelta?: { x: number; y: number } | null;
  activeSource?: HandleTarget | null;
  hoveredTarget?: HandleTarget | null;
  onSelect: (id: string, additive?: boolean) => void;
  onHandlePointerDown: (
    pillarId: string,
    anchor: ConnectionAnchor,
    event: React.PointerEvent<HTMLButtonElement>,
  ) => void;
  onUpdateLabel: (id: string, label: string) => void;
  onResize: (id: string, width: number, height: number) => void;
  onResizeStart?: () => void;
  onResizeEnd?: () => void;
  boardScale?: number;
  disableDrag?: boolean;
  readOnly?: boolean;
  footer?: ReactNode;
};

function isSameHandle(a: HandleTarget | null | undefined, pillarId: string, anchor: ConnectionAnchor) {
  return a?.pillarId === pillarId && a?.anchor === anchor;
}

export function PillarCard({
  pillar,
  isVisionCard = false,
  isStaticCard = false,
  isDragging = false,
  isSelected = false,
  showHandles = false,
  groupDragDelta = null,
  activeSource = null,
  hoveredTarget = null,
  onSelect,
  onHandlePointerDown,
  onUpdateLabel,
  onResize,
  onResizeStart,
  onResizeEnd,
  boardScale = 1,
  disableDrag = false,
  readOnly = false,
  footer,
}: PillarCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftLabel, setDraftLabel] = useState(pillar.label);
  const [isResizing, setIsResizing] = useState(false);

  const resizeSessionRef = useRef<{
    startX: number;
    startY: number;
    startSize: PillarSize;
  } | null>(null);

  const storedSize = getPillarSize(pillar);

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: pillar.id,
    disabled: isEditing || isResizing || disableDrag || readOnly,
  });

  const setOuterRef = useCallback(
    (node: HTMLDivElement | null) => {
      setNodeRef(node);
    },
    [setNodeRef],
  );

  const commitLabel = () => {
    const trimmed = draftLabel.trim();
    if (trimmed) {
      onUpdateLabel(pillar.id, trimmed);
    } else {
      setDraftLabel(pillar.label);
    }
    setIsEditing(false);
  };

  const startEditing = () => {
    setDraftLabel(pillar.label);
    setIsEditing(true);
  };

  const handleResizePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.stopPropagation();
      event.preventDefault();

      const startSize = getPillarSize(pillar);
      resizeSessionRef.current = {
        startX: event.clientX,
        startY: event.clientY,
        startSize,
      };

      onResizeStart?.();
      setIsResizing(true);
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [onResizeStart, pillar],
  );

  const handleResizePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const session = resizeSessionRef.current;
      if (!session) {
        return;
      }

      const nextSize = clampPillarSize({
        width:
          session.startSize.width + (event.clientX - session.startX) / boardScale,
        height:
          session.startSize.height + (event.clientY - session.startY) / boardScale,
      });

      onResize(pillar.id, nextSize.width, nextSize.height);
    },
    [boardScale, onResize, pillar.id],
  );

  const finishResize = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const session = resizeSessionRef.current;
      if (!session) {
        return;
      }

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      const nextSize = clampPillarSize({
        width:
          session.startSize.width + (event.clientX - session.startX) / boardScale,
        height:
          session.startSize.height + (event.clientY - session.startY) / boardScale,
      });

      onResize(pillar.id, nextSize.width, nextSize.height);
      resizeSessionRef.current = null;
      setIsResizing(false);
      onResizeEnd?.();
    },
    [boardScale, onResize, onResizeEnd, pillar.id],
  );

  const dragTransform =
    isDragging && transform
      ? {
          ...transform,
          x: transform.x / boardScale,
          y: transform.y / boardScale,
        }
      : groupDragDelta
        ? { x: groupDragDelta.x, y: groupDragDelta.y, scaleX: 1, scaleY: 1 }
        : null;

  const style = {
    left: pillar.x,
    top: pillar.y,
    transform: CSS.Translate.toString(dragTransform),
    zIndex: isDragging || isSelected || isResizing ? 50 : 2,
    touchAction: "none",
  };

  const cardSizeStyle = footer
    ? {
        width: storedSize.width,
        minHeight: Math.max(storedSize.height, AUDIENCE_FRAMEWORK_CARD_MIN_HEIGHT),
      }
    : {
        width: storedSize.width,
        height: storedSize.height,
      };

  const isHighlighted = isDragging || isSelected;

  const cardSurfaceClass = isStaticCard
    ? `board-framework-card backdrop-blur-sm ${
        isHighlighted ? "board-framework-card--selected shadow-lg" : ""
      }`
    : `board-pillar-card backdrop-blur-sm ${
        isHighlighted ? "board-pillar-card--selected shadow-lg" : "hover:shadow-lg"
      }`;

  return (
    <div
      ref={setOuterRef}
      data-pillar-card={pillar.id}
      style={style}
      {...listeners}
      {...attributes}
      onClick={(event) => {
        event.stopPropagation();
        if (!isDragging && !isResizing) {
          onSelect(
            pillar.id,
            event.shiftKey || event.metaKey || event.ctrlKey,
          );
        }
      }}
      className={`absolute ${isDragging ? "cursor-grabbing" : isResizing ? "cursor-se-resize" : "cursor-grab"}`}
    >
      <div className="relative" style={cardSizeStyle}>
        <div
          className={`flex min-h-0 flex-col overflow-hidden rounded-xl border p-3 shadow-md transition-shadow ${
            footer ? "gap-2" : "h-full items-center justify-center"
          } ${cardSurfaceClass}`}
          style={
            footer
              ? {
                  minHeight: Math.max(
                    storedSize.height,
                    AUDIENCE_FRAMEWORK_CARD_MIN_HEIGHT,
                  ),
                }
              : { height: "100%" }
          }
        >
        {isEditing ? (
          <input
            autoFocus
            value={draftLabel}
            onChange={(event) => setDraftLabel(event.target.value)}
            onBlur={commitLabel}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                commitLabel();
              }
              if (event.key === "Escape") {
                setDraftLabel(pillar.label);
                setIsEditing(false);
              }
            }}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-full shrink-0 rounded border border-violet-200 bg-white/90 px-2 py-1 text-center text-sm outline-none ring-violet-500 focus:ring-2"
          />
        ) : (
          <div
            className={`flex w-full shrink-0 items-center justify-center overflow-auto ${
              footer ? "" : "min-h-0 flex-1"
            }`}
          >
            <p
              onDoubleClick={(event) => {
                event.stopPropagation();
                if (!readOnly) {
                  startEditing();
                }
              }}
              className="board-text w-full select-none text-center text-sm font-medium leading-snug"
              title={readOnly ? undefined : "Double-click to edit"}
            >
              {pillar.label}
            </p>
          </div>
        )}

        {footer ? (
          <div
            className="w-full shrink-0"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
          >
            {footer}
          </div>
        ) : null}

        {isSelected && !isEditing && !readOnly ? (
          <div
            data-resize-handle
            aria-label="Resize card"
            onPointerDown={handleResizePointerDown}
            onPointerMove={handleResizePointerMove}
            onPointerUp={finishResize}
            onPointerCancel={finishResize}
            className="absolute bottom-0 right-0 z-20 h-4 w-4 cursor-se-resize touch-none"
          >
            <span className="absolute bottom-1 right-1 block h-2.5 w-2.5 rounded-sm border border-violet-400 bg-white/90" />
          </div>
        ) : null}
        </div>

        {showHandles
          ? CONNECTION_ANCHORS.map((anchor) => {
              const isActiveSource = isSameHandle(activeSource, pillar.id, anchor);
              const isHoveredTarget = isSameHandle(hoveredTarget, pillar.id, anchor);

              return (
                <button
                  key={anchor}
                  type="button"
                  aria-label={`Connect from ${anchor}`}
                  data-connection-handle={`${pillar.id}:${anchor}`}
                  data-pillar-id={pillar.id}
                  data-anchor={anchor}
                  style={{
                    ...getAnchorOffsetStyles(anchor),
                    borderColor: isActiveSource
                      ? "var(--board-accent-strong)"
                      : isHoveredTarget
                        ? "var(--board-accent)"
                        : "var(--board-handle-border)",
                    backgroundColor: isActiveSource
                      ? "var(--board-accent)"
                      : isHoveredTarget
                        ? "var(--board-accent-soft)"
                        : "var(--board-handle-bg)",
                  }}
                  onPointerDown={(event) => {
                    event.stopPropagation();
                    onHandlePointerDown(pillar.id, anchor, event);
                  }}
                  className="absolute z-30 h-3.5 w-3.5 cursor-crosshair rounded-full border-2 transition-colors"
                />
              );
            })
          : null}
      </div>
    </div>
  );
}

export function PillarCardOverlay({ pillar }: { pillar: Pillar }) {
  const size = getPillarSize(pillar);

  return (
    <div
      style={{ width: size.width, height: size.height }}
      className="flex items-center justify-center overflow-hidden rounded-xl border border-violet-300 bg-white/80 p-3 shadow-lg ring-2 ring-violet-200 backdrop-blur-sm"
    >
      <p className="max-h-full w-full overflow-auto text-center text-sm font-medium leading-snug text-zinc-800">
        {pillar.label}
      </p>
    </div>
  );
}
