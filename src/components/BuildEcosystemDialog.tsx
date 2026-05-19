"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  ECOSYSTEM_CATEGORY_DIALOG_TITLES,
  type EcosystemCategory,
} from "@/lib/ecosystem-category";

export type EcosystemAnswers = {
  preferredIncomeMix: string;
  audienceStage: string;
  willingToSell: string;
};

type BuildEcosystemDialogProps = {
  open: boolean;
  category: EcosystemCategory | null;
  isGenerating: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (answers: EcosystemAnswers) => Promise<void>;
};

export const ECOSYSTEM_BOARD_FILL_NOTE =
  "These will generate better ideas if your board is filled completely.";

const QUESTIONS = [
  {
    id: "preferredIncomeMix" as const,
    label: "Preferred income mix (optional)",
    placeholder: "e.g. Mostly recurring, mix of products and sponsors, consulting-heavy",
  },
  {
    id: "audienceStage" as const,
    label: "Audience size / stage (optional)",
    placeholder: "e.g. Starting from zero, 2k email list, 50k on Instagram",
  },
  {
    id: "willingToSell" as const,
    label: "What you're willing to sell or offer (optional)",
    placeholder: "e.g. 1:1 calls, digital templates, brand partnerships only",
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

export function BuildEcosystemDialog({
  open,
  category,
  isGenerating,
  error,
  onClose,
  onSubmit,
}: BuildEcosystemDialogProps) {
  const dialogTitle = category
    ? ECOSYSTEM_CATEGORY_DIALOG_TITLES[category]
    : "Build your ecosystem";
  const submitLabel = category ? "Generate ideas" : "Generate ecosystem";
  const [answers, setAnswers] = useState<EcosystemAnswers>({
    preferredIncomeMix: "",
    audienceStage: "",
    willingToSell: "",
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

  const updateAnswer = (id: keyof EcosystemAnswers, value: string) => {
    setAnswers((current) => ({ ...current, [id]: value }));
  };

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
        aria-labelledby="build-ecosystem-title"
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
        <div
          role="note"
          className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm font-medium leading-snug text-amber-950"
        >
          {ECOSYSTEM_BOARD_FILL_NOTE}
        </div>

        <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-violet-600">
          Monetization · Ecosystem
        </p>
        <h2 id="build-ecosystem-title" className="mt-1 text-xl font-semibold text-zinc-900">
          {dialogTitle}
        </h2>
        <p className="mt-2 text-sm text-zinc-500">
          We&apos;ll suggest monetization ideas for this category from your board — message,
          pillars, audience, and uniqueness. Add a few notes below only if you want to steer the mix.
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
              disabled={isGenerating}
              className="flex-1 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isGenerating ? "Generating…" : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
