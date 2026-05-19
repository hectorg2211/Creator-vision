"use client";

import { useEffect, useId, useRef, useState } from "react";
import { BOARD_THEME_OPTIONS, type BoardThemeId } from "@/lib/board-theme";

type BoardThemeSelectorProps = {
  theme: BoardThemeId;
  onThemeChange: (theme: BoardThemeId) => void;
};

function PaletteIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="13.5" cy="6.5" r="2.5" />
      <circle cx="17.5" cy="10.5" r="2.5" />
      <circle cx="8.5" cy="7.5" r="2.5" />
      <circle cx="6.5" cy="12.5" r="2.5" />
      <path d="M12 22a8 8 0 0 0 8-8c0-2.5-1.2-4.7-3-6.2" />
    </svg>
  );
}

function ThemeSwatch({ themeId }: { themeId: BoardThemeId }) {
  const swatchClass =
    themeId === "light"
      ? "bg-zinc-100 ring-zinc-300"
      : themeId === "dark"
        ? "bg-zinc-800 ring-zinc-600"
        : themeId === "warm"
          ? "bg-amber-100 ring-amber-300"
          : "bg-sky-100 ring-sky-300";

  return (
    <span
      className={`h-3.5 w-3.5 shrink-0 rounded-full ring-1 ring-inset ${swatchClass}`}
      aria-hidden
    />
  );
}

export function BoardThemeSelector({ theme, onThemeChange }: BoardThemeSelectorProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  const activeLabel =
    BOARD_THEME_OPTIONS.find((option) => option.id === theme)?.label ?? "Theme";

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => setOpen((current) => !current)}
        className="flex h-9 items-center gap-2 rounded-lg border border-zinc-200/80 bg-white/80 px-2.5 text-sm font-medium text-zinc-700 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
      >
        <PaletteIcon />
        <span className="hidden sm:inline">{activeLabel}</span>
        <span className="sm:hidden">Theme</span>
      </button>
      {open ? (
        <ul
          id={listboxId}
          role="listbox"
          aria-label="Board theme"
          className="absolute right-0 top-full z-50 mt-2 min-w-[11rem] overflow-hidden rounded-lg border border-zinc-200/80 bg-white/95 p-1 shadow-lg backdrop-blur-md"
        >
          {BOARD_THEME_OPTIONS.map((option) => {
            const isActive = option.id === theme;
            return (
              <li key={option.id} role="option" aria-selected={isActive}>
                <button
                  type="button"
                  onClick={() => {
                    onThemeChange(option.id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition ${
                    isActive
                      ? "bg-violet-50 font-medium text-violet-800"
                      : "text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  <ThemeSwatch themeId={option.id} />
                  <span className="flex flex-col">
                    <span>{option.label}</span>
                    <span className="text-xs font-normal text-zinc-500">
                      {option.description}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
