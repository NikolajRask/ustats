import Link from "next/link";

export default function NotFound() {
  return (
    <div className="landing relative flex min-h-screen flex-col overflow-hidden">
      <div aria-hidden className="landing-atmosphere pointer-events-none absolute inset-0" />
      <div aria-hidden className="landing-noise pointer-events-none absolute inset-0" />

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-7 sm:px-8">
        <Link
          href="/"
          className="landing-brand text-lg font-semibold tracking-tight"
        >
          ustats
        </Link>
        <Link
          href="/dashboard"
          className="rounded-sm bg-(--land-fg) px-3.5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          Dashboard
        </Link>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 pb-24 pt-10 sm:px-8">
        <p className="font-mono text-sm tracking-[0.2em] text-(--land-accent) uppercase">
          404
        </p>
        <h1 className="landing-brand mt-4 text-[clamp(2.75rem,8vw,5rem)] leading-[0.95] font-extrabold tracking-[-0.03em]">
          This path
          <br />
          isn’t tracked.
        </h1>
        <p className="mt-5 max-w-md text-base leading-relaxed text-(--land-muted) sm:text-lg">
          The page you’re looking for doesn’t exist — or it moved. Head home or
          open your dashboard.
        </p>
        <div className="mt-9 flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className="rounded-sm bg-(--land-accent) px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Back to home
          </Link>
          <Link
            href="/dashboard"
            className="rounded-sm border border-(--land-fg)/15 bg-(--land-surface) px-5 py-3 text-sm font-medium backdrop-blur-sm transition-colors hover:border-(--land-fg)/30"
          >
            Go to dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
