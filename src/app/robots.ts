import type { MetadataRoute } from "next";

import { isMarketingMode } from "@/lib/app-mode";
import { absoluteUrl } from "@/lib/seo/site";

export default function robots(): MetadataRoute.Robots {
  if (!isMarketingMode()) {
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
          "/api/",
          "/auth/",
          "/mode-gate",
        ],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
