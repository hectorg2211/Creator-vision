"use client";

import { DisabledBuildTooltip } from "@/components/DisabledBuildTooltip";
import { CONTENT_PILLARS_REQUIRED_TOOLTIP } from "@/lib/ecosystem-category";

type UniquenessFrameworkFooterProps = {
  buildLabel: string;
  canBuildSuggestions: boolean;
  isGenerating: boolean;
  generateError: string | null;
  onBuild: () => void;
  onAddManually: () => void;
};

const actionButtonClass =
  "w-full rounded-md px-2 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-60";

const secondaryButtonClass = `${actionButtonClass} border border-zinc-200 bg-white/90 text-zinc-700 shadow-sm hover:bg-white`;

export function UniquenessFrameworkFooter({
  buildLabel,
  canBuildSuggestions,
  isGenerating,
  generateError,
  onBuild,
  onAddManually,
}: UniquenessFrameworkFooterProps) {
  const isBuildDisabled = !canBuildSuggestions || isGenerating;

  return (
    <div className="flex w-full flex-col gap-1.5">
      <DisabledBuildTooltip
        showTooltip={!canBuildSuggestions}
        message={CONTENT_PILLARS_REQUIRED_TOOLTIP}
      >
        <button
          type="button"
          onClick={onBuild}
          disabled={isBuildDisabled}
          aria-disabled={isBuildDisabled}
          className={`${actionButtonClass} bg-violet-600 text-white hover:bg-violet-700 disabled:hover:bg-violet-600`}
        >
          {isGenerating ? "Generating…" : buildLabel}
        </button>
      </DisabledBuildTooltip>
      <button type="button" onClick={onAddManually} className={secondaryButtonClass}>
        Add manually
      </button>
      {generateError ? (
        <p className="text-[10px] leading-tight text-red-600" role="alert">
          {generateError}
        </p>
      ) : null}
    </div>
  );
}
