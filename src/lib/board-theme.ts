export const BOARD_THEME_STORAGE_KEY = "creator-vision-board-theme";

export const BOARD_THEME_IDS = ["light", "dark", "warm", "cool"] as const;

export type BoardThemeId = (typeof BOARD_THEME_IDS)[number];

export const DEFAULT_BOARD_THEME: BoardThemeId = "light";

export type BoardThemeOption = {
  id: BoardThemeId;
  label: string;
  description: string;
};

export const BOARD_THEME_OPTIONS: BoardThemeOption[] = [
  {
    id: "light",
    label: "Light",
    description: "Default zinc canvas with violet accents",
  },
  {
    id: "dark",
    label: "Dark",
    description: "Deep slate canvas with soft violet highlights",
  },
  {
    id: "warm",
    label: "Warm",
    description: "Stone and amber tones for a cozy board",
  },
  {
    id: "cool",
    label: "Cool",
    description: "Cool gray canvas with sky-blue accents",
  },
];

export function isBoardThemeId(value: string): value is BoardThemeId {
  return BOARD_THEME_IDS.includes(value as BoardThemeId);
}

export function loadBoardTheme(): BoardThemeId {
  if (typeof window === "undefined") {
    return DEFAULT_BOARD_THEME;
  }

  try {
    const stored = localStorage.getItem(BOARD_THEME_STORAGE_KEY);
    if (stored && isBoardThemeId(stored)) {
      return stored;
    }
  } catch {
    // ignore storage errors
  }

  return DEFAULT_BOARD_THEME;
}

export function saveBoardTheme(theme: BoardThemeId): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(BOARD_THEME_STORAGE_KEY, theme);
}
