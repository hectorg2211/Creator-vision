"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

type DisabledBuildTooltipProps = {
  showTooltip: boolean;
  message: string;
  children: ReactNode;
};

const TOOLTIP_CLASS =
  "pointer-events-none fixed z-[9999] w-48 -translate-x-1/2 rounded-md bg-zinc-900 px-2.5 py-2 text-[10px] leading-snug text-white shadow-lg";

export function DisabledBuildTooltip({
  showTooltip,
  message,
  children,
}: DisabledBuildTooltipProps) {
  const triggerRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const updateCoords = useCallback(() => {
    const node = triggerRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    setCoords({
      top: rect.bottom + 4,
      left: rect.left + rect.width / 2,
    });
  }, []);

  const show = showTooltip && hovered;

  useEffect(() => {
    if (!show) return;
    updateCoords();
    window.addEventListener("scroll", updateCoords, true);
    window.addEventListener("resize", updateCoords);
    return () => {
      window.removeEventListener("scroll", updateCoords, true);
      window.removeEventListener("resize", updateCoords);
    };
  }, [show, updateCoords]);

  return (
    <div
      ref={triggerRef}
      className="relative w-full"
      onPointerEnter={() => {
        if (!showTooltip) return;
        updateCoords();
        setHovered(true);
      }}
      onPointerLeave={() => setHovered(false)}
      onFocusCapture={(event) => {
        if (!showTooltip) return;
        if (triggerRef.current?.contains(event.target as Node)) {
          updateCoords();
          setHovered(true);
        }
      }}
      onBlurCapture={(event) => {
        if (!triggerRef.current?.contains(event.relatedTarget as Node)) {
          setHovered(false);
        }
      }}
    >
      {children}
      {show &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="tooltip"
            className={TOOLTIP_CLASS}
            style={{ top: coords.top, left: coords.left }}
          >
            {message}
          </div>,
          document.body,
        )}
    </div>
  );
}
