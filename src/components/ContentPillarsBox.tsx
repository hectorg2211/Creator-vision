"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useCallback, useRef, useState } from "react";
import {
  CONTENT_PILLARS_GRID_COLUMNS,
  CONTENT_PILLARS_GRID_GAP,
  MESSAGE_BOX_WIDTH,
  type PillarSize,
} from "@/lib/board-geometry";
import { CONTENT_PILLARS_BOX_ID, type Pillar } from "@/lib/vision-store";

type ContentPillarsBoxProps = {
  position: { x: number; y: number };
  pillars: Pillar[];
  cellHeight: number;
  boxSize: PillarSize;
  isDragging?: boolean;
  isSelected?: boolean;
  groupDragDelta?: { x: number; y: number } | null;
  boardScale?: number;
  disableDrag?: boolean;
  onSelect?: (id: string, additive?: boolean) => void;
  onUpdateLabel: (id: string, label: string) => void;
  onRemovePillar: (id: string) => void;
};

type GridCellProps = {
  pillar: Pillar;
  cellHeight: number;
  onUpdateLabel: (id: string, label: string) => void;
  onRemove: (id: string) => void;
  onEditStart: () => void;
  onEditEnd: () => void;
};

function ContentPillarCell({
  pillar,
  cellHeight,
  onUpdateLabel,
  onRemove,
  onEditStart,
  onEditEnd,
}: GridCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftLabel, setDraftLabel] = useState(pillar.label);
  const inputRef = useRef<HTMLInputElement>(null);

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
      className="board-cell group relative flex items-center justify-center rounded-lg border py-2 shadow-sm"
      style={{ minHeight: cellHeight }}
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
          className="box-border h-full min-h-0 min-w-0 w-full rounded-lg border border-violet-300 bg-white px-2 pr-6 text-left text-sm text-zinc-900 outline-none ring-violet-500 focus:ring-2"
        />
      ) : (
        <p
          className="board-text w-full break-words px-2 text-center text-sm leading-snug"
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
        className="absolute right-1 top-1 z-10 rounded p-0.5 text-zinc-400 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
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

export function ContentPillarsBox({
  position,
  pillars,
  cellHeight,
  boxSize,
  isDragging = false,
  isSelected = false,
  groupDragDelta = null,
  boardScale = 1,
  disableDrag = false,
  onSelect,
  onUpdateLabel,
  onRemovePillar,
}: ContentPillarsBoxProps) {
  const [editingPillarId, setEditingPillarId] = useState<string | null>(null);
  const isEditing = editingPillarId !== null;

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: CONTENT_PILLARS_BOX_ID,
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
        width: MESSAGE_BOX_WIDTH,
        minHeight: boxSize.height,
        touchAction: "none",
      }}
      onClick={(event) => {
        event.stopPropagation();
        if (!isDragging && !isEditing) {
          onSelect?.(
            CONTENT_PILLARS_BOX_ID,
            event.shiftKey || event.metaKey || event.ctrlKey,
          );
        }
      }}
    >
      <div
        data-content-pillars-box
        className={`board-panel flex flex-col rounded-xl border p-3 shadow-md backdrop-blur-sm ${
          isSelected ? "board-panel--selected shadow-lg" : ""
        }`}
        style={{ width: MESSAGE_BOX_WIDTH }}
      >
        <p className="board-panel-title text-xs font-semibold uppercase tracking-wider">
          Content pillars
        </p>
        <div
          className="mt-2 grid"
          style={{
            gridTemplateColumns: `repeat(${CONTENT_PILLARS_GRID_COLUMNS}, minmax(0, 1fr))`,
            gridAutoRows: "minmax(min-content, auto)",
            gap: CONTENT_PILLARS_GRID_GAP,
          }}
        >
          {pillars.map((pillar) => (
            <ContentPillarCell
              key={pillar.id}
              pillar={pillar}
              cellHeight={cellHeight}
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
      </div>
    </div>
  );
}
