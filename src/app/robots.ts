import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/seo/site";

export default function robots(): MetadataRoute.Robots {
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
        ],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
