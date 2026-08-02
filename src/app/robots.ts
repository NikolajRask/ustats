import type { MetadataRoute } from "next";

import { canServeMarketingPages } from "@/lib/app-mode";
import { absoluteUrl } from "@/lib/seo/site";

export default function robots(): MetadataRoute.Robots {
  if (!canServeMarketingPages()) {
    return {
      rules: [
        {
          userAgent: "*",
          disallow: "/",
        },
      ],
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard",
          "/dashboard/",
          "/login",
          "/test",
          "/preview",
          "/preview/",
          "/api/",
          "/auth/",
          "/mode-gate",
        ],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
