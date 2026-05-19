"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

function trimAnswers(answers: MessageAnswers): MessageAnswers {
  return {
    who: answers.who.trim(),
    helpWith: answers.helpWith.trim(),
    uniqueness: answers.uniqueness.trim(),
  };
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
  const [validationError, setValidationError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    setValidationError(null);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const readAnswersFromForm = useCallback((): MessageAnswers => {
    const form = formRef.current;
    if (!form) {
      return answers;
    }

    const getValue = (id: keyof MessageAnswers) => {
      const field = form.elements.namedItem(id);
      if (field instanceof HTMLTextAreaElement) {
        return field.value;
      }
      return answers[id];
    };

    return {
      who: getValue("who"),
      helpWith: getValue("helpWith"),
      uniqueness: getValue("uniqueness"),
    };
  }, [answers]);

  const submitAnswers = useCallback(async () => {
    const trimmed = trimAnswers(readAnswersFromForm());

    if (!trimmed.who || !trimmed.helpWith || !trimmed.uniqueness) {
      setValidationError("Please answer all three questions before generating.");
      return;
    }

    setValidationError(null);

    try {
      await onSubmit(trimmed);
    } catch {
      setValidationError("Something went wrong while generating. Please try again.");
    }
  }, [onSubmit, readAnswersFromForm]);

  if (!open || !mounted) {
    return null;
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    void submitAnswers();
  };

  const updateAnswer = (id: keyof MessageAnswers, value: string) => {
    setAnswers((current) => ({ ...current, [id]: value }));
    setValidationError(null);
  };

  const displayError = validationError ?? error;

  return createPortal(
    <div
      role="presentation"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
      <div
        role="button"
        tabIndex={-1}
        aria-label="Close dialog"
        className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm"
        onClick={onClose}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onClose();
          }
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="generate-message-title"
        className="relative z-10 w-full max-w-md rounded-xl border border-violet-200 bg-white/95 p-6 shadow-xl backdrop-blur-sm"
        onPointerDown={(event) => event.stopPropagation()}
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

        <form ref={formRef} onSubmit={handleSubmit} className="mt-5 space-y-4">
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
                name={question.id}
                value={answers[question.id]}
                onChange={(event) => updateAnswer(question.id, event.target.value)}
                onInput={(event) => updateAnswer(question.id, event.currentTarget.value)}
                placeholder={question.placeholder}
                rows={2}
                disabled={isGenerating}
                autoComplete="off"
                className="w-full resize-none rounded-lg border border-zinc-200 bg-zinc-50/80 px-3 py-2 text-sm text-zinc-900 outline-none ring-violet-500 placeholder:text-zinc-400 focus:bg-white focus:ring-2 disabled:opacity-60"
              />
            </div>
          ))}

          {displayError ? (
            <p className="text-sm text-red-600" role="alert">
              {displayError}
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
              onClick={() => {
                void submitAnswers();
              }}
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
