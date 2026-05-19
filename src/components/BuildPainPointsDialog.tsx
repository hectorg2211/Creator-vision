"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export type PainPointAnswers = {
  strugglesBeforeBreakthrough: string;
  notForPeopleLikeMe: string;
  failuresAndFears: string;
  stillWrestleWith: string;
  audienceSharedPain: string;
};

type BuildPainPointsDialogProps = {
  open: boolean;
  isGenerating: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (answers: PainPointAnswers) => Promise<void>;
};

const QUESTIONS = [
  {
    id: "strugglesBeforeBreakthrough" as const,
    label: "What did you struggle with before you figured this out?",
    placeholder:
      "e.g. Couldn't stay consistent, didn't know where to start, felt behind everyone else",
  },
  {
    id: "notForPeopleLikeMe" as const,
    label: "Was there a moment you felt this path wasn't for people like you?",
    placeholder: "e.g. No degree in the field, wrong age to pivot, didn't see anyone like me doing this",
  },
  {
    id: "failuresAndFears" as const,
    label: "What failed, stalled, or scared you along the way?",
    placeholder: "e.g. Launched something nobody used, quit twice, afraid of being visible online",
  },
  {
    id: "stillWrestleWith" as const,
    label: "What do you still wrestle with sometimes?",
    placeholder: "e.g. Imposter feelings, comparing to others, overthinking before shipping",
  },
  {
    id: "audienceSharedPain" as const,
    label: "Who feels this same pain today — and what do you wish someone had told them?",
    placeholder:
      "e.g. Beginners who think they're too late; creators who have ideas but never publish",
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

export function BuildPainPointsDialog({
  open,
  isGenerating,
  error,
  onClose,
  onSubmit,
}: BuildPainPointsDialogProps) {
  const [answers, setAnswers] = useState<PainPointAnswers>({
    strugglesBeforeBreakthrough: "",
    notForPeopleLikeMe: "",
    failuresAndFears: "",
    stillWrestleWith: "",
    audienceSharedPain: "",
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

  const updateAnswer = (id: keyof PainPointAnswers, value: string) => {
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
        aria-labelledby="build-pain-points-title"
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
          Uniqueness · Pain
        </p>
        <h2 id="build-pain-points-title" className="mt-1 text-xl font-semibold text-zinc-900">
          Build your pain points
        </h2>
        <p className="mt-2 text-sm text-zinc-500">
          Share struggles that shaped you and connect to who you help. We&apos;ll turn them into
          short pain point cards for your board.
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
              {isGenerating ? "Generating…" : "Generate pain points"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
