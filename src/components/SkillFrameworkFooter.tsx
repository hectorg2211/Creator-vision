"use client";

import { UniquenessFrameworkFooter } from "@/components/UniquenessFrameworkFooter";

type SkillFrameworkFooterProps = {
  canBuildSuggestions: boolean;
  isGenerating: boolean;
  generateError: string | null;
  onBuildSkills: () => void;
  onAddManually: () => void;
};

export function SkillFrameworkFooter(props: SkillFrameworkFooterProps) {
  return (
    <UniquenessFrameworkFooter
      buildLabel="Build skills"
      canBuildSuggestions={props.canBuildSuggestions}
      isGenerating={props.isGenerating}
      generateError={props.generateError}
      onBuild={props.onBuildSkills}
      onAddManually={props.onAddManually}
    />
  );
}
