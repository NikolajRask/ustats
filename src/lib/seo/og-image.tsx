import { ImageResponse } from "next/og";

import { SITE_TAGLINE } from "@/lib/seo/site";

export const ogImageSize = { width: 1200, height: 630 };
export const ogImageAlt = "ustats — self-hosted web analytics";
export const ogImageContentType = "image/png";

export function createOgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background:
            "linear-gradient(165deg, #f3f5f7 0%, #e4e9ed 48%, #dce4e0 100%)",
          color: "#0b1210",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 42,
            fontWeight: 700,
            letterSpacing: "-0.04em",
          }}
        >
          ustats
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              fontSize: 72,
              fontWeight: 800,
              letterSpacing: "-0.045em",
              lineHeight: 1.02,
              maxWidth: 900,
            }}
          >
            Analytics you host. Data you keep.
          </div>
          <div
            style={{
              fontSize: 28,
              color: "#5a6660",
              maxWidth: 760,
              lineHeight: 1.35,
            }}
          >
            {SITE_TAGLINE}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: 22,
            color: "#0c8f6e",
            fontWeight: 600,
          }}
        >
          Self-hosted · Cookie-free · Supabase
        </div>
      </div>
    ),
    { ...ogImageSize },
  );
}
