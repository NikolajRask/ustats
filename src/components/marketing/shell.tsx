import Link from "next/link";

import {
  DOWNLOAD_URL,
  REPO_URL,
  SITE_NAME,
} from "@/lib/seo/site";

export function MarketingHeader({
  active,
}: {
  active?: "docs" | "roadmap" | "compare" | "alternatives";
}) {
  return (
    <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-7 sm:px-8">
      <Link
        href="/"
        className="landing-brand text-lg font-semibold tracking-tight"
      >
        {SITE_NAME}
      </Link>
      <nav className="flex flex-wrap items-center justify-end gap-1 text-sm">
        <Link
          href="/docs"
          className={
            active === "docs"
              ? "px-3.5 py-2 font-medium text-(--land-fg)"
              : "px-3.5 py-2 text-(--land-muted) transition-colors hover:text-(--land-fg)"
          }
          aria-current={active === "docs" ? "page" : undefined}
        >
          Docs
        </Link>
        <Link
          href="/alternatives"
          className={
            active === "alternatives" || active === "compare"
              ? "px-3.5 py-2 font-medium text-(--land-fg)"
              : "px-3.5 py-2 text-(--land-muted) transition-colors hover:text-(--land-fg)"
          }
          aria-current={
            active === "alternatives" || active === "compare"
              ? "page"
              : undefined
          }
        >
          Alternatives
        </Link>
        <Link
          href="/roadmap"
          className={
            active === "roadmap"
              ? "px-3.5 py-2 font-medium text-(--land-fg)"
              : "px-3.5 py-2 text-(--land-muted) transition-colors hover:text-(--land-fg)"
          }
          aria-current={active === "roadmap" ? "page" : undefined}
        >
          Roadmap
        </Link>
        <a
          href={REPO_URL}
          className="px-3.5 py-2 text-(--land-muted) transition-colors hover:text-(--land-fg)"
        >
          GitHub
        </a>
        <a
          href={DOWNLOAD_URL}
          className="rounded-sm bg-(--land-fg) px-3.5 py-2 font-medium text-white transition-opacity hover:opacity-90"
        >
          Download
        </a>
      </nav>
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="relative z-10 border-t border-(--land-fg)/8">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-10 text-sm text-(--land-muted) sm:px-8 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <Link href="/" className="landing-brand text-(--land-fg)">
            {SITE_NAME}
          </Link>
          <p className="mt-3 max-w-xs leading-relaxed">
            Self-hosted, privacy-friendly web analytics on your Supabase.
          </p>
        </div>
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <p className="mb-3 font-medium text-(--land-fg)">Product</p>
            <ul className="space-y-2">
              <li>
                <Link href="/docs" className="hover:text-(--land-fg)">
                  Docs
                </Link>
              </li>
              <li>
                <Link href="/roadmap" className="hover:text-(--land-fg)">
                  Roadmap
                </Link>
              </li>
              <li>
                <a href={DOWNLOAD_URL} className="hover:text-(--land-fg)">
                  Download
                </a>
              </li>
              <li>
                <a href={REPO_URL} className="hover:text-(--land-fg)">
                  GitHub
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="mb-3 font-medium text-(--land-fg)">Guides</p>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/self-hosted-analytics"
                  className="hover:text-(--land-fg)"
                >
                  Self-hosted analytics
                </Link>
              </li>
              <li>
                <Link
                  href="/cookie-free-analytics"
                  className="hover:text-(--land-fg)"
                >
                  Cookie-free analytics
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy-friendly-analytics"
                  className="hover:text-(--land-fg)"
                >
                  Privacy-friendly
                </Link>
              </li>
              <li>
                <Link
                  href="/open-source-web-analytics"
                  className="hover:text-(--land-fg)"
                >
                  Open-source analytics
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="mb-3 font-medium text-(--land-fg)">Compare</p>
            <ul className="space-y-2">
              <li>
                <Link href="/alternatives" className="hover:text-(--land-fg)">
                  Alternatives
                </Link>
              </li>
              <li>
                <Link
                  href="/compare/plausible"
                  className="hover:text-(--land-fg)"
                >
                  vs Plausible
                </Link>
              </li>
              <li>
                <Link
                  href="/compare/google-analytics"
                  className="hover:text-(--land-fg)"
                >
                  vs Google Analytics
                </Link>
              </li>
              <li>
                <Link href="/compare/umami" className="hover:text-(--land-fg)">
                  vs umami
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 border-t border-(--land-fg)/8 px-6 py-5 text-xs text-(--land-muted) sm:px-8">
        <span>MIT License</span>
        <Link href="/supabase-analytics" className="hover:text-(--land-fg)">
          Supabase analytics
        </Link>
      </div>
    </footer>
  );
}

export function MarketingShell({
  children,
  active,
}: {
  children: React.ReactNode;
  active?: "docs" | "roadmap" | "compare" | "alternatives";
}) {
  return (
    <div className="landing relative min-h-screen overflow-hidden">
      <div
        aria-hidden
        className="landing-atmosphere pointer-events-none absolute inset-0"
      />
      <div
        aria-hidden
        className="landing-noise pointer-events-none absolute inset-0"
      />
      <MarketingHeader active={active} />
      <div className="relative z-10">{children}</div>
      <MarketingFooter />
    </div>
  );
}
