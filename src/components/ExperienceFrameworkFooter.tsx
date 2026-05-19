"use client";

import { UniquenessFrameworkFooter } from "@/components/UniquenessFrameworkFooter";

type ExperienceFrameworkFooterProps = {
  canBuildSuggestions: boolean;
  isGenerating: boolean;
  generateError: string | null;
  onBuildExperience: () => void;
  onAddManually: () => void;
};

export function ExperienceFrameworkFooter(props: ExperienceFrameworkFooterProps) {
  return (
    <UniquenessFrameworkFooter
      buildLabel="Build experience"
      canBuildSuggestions={props.canBuildSuggestions}
      isGenerating={props.isGenerating}
      generateError={props.generateError}
      onBuild={props.onBuildExperience}
      onAddManually={props.onAddManually}
    />
  );
}
