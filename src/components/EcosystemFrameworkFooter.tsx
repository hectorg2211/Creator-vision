"use client";

type EcosystemFrameworkFooterProps = {
  isGenerating: boolean;
  generateError: string | null;
  onBuildEcosystem: () => void;
  onAddManually: () => void;
};

const actionButtonClass =
  "w-full rounded-md px-2 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-60";

export function EcosystemFrameworkFooter({
  isGenerating,
  generateError,
  onBuildEcosystem,
  onAddManually,
}: EcosystemFrameworkFooterProps) {
  return (
    <div className="flex w-full flex-col gap-1.5">
      <button
        type="button"
        onClick={onBuildEcosystem}
        disabled={isGenerating}
        className={`${actionButtonClass} bg-violet-600 text-white hover:bg-violet-700`}
      >
        {isGenerating ? "Generating…" : "Build ecosystem"}
      </button>
      <button
        type="button"
        onClick={onAddManually}
        className={`${actionButtonClass} border border-zinc-200 bg-white/90 text-zinc-700 shadow-sm hover:bg-white`}
      >
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
