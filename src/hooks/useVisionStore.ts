"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  addPillar as addPillarToVision,
  addPillarsFromLabels,
  loadVision,
  removeConnection as removeConnectionFromVision,
  removePillar as removePillarFromVision,
  removePillars as removePillarsFromVision,
  movePillars as movePillarsInVision,
  moveMessageBox as moveMessageBoxInVision,
  moveContentPillarsBox as moveContentPillarsBoxInVision,
  moveDemographicBox as moveDemographicBoxInVision,
  moveInstagramCreatorsBox as moveInstagramCreatorsBoxInVision,
  movePsychographicTraitsBox as movePsychographicTraitsBoxInVision,
  movePainBox as movePainBoxInVision,
  movePassionBox as movePassionBoxInVision,
  moveExperienceBox as moveExperienceBoxInVision,
  moveSkillBox as moveSkillBoxInVision,
  moveOneOffBox as moveOneOffBoxInVision,
  moveOngoingContentBox as moveOngoingContentBoxInVision,
  moveHighValuePartnersBox as moveHighValuePartnersBoxInVision,
  moveReinvestBox as moveReinvestBoxInVision,
  saveVision,
  setMessage as setVisionMessage,
  addConnection as addConnectionToVision,
  getContentPillars,
  getDemographicPillars,
  getPsychographicCreatorPillars,
  getPsychographicTraitPillars,
  getPainPillars,
  getPassionPillars,
  getExperiencePillars,
  getSkillPillars,
  getOneOffPillars,
  getOngoingContentPillars,
  getHighValuePartnersPillars,
  getReinvestPillars,
  setAudiencePillarsFromLabels,
  setPsychographicTraitsFromSuggestions,
  setPainPillarsFromLabels,
  setPassionPillarsFromLabels,
  setExperiencePillarsFromLabels,
  setSkillPillarsFromLabels,
  setEcosystemFromGeneration,
  addPainPillar as addPainPillarToVision,
  addPassionPillar as addPassionPillarToVision,
  addExperiencePillar as addExperiencePillarToVision,
  addSkillPillar as addSkillPillarToVision,
  addOneOffPillar as addOneOffPillarToVision,
  addOngoingContentPillar as addOngoingContentPillarToVision,
  addHighValuePartnersPillar as addHighValuePartnersPillarToVision,
  addReinvestPillar as addReinvestPillarToVision,
  addPsychographicCreatorPillar as addPsychographicCreatorPillarToVision,
  addPsychographicTraitPillar as addPsychographicTraitPillarToVision,
  FRAMEWORK_CARDS,
  updatePillarLabel as updatePillarLabelInVision,
  updatePillarPosition as updatePillarPositionInVision,
  updatePillarSize as updatePillarSizeInVision,
  type ConnectionAnchor,
  type CreatorVision,
} from "@/lib/vision-store";
import {
  createVisionHistoryStacks,
  pushVisionHistory,
  redoVision,
  undoVision,
  visionsEqual,
  type VisionHistoryStacks,
} from "@/lib/vision-history";
import type { PainPointAnswers } from "@/components/BuildPainPointsDialog";
import type { PassionPointAnswers } from "@/components/BuildPassionPointsDialog";
import type { ExperienceAnswers } from "@/components/BuildExperienceDialog";
import type { SkillAnswers } from "@/components/BuildSkillsDialog";
import type { EcosystemAnswers } from "@/components/BuildEcosystemDialog";
import {
  CONTENT_PILLARS_REQUIRED_TOOLTIP,
  type EcosystemCategory,
} from "@/lib/ecosystem-category";

const DEBOUNCE_MS = 300;
const MESSAGE_HISTORY_BATCH_MS = 500;

type PersistOptions = {
  skipHistory?: boolean;
};

export function useVisionStore() {
  const [vision, setVision] = useState<CreatorVision>(() => loadVision());
  const [isGeneratingMessage, setIsGeneratingMessage] = useState(false);
  const [isGeneratingPillars, setIsGeneratingPillars] = useState(false);
  const [isGeneratingDemographic, setIsGeneratingDemographic] = useState(false);
  const [isGeneratingPsychographic, setIsGeneratingPsychographic] = useState(false);
  const [messageGenerateError, setMessageGenerateError] = useState<string | null>(
    null,
  );
  const [pillarsGenerateError, setPillarsGenerateError] = useState<string | null>(
    null,
  );
  const [demographicGenerateError, setDemographicGenerateError] = useState<string | null>(
    null,
  );
  const [psychographicGenerateError, setPsychographicGenerateError] = useState<
    string | null
  >(null);
  const [isGeneratingPainPoints, setIsGeneratingPainPoints] = useState(false);
  const [painGenerateError, setPainGenerateError] = useState<string | null>(null);
  const [isGeneratingPassionPoints, setIsGeneratingPassionPoints] = useState(false);
  const [passionGenerateError, setPassionGenerateError] = useState<string | null>(null);
  const [isGeneratingExperience, setIsGeneratingExperience] = useState(false);
  const [experienceGenerateError, setExperienceGenerateError] = useState<string | null>(null);
  const [isGeneratingSkills, setIsGeneratingSkills] = useState(false);
  const [skillGenerateError, setSkillGenerateError] = useState<string | null>(null);
  const [isGeneratingEcosystem, setIsGeneratingEcosystem] = useState(false);
  const [ecosystemGeneratingCategory, setEcosystemGeneratingCategory] =
    useState<EcosystemCategory | null>(null);
  const [ecosystemGenerateError, setEcosystemGenerateError] = useState<string | null>(null);
  const [suggestedPillars, setSuggestedPillars] = useState<string[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const visionRef = useRef(vision);
  const historyRef = useRef<VisionHistoryStacks>(createVisionHistoryStacks());
  const skipHistoryRef = useRef(false);
  const messageHistoryBatchRef = useRef(false);
  const messageHistoryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const syncHistoryFlags = useCallback(() => {
    setCanUndo(historyRef.current.past.length > 0);
    setCanRedo(historyRef.current.future.length > 0);
  }, []);

  const recordHistory = useCallback(
    (snapshot: CreatorVision) => {
      historyRef.current = pushVisionHistory(historyRef.current, snapshot);
      syncHistoryFlags();
    },
    [syncHistoryFlags],
  );

  useEffect(() => {
    visionRef.current = vision;
  }, [vision]);

  const applyVision = useCallback((nextVision: CreatorVision, saveImmediately = false) => {
    visionRef.current = nextVision;
    setVision(nextVision);

    if (saveImmediately) {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      saveVision(nextVision);
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      saveVision(nextVision);
    }, DEBOUNCE_MS);
  }, []);

  const persistVision = useCallback(
    (updater: (current: CreatorVision) => CreatorVision, options?: PersistOptions) => {
      const current = visionRef.current;
      const nextVision = updater(current);

      if (visionsEqual(current, nextVision)) {
        return;
      }

      if (!options?.skipHistory && !skipHistoryRef.current) {
        recordHistory(current);
      }

      applyVision(nextVision);
    },
    [applyVision, recordHistory],
  );

  const beginResizeHistory = useCallback(() => {
    recordHistory(visionRef.current);
    skipHistoryRef.current = true;
  }, [recordHistory]);

  const endResizeHistory = useCallback(() => {
    skipHistoryRef.current = false;
  }, []);

  const undo = useCallback(() => {
    const result = undoVision(historyRef.current, visionRef.current);
    if (!result) {
      return;
    }

    historyRef.current = result.stacks;
    skipHistoryRef.current = true;
    applyVision(result.vision, true);
    skipHistoryRef.current = false;
    syncHistoryFlags();
  }, [applyVision, syncHistoryFlags]);

  const redo = useCallback(() => {
    const result = redoVision(historyRef.current, visionRef.current);
    if (!result) {
      return;
    }

    historyRef.current = result.stacks;
    skipHistoryRef.current = true;
    applyVision(result.vision, true);
    skipHistoryRef.current = false;
    syncHistoryFlags();
  }, [applyVision, syncHistoryFlags]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMod = event.metaKey || event.ctrlKey;
      if (!isMod) {
        return;
      }

      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return;
      }

      const key = event.key.toLowerCase();

      if (key === "z") {
        event.preventDefault();
        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }
        return;
      }

      if (key === "y") {
        event.preventDefault();
        redo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [redo, undo]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (messageHistoryTimerRef.current) {
        clearTimeout(messageHistoryTimerRef.current);
      }
    };
  }, []);

  const setMessage = useCallback(
    (message: string) => {
      if (!messageHistoryBatchRef.current) {
        recordHistory(visionRef.current);
        messageHistoryBatchRef.current = true;
      }

      persistVision((current) => setVisionMessage(current, message), {
        skipHistory: true,
      });

      if (messageHistoryTimerRef.current) {
        clearTimeout(messageHistoryTimerRef.current);
      }

      messageHistoryTimerRef.current = setTimeout(() => {
        messageHistoryBatchRef.current = false;
        messageHistoryTimerRef.current = null;
      }, MESSAGE_HISTORY_BATCH_MS);
    },
    [persistVision, recordHistory],
  );

  const updatePillarPosition = useCallback(
    (id: string, x: number, y: number) => {
      persistVision((current) => updatePillarPositionInVision(current, id, x, y));
    },
    [persistVision],
  );

  const updatePillarSize = useCallback(
    (id: string, width: number, height: number) => {
      persistVision((current) => updatePillarSizeInVision(current, id, width, height), {
        skipHistory: skipHistoryRef.current,
      });
    },
    [persistVision],
  );

  const updatePillarLabel = useCallback(
    (id: string, label: string) => {
      persistVision((current) => updatePillarLabelInVision(current, id, label));
    },
    [persistVision],
  );

  const addPillar = useCallback(
    (label?: string) => {
      persistVision((current) => addPillarToVision(current, label));
    },
    [persistVision],
  );

  const addAudiencePillar = useCallback(
    (container: "demographic" | "psychographic", label = "New trait") => {
      persistVision((current) => addPillarsFromLabels(current, [label], container));
    },
    [persistVision],
  );

  const addDemographicPillar = useCallback(
    () => addAudiencePillar("demographic"),
    [addAudiencePillar],
  );

  const addInstagramCreatorPillar = useCallback(() => {
    persistVision((current) => addPsychographicCreatorPillarToVision(current));
  }, [persistVision]);

  const addPsychographicTraitPillar = useCallback(() => {
    persistVision((current) => addPsychographicTraitPillarToVision(current));
  }, [persistVision]);

  const addPainPillar = useCallback(() => {
    persistVision((current) => addPainPillarToVision(current));
  }, [persistVision]);

  const addPassionPillar = useCallback(() => {
    persistVision((current) => addPassionPillarToVision(current));
  }, [persistVision]);

  const addExperiencePillar = useCallback(() => {
    persistVision((current) => addExperiencePillarToVision(current));
  }, [persistVision]);

  const addSkillPillar = useCallback(() => {
    persistVision((current) => addSkillPillarToVision(current));
  }, [persistVision]);

  const addOneOffPillar = useCallback(() => {
    persistVision((current) => addOneOffPillarToVision(current));
  }, [persistVision]);

  const addOngoingContentPillar = useCallback(() => {
    persistVision((current) => addOngoingContentPillarToVision(current));
  }, [persistVision]);

  const addHighValuePartnersPillar = useCallback(() => {
    persistVision((current) => addHighValuePartnersPillarToVision(current));
  }, [persistVision]);

  const addReinvestPillar = useCallback(() => {
    persistVision((current) => addReinvestPillarToVision(current));
  }, [persistVision]);

  const removePillar = useCallback(
    (id: string) => {
      persistVision((current) => removePillarFromVision(current, id));
    },
    [persistVision],
  );

  const removePillars = useCallback(
    (ids: string[]) => {
      persistVision((current) => removePillarsFromVision(current, ids));
    },
    [persistVision],
  );

  const movePillars = useCallback(
    (ids: string[], delta: { x: number; y: number }) => {
      persistVision((current) => movePillarsInVision(current, ids, delta));
    },
    [persistVision],
  );

  const moveMessageBox = useCallback(
    (delta: { x: number; y: number }) => {
      persistVision((current) => moveMessageBoxInVision(current, delta));
    },
    [persistVision],
  );

  const moveContentPillarsBox = useCallback(
    (delta: { x: number; y: number }) => {
      persistVision((current) => moveContentPillarsBoxInVision(current, delta));
    },
    [persistVision],
  );

  const moveDemographicBox = useCallback(
    (delta: { x: number; y: number }) => {
      persistVision((current) => moveDemographicBoxInVision(current, delta));
    },
    [persistVision],
  );

  const moveInstagramCreatorsBox = useCallback(
    (delta: { x: number; y: number }) => {
      persistVision((current) => moveInstagramCreatorsBoxInVision(current, delta));
    },
    [persistVision],
  );

  const movePsychographicTraitsBox = useCallback(
    (delta: { x: number; y: number }) => {
      persistVision((current) => movePsychographicTraitsBoxInVision(current, delta));
    },
    [persistVision],
  );

  const movePainBox = useCallback(
    (delta: { x: number; y: number }) => {
      persistVision((current) => movePainBoxInVision(current, delta));
    },
    [persistVision],
  );

  const movePassionBox = useCallback(
    (delta: { x: number; y: number }) => {
      persistVision((current) => movePassionBoxInVision(current, delta));
    },
    [persistVision],
  );

  const moveExperienceBox = useCallback(
    (delta: { x: number; y: number }) => {
      persistVision((current) => moveExperienceBoxInVision(current, delta));
    },
    [persistVision],
  );

  const moveSkillBox = useCallback(
    (delta: { x: number; y: number }) => {
      persistVision((current) => moveSkillBoxInVision(current, delta));
    },
    [persistVision],
  );

  const moveOneOffBox = useCallback(
    (delta: { x: number; y: number }) => {
      persistVision((current) => moveOneOffBoxInVision(current, delta));
    },
    [persistVision],
  );

  const moveOngoingContentBox = useCallback(
    (delta: { x: number; y: number }) => {
      persistVision((current) => moveOngoingContentBoxInVision(current, delta));
    },
    [persistVision],
  );

  const moveHighValuePartnersBox = useCallback(
    (delta: { x: number; y: number }) => {
      persistVision((current) => moveHighValuePartnersBoxInVision(current, delta));
    },
    [persistVision],
  );

  const moveReinvestBox = useCallback(
    (delta: { x: number; y: number }) => {
      persistVision((current) => moveReinvestBoxInVision(current, delta));
    },
    [persistVision],
  );

  const addConnection = useCallback(
    (
      fromPillarId: string,
      fromAnchor: ConnectionAnchor,
      toPillarId: string,
      toAnchor: ConnectionAnchor,
    ) => {
      persistVision((current) =>
        addConnectionToVision(
          current,
          fromPillarId,
          fromAnchor,
          toPillarId,
          toAnchor,
        ),
      );
    },
    [persistVision],
  );

  const removeConnection = useCallback(
    (connectionId: string) => {
      persistVision((current) => removeConnectionFromVision(current, connectionId));
    },
    [persistVision],
  );

  const generateMessage = useCallback(
    async (answers: { who: string; helpWith: string; uniqueness: string }) => {
      const who = answers.who.trim();
      const helpWith = answers.helpWith.trim();
      const uniqueness = answers.uniqueness.trim();

      if (!who || !helpWith || !uniqueness) {
        setMessageGenerateError("Please answer all questions.");
        return false;
      }

      setIsGeneratingMessage(true);
      setMessageGenerateError(null);

      try {
        const response = await fetch("/api/generate-message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ who, helpWith, uniqueness }),
        });

        const data = (await response.json()) as {
          message?: string;
          error?: string;
        };

        if (!response.ok) {
          throw new Error(data.error ?? "Failed to generate message.");
        }

        const generated = data.message?.trim();
        if (!generated) {
          throw new Error("No message returned from AI.");
        }

        recordHistory(visionRef.current);
        persistVision((current) => setVisionMessage(current, generated), {
          skipHistory: true,
        });
        return true;
      } catch (error) {
        const messageText =
          error instanceof Error ? error.message : "Failed to generate message.";
        setMessageGenerateError(messageText);
        return false;
      } finally {
        setIsGeneratingMessage(false);
      }
    },
    [persistVision, recordHistory],
  );

  const generatePillars = useCallback(
    async (replaceExisting: boolean) => {
      const currentVision = visionRef.current;
      const trimmedMessage = currentVision.message.trim();

      if (!trimmedMessage) {
        setPillarsGenerateError("Generate a message before creating pillars.");
        return { needsConfirmation: false as const };
      }

      if (getContentPillars(currentVision.pillars).length > 0 && !replaceExisting) {
        return { needsConfirmation: true as const };
      }

      setIsGeneratingPillars(true);
      setPillarsGenerateError(null);

      try {
        if (replaceExisting) {
          const contentIds = getContentPillars(currentVision.pillars).map(
            (pillar) => pillar.id,
          );
          if (contentIds.length > 0) {
            recordHistory(currentVision);
            persistVision((current) => removePillarsFromVision(current, contentIds), {
              skipHistory: true,
            });
          }
        }

        const response = await fetch("/api/generate-pillars", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: trimmedMessage }),
        });

        const data = (await response.json()) as {
          pillars?: string[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(data.error ?? "Failed to generate pillars.");
        }

        const labels = (data.pillars ?? []).filter((label) => label.trim().length > 0);
        setSuggestedPillars(labels);
        return { needsConfirmation: false as const };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to generate pillars.";
        setPillarsGenerateError(message);
        return { needsConfirmation: false as const };
      } finally {
        setIsGeneratingPillars(false);
      }
    },
    [persistVision, recordHistory],
  );

  const addSelectedPillars = useCallback(
    (labels: string[]) => {
      const trimmedLabels = labels
        .map((label) => label.trim())
        .filter((label) => label.length > 0);

      if (trimmedLabels.length === 0) {
        return;
      }

      persistVision((current) => addPillarsFromLabels(current, trimmedLabels));
      setSuggestedPillars((current) =>
        current.filter((label) => !trimmedLabels.includes(label)),
      );
    },
    [persistVision],
  );

  const clearSuggestedPillars = useCallback(() => {
    setSuggestedPillars([]);
  }, []);

  const buildAudienceContext = useCallback((vision: CreatorVision) => {
    const frameworkLabels: Record<string, string> = {};

    for (const card of FRAMEWORK_CARDS) {
      const pillar = vision.pillars.find((item) => item.id === card.id);
      if (pillar) {
        frameworkLabels[card.label] = pillar.label;
      }
    }

    return {
      message: vision.message.trim(),
      contentPillars: getContentPillars(vision.pillars).map((pillar) => pillar.label),
      frameworkLabels,
    };
  }, []);

  const generateAudience = useCallback(
    async (type: "demographic" | "psychographic") => {
      const currentVision = visionRef.current;
      const { message, contentPillars, frameworkLabels } =
        buildAudienceContext(currentVision);

      if (!message) {
        const errorText = "Generate a message before creating audience suggestions.";
        if (type === "demographic") {
          setDemographicGenerateError(errorText);
        } else {
          setPsychographicGenerateError(errorText);
        }
        return;
      }

      if (contentPillars.length === 0) {
        if (type === "demographic") {
          setDemographicGenerateError(CONTENT_PILLARS_REQUIRED_TOOLTIP);
        } else {
          setPsychographicGenerateError(CONTENT_PILLARS_REQUIRED_TOOLTIP);
        }
        return;
      }

      const setGenerating =
        type === "demographic" ? setIsGeneratingDemographic : setIsGeneratingPsychographic;
      const setError =
        type === "demographic"
          ? setDemographicGenerateError
          : setPsychographicGenerateError;

      setGenerating(true);
      setError(null);

      try {
        const requestBody =
          type === "demographic"
            ? {
                type,
                message,
                contentPillars,
                frameworkLabels,
                existingSuggestions: (() => {
                  const existing = getDemographicPillars(currentVision.pillars).map(
                    (pillar) => pillar.label,
                  );
                  return existing.length > 0 ? existing : undefined;
                })(),
              }
            : {
                type,
                message,
                contentPillars,
                frameworkLabels,
                existingTraits: (() => {
                  const existing = getPsychographicTraitPillars(
                    currentVision.pillars,
                  ).map((pillar) => pillar.label);
                  return existing.length > 0 ? existing : undefined;
                })(),
              };

        const response = await fetch("/api/generate-audience-suggestions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });

        const data = (await response.json()) as {
          suggestions?: string[];
          creators?: string[];
          traits?: string[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(data.error ?? "Failed to generate audience suggestions.");
        }

        recordHistory(currentVision);

        if (type === "demographic") {
          const labels = (data.suggestions ?? []).filter((label) => label.trim().length > 0);
          if (labels.length === 0) {
            throw new Error("No suggestions returned from AI.");
          }

          persistVision(
            (current) => setAudiencePillarsFromLabels(current, labels, type),
            { skipHistory: true },
          );
        } else {
          const traits = (data.traits ?? data.suggestions ?? []).filter(
            (label) => label.trim().length > 0,
          );

          if (traits.length === 0) {
            throw new Error("No suggestions returned from AI.");
          }

          persistVision(
            (current) => setPsychographicTraitsFromSuggestions(current, traits),
            { skipHistory: true },
          );
        }
      } catch (error) {
        const messageText =
          error instanceof Error ? error.message : "Failed to generate audience suggestions.";
        setError(messageText);
      } finally {
        setGenerating(false);
      }
    },
    [buildAudienceContext, persistVision, recordHistory],
  );

  const generateDemographic = useCallback(
    () => generateAudience("demographic"),
    [generateAudience],
  );

  const generatePsychographic = useCallback(
    () => generateAudience("psychographic"),
    [generateAudience],
  );

  const generatePainPoints = useCallback(
    async (answers: PainPointAnswers) => {
      const currentVision = visionRef.current;
      const { message, contentPillars, frameworkLabels } =
        buildAudienceContext(currentVision);

      const hasAnyAnswer = Object.values(answers).some((value) => value.trim().length > 0);
      if (!hasAnyAnswer) {
        setPainGenerateError("Please answer at least one question.");
        return false;
      }

      if (!message) {
        setPainGenerateError("Generate a message before building pain points.");
        return false;
      }

      if (contentPillars.length === 0) {
        setPainGenerateError(CONTENT_PILLARS_REQUIRED_TOOLTIP);
        return false;
      }

      setIsGeneratingPainPoints(true);
      setPainGenerateError(null);

      try {
        const existingPainPoints = getPainPillars(currentVision.pillars).map(
          (pillar) => pillar.label,
        );

        const response = await fetch("/api/generate-pain-points", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...answers,
            message,
            contentPillars,
            frameworkLabels,
            existingPainPoints:
              existingPainPoints.length > 0 ? existingPainPoints : undefined,
          }),
        });

        const data = (await response.json()) as {
          painPoints?: string[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(data.error ?? "Failed to generate pain points.");
        }

        const labels = (data.painPoints ?? []).filter((label) => label.trim().length > 0);
        if (labels.length === 0) {
          throw new Error("No pain points returned from AI.");
        }

        recordHistory(currentVision);
        persistVision((current) => setPainPillarsFromLabels(current, labels), {
          skipHistory: true,
        });
        return true;
      } catch (error) {
        const messageText =
          error instanceof Error ? error.message : "Failed to generate pain points.";
        setPainGenerateError(messageText);
        return false;
      } finally {
        setIsGeneratingPainPoints(false);
      }
    },
    [buildAudienceContext, persistVision, recordHistory],
  );

  const generatePassionPoints = useCallback(
    async (answers: PassionPointAnswers) => {
      const currentVision = visionRef.current;
      const { message, contentPillars, frameworkLabels } =
        buildAudienceContext(currentVision);

      const hasAnyAnswer = Object.values(answers).some((value) => value.trim().length > 0);
      if (!hasAnyAnswer) {
        setPassionGenerateError("Please answer at least one question.");
        return false;
      }

      if (!message) {
        setPassionGenerateError("Generate a message before building passion points.");
        return false;
      }

      if (contentPillars.length === 0) {
        setPassionGenerateError(CONTENT_PILLARS_REQUIRED_TOOLTIP);
        return false;
      }

      setIsGeneratingPassionPoints(true);
      setPassionGenerateError(null);

      try {
        const existingPassionPoints = getPassionPillars(currentVision.pillars).map(
          (pillar) => pillar.label,
        );

        const response = await fetch("/api/generate-passion-points", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...answers,
            message,
            contentPillars,
            frameworkLabels,
            existingPassionPoints:
              existingPassionPoints.length > 0 ? existingPassionPoints : undefined,
          }),
        });

        const data = (await response.json()) as {
          passionPoints?: string[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(data.error ?? "Failed to generate passion points.");
        }

        const labels = (data.passionPoints ?? []).filter((label) => label.trim().length > 0);
        if (labels.length === 0) {
          throw new Error("No passion points returned from AI.");
        }

        recordHistory(currentVision);
        persistVision((current) => setPassionPillarsFromLabels(current, labels), {
          skipHistory: true,
        });
        return true;
      } catch (error) {
        const messageText =
          error instanceof Error ? error.message : "Failed to generate passion points.";
        setPassionGenerateError(messageText);
        return false;
      } finally {
        setIsGeneratingPassionPoints(false);
      }
    },
    [buildAudienceContext, persistVision, recordHistory],
  );

  const generateExperience = useCallback(
    async (answers: ExperienceAnswers) => {
      const currentVision = visionRef.current;
      const { message, contentPillars, frameworkLabels } =
        buildAudienceContext(currentVision);

      const hasAnyAnswer = Object.values(answers).some((value) => value.trim().length > 0);
      if (!hasAnyAnswer) {
        setExperienceGenerateError("Please answer at least one question.");
        return false;
      }

      if (!message) {
        setExperienceGenerateError("Generate a message before building experience.");
        return false;
      }

      if (contentPillars.length === 0) {
        setExperienceGenerateError(CONTENT_PILLARS_REQUIRED_TOOLTIP);
        return false;
      }

      setIsGeneratingExperience(true);
      setExperienceGenerateError(null);

      try {
        const existingExperience = getExperiencePillars(currentVision.pillars).map(
          (pillar) => pillar.label,
        );

        const response = await fetch("/api/generate-experience", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...answers,
            message,
            contentPillars,
            frameworkLabels,
            existingExperience:
              existingExperience.length > 0 ? existingExperience : undefined,
          }),
        });

        const data = (await response.json()) as {
          experienceItems?: string[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(data.error ?? "Failed to generate experience.");
        }

        const labels = (data.experienceItems ?? []).filter((label) => label.trim().length > 0);
        if (labels.length === 0) {
          throw new Error("No experience items returned from AI.");
        }

        recordHistory(currentVision);
        persistVision((current) => setExperiencePillarsFromLabels(current, labels), {
          skipHistory: true,
        });
        return true;
      } catch (error) {
        const messageText =
          error instanceof Error ? error.message : "Failed to generate experience.";
        setExperienceGenerateError(messageText);
        return false;
      } finally {
        setIsGeneratingExperience(false);
      }
    },
    [buildAudienceContext, persistVision, recordHistory],
  );

  const generateSkills = useCallback(
    async (answers: SkillAnswers) => {
      const currentVision = visionRef.current;
      const { message, contentPillars, frameworkLabels } =
        buildAudienceContext(currentVision);

      const hasAnyAnswer = Object.values(answers).some((value) => value.trim().length > 0);
      if (!hasAnyAnswer) {
        setSkillGenerateError("Please answer at least one question.");
        return false;
      }

      if (!message) {
        setSkillGenerateError("Generate a message before building skills.");
        return false;
      }

      if (contentPillars.length === 0) {
        setSkillGenerateError(CONTENT_PILLARS_REQUIRED_TOOLTIP);
        return false;
      }

      setIsGeneratingSkills(true);
      setSkillGenerateError(null);

      try {
        const existingSkills = getSkillPillars(currentVision.pillars).map(
          (pillar) => pillar.label,
        );

        const response = await fetch("/api/generate-skills", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...answers,
            message,
            contentPillars,
            frameworkLabels,
            existingSkills: existingSkills.length > 0 ? existingSkills : undefined,
          }),
        });

        const data = (await response.json()) as {
          skills?: string[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(data.error ?? "Failed to generate skills.");
        }

        const labels = (data.skills ?? []).filter((label) => label.trim().length > 0);
        if (labels.length === 0) {
          throw new Error("No skills returned from AI.");
        }

        recordHistory(currentVision);
        persistVision((current) => setSkillPillarsFromLabels(current, labels), {
          skipHistory: true,
        });
        return true;
      } catch (error) {
        const messageText =
          error instanceof Error ? error.message : "Failed to generate skills.";
        setSkillGenerateError(messageText);
        return false;
      } finally {
        setIsGeneratingSkills(false);
      }
    },
    [buildAudienceContext, persistVision, recordHistory],
  );

  const buildEcosystemContext = useCallback(
    (currentVision: CreatorVision) => {
      const { message, contentPillars, frameworkLabels } =
        buildAudienceContext(currentVision);

      return {
        message,
        contentPillars,
        frameworkLabels,
        painPoints: getPainPillars(currentVision.pillars).map((pillar) => pillar.label),
        passionPoints: getPassionPillars(currentVision.pillars).map((pillar) => pillar.label),
        experienceItems: getExperiencePillars(currentVision.pillars).map(
          (pillar) => pillar.label,
        ),
        skills: getSkillPillars(currentVision.pillars).map((pillar) => pillar.label),
        demographicTraits: getDemographicPillars(currentVision.pillars).map(
          (pillar) => pillar.label,
        ),
        psychographicTraits: getPsychographicTraitPillars(currentVision.pillars).map(
          (pillar) => pillar.label,
        ),
        instagramCreators: getPsychographicCreatorPillars(currentVision.pillars).map(
          (pillar) => pillar.label,
        ),
      };
    },
    [buildAudienceContext],
  );

  const generateEcosystem = useCallback(
    async (answers: EcosystemAnswers, category?: EcosystemCategory) => {
      const currentVision = visionRef.current;
      const context = buildEcosystemContext(currentVision);

      if (context.contentPillars.length === 0) {
        setEcosystemGenerateError(CONTENT_PILLARS_REQUIRED_TOOLTIP);
        return false;
      }

      const hasBoardContext =
        context.message.length > 0 ||
        context.contentPillars.length > 0 ||
        context.painPoints.length > 0 ||
        context.passionPoints.length > 0;

      if (!hasBoardContext) {
        setEcosystemGenerateError(
          "Add a vision message or board content before building your ecosystem.",
        );
        return false;
      }

      setIsGeneratingEcosystem(true);
      setEcosystemGeneratingCategory(category ?? null);
      setEcosystemGenerateError(null);

      try {
        const existingOneOff = getOneOffPillars(currentVision.pillars).map(
          (pillar) => pillar.label,
        );
        const existingOngoingContent = getOngoingContentPillars(currentVision.pillars).map(
          (pillar) => pillar.label,
        );
        const existingHighValuePartners = getHighValuePartnersPillars(
          currentVision.pillars,
        ).map((pillar) => pillar.label);
        const existingReinvest = getReinvestPillars(currentVision.pillars).map(
          (pillar) => pillar.label,
        );

        const response = await fetch("/api/generate-ecosystem", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...answers,
            ...context,
            category,
            existingOneOff: existingOneOff.length > 0 ? existingOneOff : undefined,
            existingOngoingContent:
              existingOngoingContent.length > 0 ? existingOngoingContent : undefined,
            existingHighValuePartners:
              existingHighValuePartners.length > 0 ? existingHighValuePartners : undefined,
            existingReinvest: existingReinvest.length > 0 ? existingReinvest : undefined,
          }),
        });

        const data = (await response.json()) as {
          oneOff?: string[];
          ongoingContent?: string[];
          highValuePartners?: string[];
          reinvest?: string[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(data.error ?? "Failed to generate ecosystem.");
        }

        const generation = {
          oneOff: (data.oneOff ?? []).filter((label) => label.trim().length > 0),
          ongoingContent: (data.ongoingContent ?? []).filter((label) => label.trim().length > 0),
          highValuePartners: (data.highValuePartners ?? []).filter(
            (label) => label.trim().length > 0,
          ),
          reinvest: (data.reinvest ?? []).filter((label) => label.trim().length > 0),
        };

        const hasCategoryResults = category
          ? generation[category].length > 0
          : generation.oneOff.length > 0 ||
            generation.ongoingContent.length > 0 ||
            generation.highValuePartners.length > 0 ||
            generation.reinvest.length > 0;

        if (!hasCategoryResults) {
          throw new Error("No ecosystem ideas returned from AI.");
        }

        recordHistory(currentVision);
        persistVision((current) => setEcosystemFromGeneration(current, generation, category), {
          skipHistory: true,
        });
        return true;
      } catch (error) {
        const messageText =
          error instanceof Error ? error.message : "Failed to generate ecosystem.";
        setEcosystemGenerateError(messageText);
        return false;
      } finally {
        setIsGeneratingEcosystem(false);
        setEcosystemGeneratingCategory(null);
      }
    },
    [buildEcosystemContext, persistVision, recordHistory],
  );

  return {
    vision,
    isGeneratingMessage,
    isGeneratingPillars,
    isGeneratingDemographic,
    isGeneratingPsychographic,
    isGeneratingPainPoints,
    isGeneratingPassionPoints,
    isGeneratingExperience,
    isGeneratingSkills,
    isGeneratingEcosystem,
    ecosystemGeneratingCategory,
    messageGenerateError,
    pillarsGenerateError,
    demographicGenerateError,
    psychographicGenerateError,
    painGenerateError,
    passionGenerateError,
    experienceGenerateError,
    skillGenerateError,
    ecosystemGenerateError,
    canUndo,
    canRedo,
    undo,
    redo,
    setMessage,
    updatePillarPosition,
    updatePillarSize,
    updatePillarLabel,
    addPillar,
    addDemographicPillar,
    addInstagramCreatorPillar,
    addPsychographicTraitPillar,
    addPainPillar,
    addPassionPillar,
    addExperiencePillar,
    addSkillPillar,
    addOneOffPillar,
    addOngoingContentPillar,
    addHighValuePartnersPillar,
    addReinvestPillar,
    removePillar,
    removePillars,
    movePillars,
    moveMessageBox,
    moveContentPillarsBox,
    moveDemographicBox,
    moveInstagramCreatorsBox,
    movePsychographicTraitsBox,
    movePainBox,
    movePassionBox,
    moveExperienceBox,
    moveSkillBox,
    moveOneOffBox,
    moveOngoingContentBox,
    moveHighValuePartnersBox,
    moveReinvestBox,
    addConnection,
    removeConnection,
    generateMessage,
    generatePillars,
    generateDemographic,
    generatePsychographic,
    generatePainPoints,
    generatePassionPoints,
    generateExperience,
    generateSkills,
    generateEcosystem,
    addSelectedPillars,
    suggestedPillars,
    clearSuggestedPillars,
    setMessageGenerateError,
    setPillarsGenerateError,
    setPainGenerateError,
    setPassionGenerateError,
    setExperienceGenerateError,
    setSkillGenerateError,
    setEcosystemGenerateError,
    beginResizeHistory,
    endResizeHistory,
  };
}
