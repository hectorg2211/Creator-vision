import { toJpeg } from "html-to-image";
import {
  BOARD_EXPORT_PIXEL_RATIO,
  type BoardExportCapture,
} from "@/lib/board-geometry";

const EXPORT_CLASS = "board-exporting";
const FILENAME = "creator-vision-board.jpg";
const BOARD_LAYER_SELECTOR = "[data-board-layer]";

function waitForPaint() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

type SavedStyles = {
  width: string;
  height: string;
  overflow: string;
  position: string;
  transform: string;
  transformOrigin: string;
};

function readInlineStyles(element: HTMLElement): SavedStyles {
  return {
    width: element.style.width,
    height: element.style.height,
    overflow: element.style.overflow,
    position: element.style.position,
    transform: element.style.transform,
    transformOrigin: element.style.transformOrigin,
  };
}

function restoreInlineStyles(element: HTMLElement, saved: SavedStyles) {
  element.style.width = saved.width;
  element.style.height = saved.height;
  element.style.overflow = saved.overflow;
  element.style.position = saved.position;
  element.style.transform = saved.transform;
  element.style.transformOrigin = saved.transformOrigin;
}

function inlineBoardConnectionColors(boardElement: HTMLDivElement) {
  const computed = getComputedStyle(boardElement);
  const connectionColor =
    computed.getPropertyValue("--board-connection").trim() || "#7c3aed";
  const connectionSelectedColor =
    computed.getPropertyValue("--board-connection-selected").trim() || "#5b21b6";

  const layer = boardElement.querySelector<HTMLElement>(BOARD_LAYER_SELECTOR);
  if (!layer) {
    return;
  }

  for (const line of layer.querySelectorAll<SVGLineElement>("line")) {
    const stroke = line.getAttribute("stroke");
    if (!stroke?.startsWith("var(")) {
      continue;
    }

    if (stroke.includes("--board-connection-selected")) {
      line.setAttribute("stroke", connectionSelectedColor);
    } else if (stroke.includes("--board-connection")) {
      line.setAttribute("stroke", connectionColor);
    }
  }

  for (const arrow of layer.querySelectorAll<SVGPathElement>(
    "[data-connection-arrow]",
  )) {
    const fill = arrow.getAttribute("fill");
    if (!fill?.startsWith("var(")) {
      continue;
    }

    if (fill.includes("--board-connection-selected")) {
      arrow.setAttribute("fill", connectionSelectedColor);
    } else if (fill.includes("--board-connection")) {
      arrow.setAttribute("fill", connectionColor);
    }
  }
}

function applyExportLayout(
  boardElement: HTMLDivElement,
  layer: HTMLElement,
  capture: BoardExportCapture,
) {
  const { bounds, width, height } = capture;

  boardElement.style.width = `${width}px`;
  boardElement.style.height = `${height}px`;
  boardElement.style.overflow = "hidden";
  boardElement.style.position = "relative";

  layer.style.width = `${width}px`;
  layer.style.height = `${height}px`;
  layer.style.transform = `translate(${-bounds.left}px, ${-bounds.top}px)`;
  layer.style.transformOrigin = "0 0";
}

export async function downloadBoardAsJpg(
  boardElement: HTMLDivElement,
  capture: BoardExportCapture,
): Promise<void> {
  const layer = boardElement.querySelector<HTMLElement>(BOARD_LAYER_SELECTOR);
  if (!layer) {
    throw new Error("Board export layer not found");
  }

  const savedBoard = readInlineStyles(boardElement);
  const savedLayer = readInlineStyles(layer);

  boardElement.classList.add(EXPORT_CLASS);
  applyExportLayout(boardElement, layer, capture);
  inlineBoardConnectionColors(boardElement);
  await waitForPaint();

  const { width, height } = capture;
  const pixelRatio = BOARD_EXPORT_PIXEL_RATIO;

  try {
    const backgroundColor =
      getComputedStyle(boardElement).backgroundColor || "#f4f4f5";

    const dataUrl = await toJpeg(boardElement, {
      quality: 0.92,
      backgroundColor,
      pixelRatio,
      width,
      height,
      canvasWidth: width * pixelRatio,
      canvasHeight: height * pixelRatio,
      cacheBust: true,
    });

    const link = document.createElement("a");
    link.download = FILENAME;
    link.href = dataUrl;
    link.click();
  } finally {
    restoreInlineStyles(boardElement, savedBoard);
    restoreInlineStyles(layer, savedLayer);
    boardElement.classList.remove(EXPORT_CLASS);
  }
}
