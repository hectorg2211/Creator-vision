"use client";

import { useSyncExternalStore } from "react";
import { BoardCanvas } from "@/components/BoardCanvas";
import { useVisionStore } from "@/hooks/useVisionStore";

function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

function VisionBoardLoaded() {
  const {
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
    setMessage,
    updatePillarLabel,
    addPillar,
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
    updatePillarSize,
    beginResizeHistory,
    endResizeHistory,
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
    addSelectedPillars,
    suggestedPillars,
    clearSuggestedPillars,
  } = useVisionStore();

  return (
    <div className="h-screen overflow-hidden bg-zinc-100">
      <BoardCanvas
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
        isGeneratingMessage={isGeneratingMessage}
        isGeneratingPillars={isGeneratingPillars}
        isGeneratingDemographic={isGeneratingDemographic}
        isGeneratingPsychographic={isGeneratingPsychographic}
        isGeneratingPainPoints={isGeneratingPainPoints}
        isGeneratingPassionPoints={isGeneratingPassionPoints}
        isGeneratingExperience={isGeneratingExperience}
        isGeneratingSkills={isGeneratingSkills}
        isGeneratingEcosystem={isGeneratingEcosystem}
        ecosystemGeneratingCategory={ecosystemGeneratingCategory}
        messageError={messageGenerateError}
        pillarsError={pillarsGenerateError}
        demographicError={demographicGenerateError}
        psychographicError={psychographicGenerateError}
        painError={painGenerateError}
        passionError={passionGenerateError}
        experienceError={experienceGenerateError}
        skillError={skillGenerateError}
        ecosystemError={ecosystemGenerateError}
        suggestedPillars={suggestedPillars}
        onMessageChange={setMessage}
        onGenerateMessage={generateMessage}
        onGeneratePillars={generatePillars}
        onGenerateDemographic={generateDemographic}
        onGeneratePsychographic={generatePsychographic}
        onGeneratePainPoints={generatePainPoints}
        onGeneratePassionPoints={generatePassionPoints}
        onGenerateExperience={generateExperience}
        onGenerateSkills={generateSkills}
        onGenerateEcosystem={generateEcosystem}
        onAddDemographicPillar={addDemographicPillar}
        onAddInstagramCreatorPillar={addInstagramCreatorPillar}
        onAddPsychographicTraitPillar={addPsychographicTraitPillar}
        onAddPainPillar={addPainPillar}
        onAddPassionPillar={addPassionPillar}
        onAddExperiencePillar={addExperiencePillar}
        onAddSkillPillar={addSkillPillar}
        onAddOneOffPillar={addOneOffPillar}
        onAddOngoingContentPillar={addOngoingContentPillar}
        onAddHighValuePartnersPillar={addHighValuePartnersPillar}
        onAddReinvestPillar={addReinvestPillar}
        onAddSelectedPillars={addSelectedPillars}
        onClearSuggestedPillars={clearSuggestedPillars}
        onAddPillar={() => addPillar()}
        onUpdateLabel={updatePillarLabel}
        onRemovePillars={removePillars}
        onMovePillars={movePillars}
        onMoveMessageBox={moveMessageBox}
        onMoveContentPillarsBox={moveContentPillarsBox}
        onMoveDemographicBox={moveDemographicBox}
        onMoveInstagramCreatorsBox={moveInstagramCreatorsBox}
        onMovePsychographicTraitsBox={movePsychographicTraitsBox}
        onMovePainBox={movePainBox}
        onMovePassionBox={movePassionBox}
        onMoveExperienceBox={moveExperienceBox}
        onMoveSkillBox={moveSkillBox}
        onMoveOneOffBox={moveOneOffBox}
        onMoveOngoingContentBox={moveOngoingContentBox}
        onMoveHighValuePartnersBox={moveHighValuePartnersBox}
        onMoveReinvestBox={moveReinvestBox}
        onUpdatePillarSize={updatePillarSize}
        onResizeStart={beginResizeHistory}
        onResizeEnd={endResizeHistory}
        onAddConnection={addConnection}
        onRemoveConnection={removeConnection}
      />
    </div>
  );
}

export function VisionBoard() {
  const isClient = useIsClient();

  if (!isClient) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-100 text-sm text-zinc-500">
        Loading your vision…
      </div>
    );
  }

  return <VisionBoardLoaded />;
}
