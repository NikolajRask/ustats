export type DocsNavItem = {
  title: string;
  href: string;
};

export type DocsNavSection = {
  title: string;
  items: DocsNavItem[];
};

export const DOCS_NAV: DocsNavSection[] = [
  {
    title: "Getting started",
    items: [
      { title: "Introduction", href: "/docs" },
      { title: "Installation", href: "/docs/installation" },
      { title: "Configuration", href: "/docs/configuration" },
      { title: "Embed the script", href: "/docs/embed-script" },
    ],
  },
  {
    title: "Guides",
    items: [
      { title: "Custom events", href: "/docs/custom-events" },
      { title: "Privacy & visitors", href: "/docs/privacy" },
      { title: "Deploying", href: "/docs/deploying" },
    ],
  },
  {
    title: "Reference",
    items: [
      { title: "Environment variables", href: "/docs/environment-variables" },
      { title: "Script API", href: "/docs/script-api" },
    ],
  },
];

export function flattenDocsNav() {
  return DOCS_NAV.flatMap((section) => section.items);
}

export function getDocsPager(pathname: string) {
  const items = flattenDocsNav();
  const index = items.findIndex((item) => item.href === pathname);
  if (index === -1) {
    return { prev: null, next: null };
  }
  return {
    prev: index > 0 ? items[index - 1] : null,
    next: index < items.length - 1 ? items[index + 1] : null,
  };
}
