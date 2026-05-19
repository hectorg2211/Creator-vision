"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export type SkillAnswers = {
  strongestCapabilities: string;
  toolsAndMethods: string;
  creativeOrCommunication: string;
  problemSolvingStrength: string;
  mindsetAndEdge: string;
};

type BuildSkillsDialogProps = {
  open: boolean;
  isGenerating: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (answers: SkillAnswers) => Promise<void>;
};

const QUESTIONS = [
  {
    id: "strongestCapabilities" as const,
    label: "What are you genuinely good at today?",
    placeholder:
      "e.g. Explaining hard topics simply, visual design, sales conversations, organizing systems",
  },
  {
    id: "toolsAndMethods" as const,
    label: "What tools, methods, or workflows do you rely on?",
    placeholder: "e.g. Notion for planning, video editing apps, AI assistants, spreadsheets, pen and paper",
  },
  {
    id: "creativeOrCommunication" as const,
    label: "How do you express ideas — writing, video, design, speaking, code, other?",
    placeholder: "e.g. Short-form video, newsletters, live workshops, prototypes",
  },
  {
    id: "problemSolvingStrength" as const,
    label: "What types of problems do people usually come to you for?",
    placeholder: "e.g. Untangling messy processes, improving messaging, debugging tech issues",
  },
  {
    id: "mindsetAndEdge" as const,
    label: "How would you describe your working style or edge?",
    placeholder: "e.g. Fast executor, detail-oriented, big-picture thinker, calm under pressure",
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

export function BuildSkillsDialog({
  open,
  isGenerating,
  error,
  onClose,
  onSubmit,
}: BuildSkillsDialogProps) {
  const [answers, setAnswers] = useState<SkillAnswers>({
    strongestCapabilities: "",
    toolsAndMethods: "",
    creativeOrCommunication: "",
    problemSolvingStrength: "",
    mindsetAndEdge: "",
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

  const updateAnswer = (id: keyof SkillAnswers, value: string) => {
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
        aria-labelledby="build-skills-title"
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
          Uniqueness · Skill
        </p>
        <h2 id="build-skills-title" className="mt-1 text-xl font-semibold text-zinc-900">
          Build your skills
        </h2>
        <p className="mt-2 text-sm text-zinc-500">
          Share what you&apos;re good at and how you work. We&apos;ll turn them into short skill
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
              {isGenerating ? "Generating…" : "Generate skills"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
