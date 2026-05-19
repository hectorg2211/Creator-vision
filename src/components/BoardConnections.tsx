"use client";

import {
  getConnectionArrowHeadPath,
  getConnectionPoints,
  getDefaultPillarSize,
  shortenConnectionEnd,
  type PillarSize,
} from "@/lib/board-geometry";
import type { Connection, Pillar } from "@/lib/vision-store";

type ActiveDrag = {
  pillarIds: string[];
  delta: { x: number; y: number };
};

type BoardConnectionsProps = {
  pillars: Pillar[];
  connections: Connection[];
  pillarSizes: Record<string, PillarSize>;
  activeDrag?: ActiveDrag | null;
  selectedConnectionId: string | null;
  previewLine?: { x1: number; y1: number; x2: number; y2: number } | null;
  onSelectConnection: (connectionId: string | null) => void;
  onRemoveConnection: (connectionId: string) => void;
};

function getPillarSize(
  pillarSizes: Record<string, PillarSize>,
  pillarId: string,
): PillarSize {
  return pillarSizes[pillarId] ?? getDefaultPillarSize();
}

function getEffectivePillar(pillar: Pillar, activeDrag: ActiveDrag | null | undefined) {
  if (!activeDrag || !activeDrag.pillarIds.includes(pillar.id)) {
    return pillar;
  }

  return {
    ...pillar,
    x: pillar.x + activeDrag.delta.x,
    y: pillar.y + activeDrag.delta.y,
  };
}

export function BoardConnections({
  pillars,
  connections,
  pillarSizes,
  activeDrag = null,
  selectedConnectionId,
  previewLine = null,
  onSelectConnection,
  onRemoveConnection,
}: BoardConnectionsProps) {
  const pillarMap = new Map(pillars.map((pillar) => [pillar.id, pillar]));

  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
      {connections.map((connection) => {
        const fromPillar = pillarMap.get(connection.fromPillarId);
        const toPillar = pillarMap.get(connection.toPillarId);
        if (!fromPillar || !toPillar) {
          return null;
        }

        const { from, to } = getConnectionPoints(
          getEffectivePillar(fromPillar, activeDrag),
          connection.fromAnchor,
          getEffectivePillar(toPillar, activeDrag),
          connection.toAnchor,
          getPillarSize(pillarSizes, fromPillar.id),
          getPillarSize(pillarSizes, toPillar.id),
        );
        const isSelected = selectedConnectionId === connection.id;
        const lineEnd = shortenConnectionEnd(from, to);
        const arrowPath = getConnectionArrowHeadPath(from, to);
        const strokeColor = isSelected
          ? "var(--board-connection-selected)"
          : "var(--board-connection)";
        const midX = (from.x + to.x) / 2;
        const midY = (from.y + to.y) / 2;

        return (
          <g key={connection.id} className="pointer-events-auto">
            <line
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke="transparent"
              strokeWidth={16}
              className="cursor-pointer"
              onClick={(event) => {
                event.stopPropagation();
                onSelectConnection(isSelected ? null : connection.id);
              }}
            />
            <line
              x1={from.x}
              y1={from.y}
              x2={lineEnd.x}
              y2={lineEnd.y}
              stroke={strokeColor}
              strokeWidth={isSelected ? 2.5 : 2}
              className="pointer-events-none"
            />
            {arrowPath ? (
              <path
                data-connection-arrow
                d={arrowPath}
                fill={strokeColor}
                className="pointer-events-none"
              />
            ) : null}
            {isSelected && (
              <g
                data-export-hide
                className="cursor-pointer"
                onClick={(event) => {
                  event.stopPropagation();
                  onRemoveConnection(connection.id);
                  onSelectConnection(null);
                }}
              >
                <circle
                  cx={midX}
                  cy={midY}
                  r={12}
                  fill="var(--board-handle-bg)"
                  stroke="var(--board-connection-selected)"
                />
                <text
                  x={midX}
                  y={midY + 4}
                  textAnchor="middle"
                  fontSize="14"
                  fill="var(--board-connection-selected)"
                  className="select-none"
                >
                  ×
                </text>
              </g>
            )}
          </g>
        );
      })}

      {previewLine && (
        <line
          data-export-hide
          x1={previewLine.x1}
          y1={previewLine.y1}
          x2={previewLine.x2}
          y2={previewLine.y2}
          stroke="var(--board-connection-preview)"
          strokeWidth={2}
          strokeDasharray="6 4"
          className="pointer-events-none"
        />
      )}
    </svg>
  );
}
