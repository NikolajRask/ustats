import type { MetadataRoute } from "next";

import { isMarketingMode } from "@/lib/app-mode";
import { getAllPublicSeoPaths } from "@/lib/seo/content";
import { flattenDocsNav } from "@/lib/docs/nav";
import { absoluteUrl, getSiteUrl } from "@/lib/seo/site";

export default function sitemap(): MetadataRoute.Sitemap {
  if (!isMarketingMode()) {
    return [];
  }

  const paths = new Set([
    ...getAllPublicSeoPaths(),
    ...flattenDocsNav().map((item) => item.href),
  ]);

  const now = new Date();

  return [...paths].map((path) => {
    const priority =
      path === "/"
        ? 1
        : path.startsWith("/compare") ||
            path === "/alternatives" ||
            [
              "/self-hosted-analytics",
              "/cookie-free-analytics",
              "/privacy-friendly-analytics",
              "/open-source-web-analytics",
              "/supabase-analytics",
            ].includes(path)
          ? 0.9
          : path.startsWith("/docs")
            ? 0.8
            : 0.7;

    return {
      url: path === "/" ? getSiteUrl() : absoluteUrl(path),
      lastModified: now,
      changeFrequency: path === "/" ? "weekly" : "monthly",
      priority,
    };
  });
}
