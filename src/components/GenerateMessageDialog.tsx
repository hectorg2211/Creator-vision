"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export type MessageAnswers = {
  who: string;
  helpWith: string;
  uniqueness: string;
};

type GenerateMessageDialogProps = {
  open: boolean;
  isGenerating: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (answers: MessageAnswers) => Promise<void>;
};

const QUESTIONS = [
  {
    id: "who" as const,
    label: "Who are you?",
    placeholder: "e.g. A mindset coach for busy professionals",
  },
  {
    id: "helpWith" as const,
    label: "What do you help people with?",
    placeholder: "e.g. Building daily habits that stick without burnout",
  },
  {
    id: "uniqueness" as const,
    label: "What makes your approach unique?",
    placeholder: "e.g. Four daily wins: mental, physical, spiritual, accountability",
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

export function GenerateMessageDialog({
  open,
  isGenerating,
  error,
  onClose,
  onSubmit,
}: GenerateMessageDialogProps) {
  const [answers, setAnswers] = useState<MessageAnswers>({
    who: "",
    helpWith: "",
    uniqueness: "",
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

  const updateAnswer = (id: keyof MessageAnswers, value: string) => {
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
        aria-labelledby="generate-message-title"
        className="relative z-10 w-full max-w-md rounded-xl border border-violet-200 bg-white/95 p-6 shadow-xl backdrop-blur-sm"
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
          Creator Vision
        </p>
        <h2 id="generate-message-title" className="mt-1 text-xl font-semibold text-zinc-900">
          Generate your message
        </h2>
        <p className="mt-2 text-sm text-zinc-500">
          Answer a few questions so we can craft your core vision message.
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
                required
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
              {isGenerating ? "Generating…" : "Generate message"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
