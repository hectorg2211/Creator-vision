/** Maximum span (in years) for demographic age-range traits. */
export const MAX_DEMOGRAPHIC_AGE_SPAN = 10;

/** Matches numeric age ranges like "25-35" or "25 – 35". */
export const DEMOGRAPHIC_AGE_RANGE_PATTERN = /(\d+)\s*([-–])\s*(\d+)/;

export function getDemographicAgeRangeSpan(label: string): number | null {
  const match = label.match(DEMOGRAPHIC_AGE_RANGE_PATTERN);
  if (!match) {
    return null;
  }

  const start = Number.parseInt(match[1], 10);
  const end = Number.parseInt(match[3], 10);
  if (Number.isNaN(start) || Number.isNaN(end)) {
    return null;
  }

  return Math.abs(end - start);
}

/** Clamps age-range spans to at most {@link MAX_DEMOGRAPHIC_AGE_SPAN} years. */
export function clampDemographicAgeRangeInLabel(label: string): string {
  return label.replace(
    DEMOGRAPHIC_AGE_RANGE_PATTERN,
    (full, startStr: string, separator: string, endStr: string) => {
      const start = Number.parseInt(startStr, 10);
      const end = Number.parseInt(endStr, 10);
      if (Number.isNaN(start) || Number.isNaN(end)) {
        return full;
      }

      const span = Math.abs(end - start);
      if (span <= MAX_DEMOGRAPHIC_AGE_SPAN) {
        return full;
      }

      if (start <= end) {
        return `${start}${separator}${start + MAX_DEMOGRAPHIC_AGE_SPAN}`;
      }

      return `${start}${separator}${start - MAX_DEMOGRAPHIC_AGE_SPAN}`;
    },
  );
}

export function sanitizeDemographicTraitLabels(labels: string[]): string[] {
  return labels.map((label) => clampDemographicAgeRangeInLabel(label.trim()));
}
