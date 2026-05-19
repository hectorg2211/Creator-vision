"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

type WelcomeOnboardingModalProps = {
  open: boolean;
  onDismiss: () => void;
};

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

export function WelcomeOnboardingModal({ open, onDismiss }: WelcomeOnboardingModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onDismiss();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onDismiss]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div
      role="presentation"
      data-export-hide
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
      <button
        type="button"
        aria-label="Close welcome dialog"
        className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm"
        onClick={onDismiss}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-onboarding-title"
        className="relative z-10 w-full max-w-md rounded-xl border border-violet-200 bg-white/95 p-6 shadow-xl backdrop-blur-sm"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-md p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600"
        >
          <CloseIcon />
        </button>
        <p className="text-xs font-semibold uppercase tracking-wider text-violet-600">
          Creator Vision
        </p>
        <h2 id="welcome-onboarding-title" className="mt-1 text-xl font-semibold text-zinc-900">
          Start with your message
        </h2>
        <p className="mt-2 text-sm text-zinc-500">
          Use the Message box under WHAT to generate your vision, then create content
          pillars.
        </p>
        <p className="mt-3 rounded-lg border border-violet-100 bg-violet-50/60 px-3 py-2 text-sm text-violet-900">
          On the board, open the <span className="font-medium">WHAT</span> card and use the
          Message box to get started.
        </p>
        <button
          type="button"
          onClick={onDismiss}
          className="mt-5 w-full rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-violet-700"
        >
          Get started
        </button>
      </div>
    </div>,
    document.body,
  );
}
