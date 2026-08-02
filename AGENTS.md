<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:ustats-analytics-rules -->
# Analytics aggregation

Dashboard metrics must be computed in **Postgres** (RPCs like `get_site_stats`, or rollup tables) — not by `fetchAllRows` of `events` into the app. Raw events are for ingest, bounded logs, and live feed only. See `.cursor/rules/analytics-aggregation.mdc`.
<!-- END:ustats-analytics-rules -->
