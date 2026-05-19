"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export type ExperienceAnswers = {
  rolesAndWork: string;
  yearsAndDepth: string;
  builtOrShipped: string;
  soloOrCollaborative: string;
  domainsAndContexts: string;
};

type BuildExperienceDialogProps = {
  open: boolean;
  isGenerating: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (answers: ExperienceAnswers) => Promise<void>;
};

const QUESTIONS = [
  {
    id: "rolesAndWork" as const,
    label: "What roles, jobs, or types of work have you done?",
    placeholder: "e.g. Retail manager, freelance designer, parent returning to work, student founder",
  },
  {
    id: "yearsAndDepth" as const,
    label: "How long have you been doing this (or related work), and how did you grow?",
    placeholder: "e.g. 3 years self-taught, 10 years in one industry then pivoted",
  },
  {
    id: "builtOrShipped" as const,
    label: "What have you built, shipped, or accomplished that you're proud of?",
    placeholder: "e.g. First paying client, side project with users, led a team through a launch",
  },
  {
    id: "soloOrCollaborative" as const,
    label: "Have you worked solo, with teams, or both — and what did that teach you?",
    placeholder: "e.g. Indie creator, agency team, cofounded a small venture",
  },
  {
    id: "domainsAndContexts" as const,
    label: "What industries, communities, or life contexts shaped your experience?",
    placeholder: "e.g. Healthcare, gaming, immigrant family business, local creative scene",
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

export function BuildExperienceDialog({
  open,
  isGenerating,
  error,
  onClose,
  onSubmit,
}: BuildExperienceDialogProps) {
  const [answers, setAnswers] = useState<ExperienceAnswers>({
    rolesAndWork: "",
    yearsAndDepth: "",
    builtOrShipped: "",
    soloOrCollaborative: "",
    domainsAndContexts: "",
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

  const updateAnswer = (id: keyof ExperienceAnswers, value: string) => {
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
        aria-labelledby="build-experience-title"
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
          Uniqueness · Experience
        </p>
        <h2 id="build-experience-title" className="mt-1 text-xl font-semibold text-zinc-900">
          Build your experience
        </h2>
        <p className="mt-2 text-sm text-zinc-500">
          Share your background and wins. We&apos;ll turn them into short experience cards for your
          board.
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
              {isGenerating ? "Generating…" : "Generate experience"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
