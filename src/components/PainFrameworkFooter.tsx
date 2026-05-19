"use client";

import { UniquenessFrameworkFooter } from "@/components/UniquenessFrameworkFooter";

type PainFrameworkFooterProps = {
  canBuildSuggestions: boolean;
  isGenerating: boolean;
  generateError: string | null;
  onBuildPainPoints: () => void;
  onAddManually: () => void;
};

export function PainFrameworkFooter(props: PainFrameworkFooterProps) {
  return (
    <UniquenessFrameworkFooter
      buildLabel="Build pain points"
      canBuildSuggestions={props.canBuildSuggestions}
      isGenerating={props.isGenerating}
      generateError={props.generateError}
      onBuild={props.onBuildPainPoints}
      onAddManually={props.onAddManually}
    />
  );
}
