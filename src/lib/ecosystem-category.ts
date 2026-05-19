export type EcosystemCategory =
  | "oneOff"
  | "ongoingContent"
  | "highValuePartners"
  | "reinvest";

export const CONTENT_PILLARS_REQUIRED_TOOLTIP =
  "You should add your content pillars first";

export const ECOSYSTEM_CATEGORY_BUILD_LABELS: Record<EcosystemCategory, string> = {
  oneOff: "Build one-off ideas",
  ongoingContent: "Build ongoing ideas",
  highValuePartners: "Build partner ideas",
  reinvest: "Build reinvest ideas",
};

export const ECOSYSTEM_CATEGORY_DIALOG_TITLES: Record<EcosystemCategory, string> = {
  oneOff: "Build one-off ideas",
  ongoingContent: "Build ongoing content ideas",
  highValuePartners: "Build high-value partner ideas",
  reinvest: "Build reinvest ideas",
};
