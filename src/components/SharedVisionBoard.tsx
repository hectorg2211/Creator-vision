"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BoardCanvas } from "@/components/BoardCanvas";
import { readOnlyBoardHandlers } from "@/lib/board-read-only-handlers";
import type { CreatorVision } from "@/lib/vision-store";

type SharedVisionBoardProps = {
  boardId: string;
};

export function SharedVisionBoard({ boardId }: SharedVisionBoardProps) {
  const [vision, setVision] = useState<CreatorVision | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/shared-boards/${boardId}`);
        const data = (await response.json()) as { vision?: CreatorVision; error?: string };

        if (!response.ok) {
          throw new Error(data.error ?? "Shared board not found.");
        }

        if (!data.vision) {
          throw new Error("Invalid shared board data.");
        }

        if (!cancelled) {
          setVision(data.vision);
        }
      } catch (loadError) {
        if (!cancelled) {
          const message =
            loadError instanceof Error ? loadError.message : "Could not load shared board.";
          setError(message);
          setVision(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [boardId]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-100 text-sm text-zinc-500">
        Loading shared board…
      </div>
    );
  }

  if (error || !vision) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-zinc-100 px-4 text-center">
        <p className="text-sm text-zinc-600">{error ?? "Shared board not found."}</p>
        <Link
          href="/"
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
        >
          Create your own board
        </Link>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-zinc-100">
      <BoardCanvas
        readOnly
        message={vision.message}
        messageBoxPosition={vision.messageBoxPosition}
        contentPillarsBoxPosition={vision.contentPillarsBoxPosition}
        demographicBoxPosition={vision.demographicBoxPosition}
        instagramCreatorsBoxPosition={vision.instagramCreatorsBoxPosition}
        psychographicBoxPosition={vision.psychographicBoxPosition}
        painBoxPosition={vision.painBoxPosition}
        passionBoxPosition={vision.passionBoxPosition}
        experienceBoxPosition={vision.experienceBoxPosition}
        skillBoxPosition={vision.skillBoxPosition}
        oneOffBoxPosition={vision.oneOffBoxPosition}
        ongoingContentBoxPosition={vision.ongoingContentBoxPosition}
        highValuePartnersBoxPosition={vision.highValuePartnersBoxPosition}
        reinvestBoxPosition={vision.reinvestBoxPosition}
        pillars={vision.pillars}
        connections={vision.connections}
        isGeneratingMessage={false}
        isGeneratingPillars={false}
        isGeneratingDemographic={false}
        isGeneratingPsychographic={false}
        isGeneratingPainPoints={false}
        isGeneratingPassionPoints={false}
        isGeneratingExperience={false}
        isGeneratingSkills={false}
        isGeneratingEcosystem={false}
        ecosystemGeneratingCategory={null}
        messageError={null}
        pillarsError={null}
        demographicError={null}
        psychographicError={null}
        painError={null}
        passionError={null}
        experienceError={null}
        skillError={null}
        ecosystemError={null}
        suggestedPillars={[]}
        {...readOnlyBoardHandlers}
      />
    </div>
  );
}
