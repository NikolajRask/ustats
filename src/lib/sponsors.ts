/**
 * Landing page sponsors.
 *
 * Toggle `SHOW_SPONSORS` to hide/show the section entirely.
 * Add entries to `sponsors` when you have partners to feature.
 */
export const SHOW_SPONSORS = true;

export type Sponsor = {
  name: string;
  href: string;
  /** Path under /public, e.g. "/sponsors/acme.svg" */
  logo?: string;
  description?: string;
};

export const sponsors: Sponsor[] = [
  // {
  //   name: "Acme",
  //   href: "https://acme.example",
  //   logo: "/sponsors/acme.svg",
  //   description: "Infrastructure for indie projects",
  // },
];

/** Optional mailto / URL for “Become a sponsor” — leave empty to hide the CTA */
export const SPONSOR_CTA_HREF = "";
// e.g. "mailto:you@example.com?subject=ustats%20sponsorship"
