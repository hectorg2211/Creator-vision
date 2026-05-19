"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useCallback, useEffect, useRef, useState } from "react";
import { MESSAGE_BOX_WIDTH, type MessageBoxPosition } from "@/lib/board-geometry";
import { MESSAGE_BOX_ID } from "@/lib/vision-store";
import {
  GenerateMessageDialog,
  type MessageAnswers,
} from "@/components/GenerateMessageDialog";

type SuggestedPillarsPanelProps = {
  pillars: string[];
  onAddSelected: (labels: string[]) => void;
  onDismiss: () => void;
};

function SuggestedPillarsPanel({
  pillars,
  onAddSelected,
  onDismiss,
}: SuggestedPillarsPanelProps) {
  const [selectedSuggestions, setSelectedSuggestions] = useState(pillars);

  const toggleSuggestion = (label: string) => {
    setSelectedSuggestions((current) =>
      current.includes(label)
        ? current.filter((item) => item !== label)
        : [...current, label],
    );
  };

  const handleAddSelected = () => {
    if (selectedSuggestions.length === 0) {
      return;
    }

    onAddSelected(selectedSuggestions);
  };

  const handleAddSingle = (label: string) => {
    onAddSelected([label]);
  };

  return (
    <div className="mt-3 rounded-lg border border-violet-200 bg-white/80 p-2">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
          Suggested pillars
        </p>
        <button
          type="button"
          onClick={onDismiss}
          className="text-xs font-medium text-zinc-500 hover:text-zinc-700"
        >
          Dismiss
        </button>
      </div>
      <ul className="mt-2 space-y-1.5">
        {pillars.map((label) => {
          const isSelected = selectedSuggestions.includes(label);

          return (
            <li
              key={label}
              className="flex items-center gap-2 rounded-md border border-violet-100 bg-violet-50/60 px-2 py-1.5"
            >
              <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleSuggestion(label)}
                  className="h-3.5 w-3.5 rounded border-violet-300 text-violet-600 focus:ring-violet-500"
                />
                <span className="truncate text-sm text-zinc-800">{label}</span>
              </label>
              <button
                type="button"
                onClick={() => handleAddSingle(label)}
                className="shrink-0 rounded-md border border-violet-200 bg-white px-2 py-0.5 text-xs font-medium text-violet-700 hover:bg-violet-50"
              >
                Add
              </button>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        onClick={handleAddSelected}
        disabled={selectedSuggestions.length === 0}
        className="mt-2 w-full rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Add selected
        {selectedSuggestions.length > 0 ? ` (${selectedSuggestions.length})` : ""}
      </button>
    </div>
  );
}

type MessageBoxProps = {
  position: MessageBoxPosition;
  message: string;
  hasPillars: boolean;
  isDragging?: boolean;
  isSelected?: boolean;
  groupDragDelta?: { x: number; y: number } | null;
  boardScale?: number;
  disableDrag?: boolean;
  suggestedPillars: string[];
  isGeneratingMessage: boolean;
  isGeneratingPillars: boolean;
  messageError: string | null;
  pillarsError: string | null;
  onMessageChange: (message: string) => void;
  onGenerateMessage: (answers: MessageAnswers) => Promise<boolean>;
  onGeneratePillars: (replaceExisting: boolean) => Promise<{ needsConfirmation: boolean }>;
  onAddSelectedPillars: (labels: string[]) => void;
  onClearSuggestedPillars: () => void;
  onAddPillar: () => void;
  onSelect?: (id: string, additive?: boolean) => void;
  onLayoutHeightChange?: (height: number) => void;
};

export function MessageBox({
  position,
  message,
  hasPillars,
  suggestedPillars,
  isGeneratingMessage,
  isGeneratingPillars,
  messageError,
  pillarsError,
  isDragging = false,
  isSelected = false,
  groupDragDelta = null,
  boardScale = 1,
  disableDrag = false,
  onMessageChange,
  onGenerateMessage,
  onGeneratePillars,
  onAddSelectedPillars,
  onClearSuggestedPillars,
  onAddPillar,
  onSelect,
  onLayoutHeightChange,
}: MessageBoxProps) {
  const [wizardOpen, setWizardOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showReplaceConfirm, setShowReplaceConfirm] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: MESSAGE_BOX_ID,
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

  const setCardRef = useCallback((node: HTMLDivElement | null) => {
    cardRef.current = node;
  }, []);

  const trimmedMessage = message.trim();
  const hasMessage = trimmedMessage.length > 0;

  useEffect(() => {
    const card = cardRef.current;
    if (!card || !onLayoutHeightChange) {
      return;
    }

    const reportHeight = () => {
      onLayoutHeightChange(Math.ceil(card.getBoundingClientRect().height));
    };

    reportHeight();
    const observer = new ResizeObserver(reportHeight);
    observer.observe(card);
    return () => observer.disconnect();
  }, [
    hasMessage,
    isEditing,
    message,
    messageError,
    onLayoutHeightChange,
    pillarsError,
    showReplaceConfirm,
    suggestedPillars.length,
  ]);

  const handleWizardSubmit = async (answers: MessageAnswers) => {
    const success = await onGenerateMessage(answers);
    if (success) {
      setWizardOpen(false);
    }
  };

  const handleGeneratePillarsClick = async () => {
    if (showReplaceConfirm) {
      setShowReplaceConfirm(false);
      await onGeneratePillars(true);
      return;
    }

    const result = await onGeneratePillars(false);
    if (result.needsConfirmation) {
      setShowReplaceConfirm(true);
    }
  };

  const actionButtonClass =
    "w-full rounded-lg px-2 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <>
      <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        className={`pointer-events-auto absolute z-30 h-fit w-fit ${
          isDragging ? "cursor-grabbing" : isEditing ? "" : "cursor-grab"
        }`}
        style={{
          left: Math.max(8, position.x),
          top: position.y,
          transform: CSS.Translate.toString(dragTransform),
          zIndex: isDragging ? 50 : 30,
          touchAction: "none",
        }}
        onClick={(event) => {
          event.stopPropagation();
          if (!isDragging && !isEditing) {
            onSelect?.(
              MESSAGE_BOX_ID,
              event.shiftKey || event.metaKey || event.ctrlKey,
            );
          }
        }}
      >
        <div
          className="absolute top-0 flex w-[7.5rem] flex-col gap-2"
          style={{ right: "calc(100% + 0.75rem)" }}
          onPointerDown={(event) => event.stopPropagation()}
        >
          {!hasMessage ? (
            <button
              type="button"
              onClick={() => setWizardOpen(true)}
              disabled={isGeneratingMessage}
              className={`${actionButtonClass} bg-violet-600 text-white hover:bg-violet-700`}
            >
              {isGeneratingMessage ? "Generating…" : "Generate your message"}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setWizardOpen(true)}
                disabled={isGeneratingMessage}
                className={`${actionButtonClass} border border-violet-200 bg-white/90 text-violet-700 shadow-sm hover:bg-white`}
              >
                Regenerate message
              </button>
              <button
                type="button"
                onClick={handleGeneratePillarsClick}
                disabled={isGeneratingPillars || showReplaceConfirm}
                className={`${actionButtonClass} bg-violet-600 text-white hover:bg-violet-700`}
              >
                {isGeneratingPillars ? "Generating suggestions…" : "Generate content pillars"}
              </button>
              <button
                type="button"
                onClick={onAddPillar}
                className={`${actionButtonClass} border border-zinc-200 bg-white/90 text-zinc-700 shadow-sm hover:bg-white`}
              >
                Add pillar manually
              </button>
            </>
          )}
        </div>

        <div
          ref={setCardRef}
          data-message-box
          className={`board-panel flex flex-col rounded-xl border p-3 shadow-md backdrop-blur-sm ${
            isSelected ? "board-panel--selected shadow-lg" : ""
          }${hasMessage ? "" : " min-h-[4.5rem]"}`}
          style={{ width: MESSAGE_BOX_WIDTH }}
        >
          <p className="board-panel-title text-xs font-semibold uppercase tracking-wider">
            Message
          </p>

          {hasMessage ? (
            isEditing ? (
              <textarea
                autoFocus
                value={message}
                onChange={(event) => onMessageChange(event.target.value)}
                onBlur={() => setIsEditing(false)}
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => event.stopPropagation()}
                rows={4}
                className="mt-2 w-full resize-none rounded-lg border border-violet-200 bg-white/90 px-2 py-1.5 text-sm text-zinc-900 outline-none ring-violet-500 focus:ring-2"
              />
            ) : (
              <p
                className="board-text mt-2 cursor-text text-sm leading-snug"
                onClick={() => setIsEditing(true)}
                title="Click to edit"
              >
                {trimmedMessage}
              </p>
            )
          ) : (
            <p className="board-text-muted mt-2 text-sm">
              Your core idea — everything you create should support this.
            </p>
          )}

          {messageError ? (
            <p className="mt-2 text-xs text-red-600" role="alert">
              {messageError}
            </p>
          ) : null}

          {pillarsError ? (
            <p className="mt-2 text-xs text-red-600" role="alert">
              {pillarsError}
            </p>
          ) : null}

          {showReplaceConfirm && hasPillars ? (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/90 p-2 text-xs text-amber-900">
              <p className="font-medium">Replace existing pillars on the board?</p>
              <p className="mt-1 text-amber-800/90">
                This removes current content pillars before showing new suggestions.
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={handleGeneratePillarsClick}
                  disabled={isGeneratingPillars}
                  className="rounded-md bg-amber-600 px-2 py-1 font-medium text-white hover:bg-amber-700 disabled:opacity-60"
                >
                  Replace
                </button>
                <button
                  type="button"
                  onClick={() => setShowReplaceConfirm(false)}
                  className="rounded-md border border-amber-300 px-2 py-1 font-medium hover:bg-amber-100"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : null}

          {suggestedPillars.length > 0 ? (
            <SuggestedPillarsPanel
              key={suggestedPillars.join("\0")}
              pillars={suggestedPillars}
              onAddSelected={onAddSelectedPillars}
              onDismiss={onClearSuggestedPillars}
            />
          ) : null}
        </div>
      </div>

      <GenerateMessageDialog
        open={wizardOpen}
        isGenerating={isGeneratingMessage}
        error={messageError}
        onClose={() => setWizardOpen(false)}
        onSubmit={handleWizardSubmit}
      />
    </>
  );
}
