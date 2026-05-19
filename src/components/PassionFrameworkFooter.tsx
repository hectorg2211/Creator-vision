"use client";

import { UniquenessFrameworkFooter } from "@/components/UniquenessFrameworkFooter";

type PassionFrameworkFooterProps = {
  canBuildSuggestions: boolean;
  isGenerating: boolean;
  generateError: string | null;
  onBuildPassionPoints: () => void;
  onAddManually: () => void;
};

export function PassionFrameworkFooter(props: PassionFrameworkFooterProps) {
  return (
    <UniquenessFrameworkFooter
      buildLabel="Build passion points"
      canBuildSuggestions={props.canBuildSuggestions}
      isGenerating={props.isGenerating}
      generateError={props.generateError}
      onBuild={props.onBuildPassionPoints}
      onAddManually={props.onAddManually}
    />
  );
}
