"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useCallback, useRef, useState } from "react";
import {
  AUDIENCE_ROW_CELL_MIN_WIDTH,
  AUDIENCE_ROW_GAP,
  CONTENT_PILLARS_GRID_COLUMNS,
  CONTENT_PILLARS_GRID_GAP,
  MESSAGE_BOX_WIDTH,
  type AudienceBoxLayout,
  type PillarSize,
} from "@/lib/board-geometry";
import type { Pillar } from "@/lib/vision-store";

type GridCellProps = {
  pillar: Pillar;
  cellHeight: number;
  variant: "default" | "dark";
  layout: AudienceBoxLayout;
  onUpdateLabel: (id: string, label: string) => void;
  onRemove: (id: string) => void;
  onEditStart: () => void;
  onEditEnd: () => void;
};

function AudiencePillarCell({
  pillar,
  cellHeight,
  variant,
  layout,
  onUpdateLabel,
  onRemove,
  onEditStart,
  onEditEnd,
}: GridCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftLabel, setDraftLabel] = useState(pillar.label);
  const inputRef = useRef<HTMLInputElement>(null);
  const isDark = variant === "dark";

  const commitLabel = () => {
    const trimmed = draftLabel.trim();
    if (trimmed) {
      onUpdateLabel(pillar.id, trimmed);
    } else {
      setDraftLabel(pillar.label);
    }
    setIsEditing(false);
    onEditEnd();
  };

  const startEditing = () => {
    setDraftLabel(pillar.label);
    setIsEditing(true);
    onEditStart();
    requestAnimationFrame(() => {
      const input = inputRef.current;
      if (input) {
        input.focus();
        input.select();
      }
    });
  };

  const cancelEditing = () => {
    setDraftLabel(pillar.label);
    setIsEditing(false);
    onEditEnd();
  };

  return (
    <div
      className={`group relative flex items-center justify-center rounded-lg border py-2 shadow-md ${
        isDark ? "board-cell board-cell--alt" : "board-cell shadow-sm"
      }`}
      style={{
        minHeight: cellHeight,
        ...(layout === "row"
          ? { minWidth: AUDIENCE_ROW_CELL_MIN_WIDTH, flex: "1 1 auto" }
          : {}),
      }}
      onDoubleClick={startEditing}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          autoFocus
          value={draftLabel}
          onChange={(event) => setDraftLabel(event.target.value)}
          onBlur={commitLabel}
          onFocus={(event) => event.currentTarget.select()}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              commitLabel();
            }
            if (event.key === "Escape") {
              cancelEditing();
            }
          }}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
          className={`box-border h-full min-h-0 min-w-0 w-full rounded-lg border px-2 pr-6 text-left text-sm outline-none focus:ring-2 ${
            isDark
              ? "border-zinc-500 bg-zinc-800 text-white ring-zinc-400"
              : "border-violet-300 bg-white text-zinc-900 ring-violet-500"
          }`}
        />
      ) : (
        <p
          className={`w-full break-words px-3 text-center text-sm leading-snug ${
            isDark ? "font-semibold" : "board-text"
          }`}
          title="Double-click to edit"
        >
          {pillar.label}
        </p>
      )}
      <button
        type="button"
        aria-label={`Remove ${pillar.label}`}
        onClick={(event) => {
          event.stopPropagation();
          onRemove(pillar.id);
        }}
        onPointerDown={(event) => event.stopPropagation()}
        className={`absolute right-1 top-1 z-10 rounded p-0.5 opacity-0 transition group-hover:opacity-100 ${
          isDark
            ? "text-zinc-400 hover:bg-zinc-700 hover:text-red-300"
            : "text-zinc-400 hover:bg-red-50 hover:text-red-600"
        }`}
      >
        <span className="sr-only">Remove</span>
        <svg
          aria-hidden
          viewBox="0 0 16 16"
          className="h-3.5 w-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

export type AudiencePillarsSection = {
  title: string;
  pillars: Pillar[];
};

type AudiencePillarsBoxProps = {
  boxId: string;
  title: string;
  position: { x: number; y: number };
  pillars: Pillar[];
  sections?: AudiencePillarsSection[];
  cellHeight: number;
  boxSize: PillarSize;
  layout?: AudienceBoxLayout;
  variant?: "default" | "dark";
  showTitle?: boolean;
  isDragging?: boolean;
  isSelected?: boolean;
  groupDragDelta?: { x: number; y: number } | null;
  boardScale?: number;
  disableDrag?: boolean;
  onSelect?: (id: string, additive?: boolean) => void;
  onUpdateLabel: (id: string, label: string) => void;
  onRemovePillar: (id: string) => void;
};

export function AudiencePillarsBox({
  boxId,
  title,
  position,
  pillars,
  sections,
  cellHeight,
  boxSize,
  layout = "grid",
  variant = "default",
  showTitle = true,
  isDragging = false,
  isSelected = false,
  groupDragDelta = null,
  boardScale = 1,
  disableDrag = false,
  onSelect,
  onUpdateLabel,
  onRemovePillar,
}: AudiencePillarsBoxProps) {
  const [editingPillarId, setEditingPillarId] = useState<string | null>(null);
  const isEditing = editingPillarId !== null;
  const isRow = layout === "row";
  const isInlineRow = isRow && !showTitle;
  const boxWidth = isRow ? boxSize.width : MESSAGE_BOX_WIDTH;

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: boxId,
    disabled: isEditing || disableDrag,
  });

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

  const handleRemove = useCallback(
    (id: string) => {
      onRemovePillar(id);
    },
    [onRemovePillar],
  );

  const selectionRingClass = isSelected ? "ring-2 ring-violet-200" : "";

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`pointer-events-auto absolute z-20 h-fit w-fit ${
        isDragging ? "cursor-grabbing" : isEditing ? "" : "cursor-grab"
      }`}
      style={{
        left: Math.max(8, position.x),
        top: position.y,
        transform: CSS.Translate.toString(dragTransform),
        zIndex: isDragging ? 50 : 20,
        width: boxWidth,
        minHeight: boxSize.height,
        touchAction: "none",
      }}
      onClick={(event) => {
        event.stopPropagation();
        if (!isDragging && !isEditing) {
          onSelect?.(boxId, event.shiftKey || event.metaKey || event.ctrlKey);
        }
      }}
    >
      <div
        data-audience-pillars-box={boxId}
        className={
          isInlineRow
            ? `flex gap-2 ${selectionRingClass}`
            : `board-panel flex flex-col rounded-xl border p-3 shadow-md backdrop-blur-sm ${
                isSelected ? "board-panel--selected shadow-lg" : ""
              }`
        }
        style={
          isInlineRow
            ? { width: boxWidth, minHeight: boxSize.height }
            : { width: MESSAGE_BOX_WIDTH, minHeight: boxSize.height }
        }
      >
        {showTitle ? (
          <p className="board-panel-title text-xs font-semibold uppercase tracking-wider">
            {title}
          </p>
        ) : null}
        {sections && sections.length > 0 ? (
          <div className="mt-2 flex flex-col gap-4">
            {sections.map((section) =>
              section.pillars.length === 0 ? null : (
                <section key={section.title} className="flex flex-col gap-2">
                  <p className="board-accent-text text-[11px] font-medium leading-snug">
                    {section.title}
                  </p>
                  <div
                    className="grid"
                    style={{
                      gridTemplateColumns: `repeat(${CONTENT_PILLARS_GRID_COLUMNS}, minmax(0, 1fr))`,
                      gridAutoRows: "minmax(min-content, auto)",
                      gap: CONTENT_PILLARS_GRID_GAP,
                    }}
                  >
                    {section.pillars.map((pillar) => (
                      <AudiencePillarCell
                        key={pillar.id}
                        pillar={pillar}
                        cellHeight={cellHeight}
                        variant={variant}
                        layout={layout}
                        onUpdateLabel={onUpdateLabel}
                        onRemove={handleRemove}
                        onEditStart={() => setEditingPillarId(pillar.id)}
                        onEditEnd={() =>
                          setEditingPillarId((current) =>
                            current === pillar.id ? null : current,
                          )
                        }
                      />
                    ))}
                  </div>
                </section>
              ),
            )}
          </div>
        ) : (
          <div
            className={isRow ? (showTitle ? "mt-2 flex" : "flex") : "mt-2 grid"}
            style={
              isRow
                ? { gap: AUDIENCE_ROW_GAP, width: "100%" }
                : {
                    gridTemplateColumns: `repeat(${CONTENT_PILLARS_GRID_COLUMNS}, minmax(0, 1fr))`,
                    gridAutoRows: "minmax(min-content, auto)",
                    gap: CONTENT_PILLARS_GRID_GAP,
                  }
            }
          >
            {pillars.map((pillar) => (
              <AudiencePillarCell
                key={pillar.id}
                pillar={pillar}
                cellHeight={cellHeight}
                variant={variant}
                layout={layout}
                onUpdateLabel={onUpdateLabel}
                onRemove={handleRemove}
                onEditStart={() => setEditingPillarId(pillar.id)}
                onEditEnd={() =>
                  setEditingPillarId((current) =>
                    current === pillar.id ? null : current,
                  )
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
