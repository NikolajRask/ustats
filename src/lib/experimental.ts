/**
 * Experimental dashboard features.
 *
 * Flip individual flags to `true` to show them in site nav and unlock their
 * routes. All are off by default until ready for general use.
 */
export const experimentalFeatures = {
  graphs: false,
  features: false,
  reports: false,
} as const;

export type ExperimentalFeature = keyof typeof experimentalFeatures;

export function isExperimentalEnabled(
  feature: ExperimentalFeature,
): boolean {
  return experimentalFeatures[feature];
}
