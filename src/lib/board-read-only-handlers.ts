import type { MessageAnswers } from "@/components/GenerateMessageDialog";
import type { PainPointAnswers } from "@/components/BuildPainPointsDialog";
import type { PassionPointAnswers } from "@/components/BuildPassionPointsDialog";
import type { ExperienceAnswers } from "@/components/BuildExperienceDialog";
import type { SkillAnswers } from "@/components/BuildSkillsDialog";
import type { EcosystemAnswers } from "@/components/BuildEcosystemDialog";
import type { ConnectionAnchor } from "@/lib/vision-store";
import type { EcosystemCategory } from "@/lib/ecosystem-category";

export const readOnlyBoardHandlers = {
  onMessageChange: () => {},
  onGenerateMessage: async (_answers: MessageAnswers) => false,
  onGeneratePillars: async (_replaceExisting: boolean) =>
    ({ needsConfirmation: false }) as const,
  onGenerateDemographic: () => {},
  onGeneratePsychographic: () => {},
  onGeneratePainPoints: async (_answers: PainPointAnswers) => false,
  onGeneratePassionPoints: async (_answers: PassionPointAnswers) => false,
  onGenerateExperience: async (_answers: ExperienceAnswers) => false,
  onGenerateSkills: async (_answers: SkillAnswers) => false,
  onGenerateEcosystem: async (
    _answers: EcosystemAnswers,
    _category?: EcosystemCategory,
  ) => false,
  onAddDemographicPillar: () => {},
  onAddInstagramCreatorPillar: () => {},
  onAddPsychographicTraitPillar: () => {},
  onAddPainPillar: () => {},
  onAddPassionPillar: () => {},
  onAddExperiencePillar: () => {},
  onAddSkillPillar: () => {},
  onAddOneOffPillar: () => {},
  onAddOngoingContentPillar: () => {},
  onAddHighValuePartnersPillar: () => {},
  onAddReinvestPillar: () => {},
  onAddSelectedPillars: (_labels: string[]) => {},
  onClearSuggestedPillars: () => {},
  onAddPillar: () => {},
  onUpdateLabel: (_id: string, _label: string) => {},
  onRemovePillars: (_ids: string[]) => {},
  onMovePillars: (_ids: string[], _delta: { x: number; y: number }) => {},
  onMoveMessageBox: (_delta: { x: number; y: number }) => {},
  onMoveContentPillarsBox: (_delta: { x: number; y: number }) => {},
  onMoveDemographicBox: (_delta: { x: number; y: number }) => {},
  onMoveInstagramCreatorsBox: (_delta: { x: number; y: number }) => {},
  onMovePsychographicTraitsBox: (_delta: { x: number; y: number }) => {},
  onMovePainBox: (_delta: { x: number; y: number }) => {},
  onMovePassionBox: (_delta: { x: number; y: number }) => {},
  onMoveExperienceBox: (_delta: { x: number; y: number }) => {},
  onMoveSkillBox: (_delta: { x: number; y: number }) => {},
  onMoveOneOffBox: (_delta: { x: number; y: number }) => {},
  onMoveOngoingContentBox: (_delta: { x: number; y: number }) => {},
  onMoveHighValuePartnersBox: (_delta: { x: number; y: number }) => {},
  onMoveReinvestBox: (_delta: { x: number; y: number }) => {},
  onUpdatePillarSize: (_id: string, _width: number, _height: number) => {},
  onResizeStart: () => {},
  onResizeEnd: () => {},
  onAddConnection: (
    _fromPillarId: string,
    _fromAnchor: ConnectionAnchor,
    _toPillarId: string,
    _toAnchor: ConnectionAnchor,
  ) => {},
  onRemoveConnection: (_connectionId: string) => {},
};
