"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  DEFAULT_BOARD_THEME,
  loadBoardTheme,
  saveBoardTheme,
  type BoardThemeId,
} from "@/lib/board-theme";

const BOARD_THEME_CHANGE_EVENT = "creator-vision-board-theme-change";

function subscribe(onStoreChange: () => void) {
  window.addEventListener(BOARD_THEME_CHANGE_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(BOARD_THEME_CHANGE_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function getServerSnapshot(): BoardThemeId {
  return DEFAULT_BOARD_THEME;
}

export function useBoardTheme() {
  const theme = useSyncExternalStore(
    subscribe,
    loadBoardTheme,
    getServerSnapshot,
  );

  const setTheme = useCallback((nextTheme: BoardThemeId) => {
    saveBoardTheme(nextTheme);
    window.dispatchEvent(new Event(BOARD_THEME_CHANGE_EVENT));
  }, []);

  return { theme, setTheme };
}
