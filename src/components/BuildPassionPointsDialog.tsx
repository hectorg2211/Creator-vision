"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export type PassionPointAnswers = {
  hoursWithoutTiring: string;
  creatingOrHelping: string;
  missionDespiteDifficulty: string;
  loveCreatingFor: string;
  valuesAndAnchors: string;
};

type BuildPassionPointsDialogProps = {
  open: boolean;
  isGenerating: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (answers: PassionPointAnswers) => Promise<void>;
};

const QUESTIONS = [
  {
    id: "hoursWithoutTiring" as const,
    label: "What could you talk about or work on for hours without getting tired?",
    placeholder:
      "e.g. Testing new tools, breaking down complex ideas, editing short videos",
  },
  {
    id: "creatingOrHelping" as const,
    label: "What kind of creating or helping energizes you most?",
    placeholder: "e.g. Building products, teaching beginners, storytelling through content",
  },
  {
    id: "missionDespiteDifficulty" as const,
    label: "What mission or cause would you show up for even when it's hard?",
    placeholder:
      "e.g. Helping people ship faster, making a field more accessible, honest education",
  },
  {
    id: "loveCreatingFor" as const,
    label: "Who do you most love creating or helping for?",
    placeholder: "e.g. Self-taught learners, small business owners, people starting from zero",
  },
  {
    id: "valuesAndAnchors" as const,
    label: "What values or parts of life ground you and show up in your work?",
    placeholder: "e.g. Family, craftsmanship, freedom, learning in public",
  },
];

function CloseIcon() {
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
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

export function BuildPassionPointsDialog({
  open,
  isGenerating,
  error,
  onClose,
  onSubmit,
}: BuildPassionPointsDialogProps) {
  const [answers, setAnswers] = useState<PassionPointAnswers>({
    hoursWithoutTiring: "",
    creatingOrHelping: "",
    missionDespiteDifficulty: "",
    loveCreatingFor: "",
    valuesAndAnchors: "",
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await onSubmit(answers);
  };

  const updateAnswer = (id: keyof PassionPointAnswers, value: string) => {
    setAnswers((current) => ({ ...current, [id]: value }));
  };

  const hasAnyAnswer = Object.values(answers).some((value) => value.trim().length > 0);

  return createPortal(
    <div
      role="presentation"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="build-passion-points-title"
        className="relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-violet-200 bg-white/95 p-6 shadow-xl backdrop-blur-sm"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-md p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600"
        >
          <CloseIcon />
        </button>
        <p className="text-xs font-semibold uppercase tracking-wider text-violet-600">
          Uniqueness · Passion
        </p>
        <h2 id="build-passion-points-title" className="mt-1 text-xl font-semibold text-zinc-900">
          Build your passion points
        </h2>
        <p className="mt-2 text-sm text-zinc-500">
          Share what energizes you and who you create for. We&apos;ll turn them into short passion
          cards for your board.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {QUESTIONS.map((question) => (
            <div key={question.id}>
              <label
                htmlFor={question.id}
                className="mb-1.5 block text-sm font-medium text-zinc-700"
              >
                {question.label}
              </label>
              <textarea
                id={question.id}
                value={answers[question.id]}
                onChange={(event) => updateAnswer(question.id, event.target.value)}
                placeholder={question.placeholder}
                rows={2}
                disabled={isGenerating}
                className="w-full resize-none rounded-lg border border-zinc-200 bg-zinc-50/80 px-3 py-2 text-sm text-zinc-900 outline-none ring-violet-500 placeholder:text-zinc-400 focus:bg-white focus:ring-2 disabled:opacity-60"
              />
            </div>
          ))}

          {error ? (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isGenerating || !hasAnyAnswer}
              className="flex-1 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isGenerating ? "Generating…" : "Generate passion points"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
