# Contributing to ustats

Thanks for helping improve ustats. This project is a self-hosted analytics stack (Next.js + Supabase).

## Development setup

1. Fork and clone the repo.
2. Create a Supabase project (or use a local Supabase stack).
3. Install with **npm** (the repo ships `package-lock.json`):

```bash
npm install
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
cp .env.example .env.local
```

4. Fill env vars (see `.env.example` and the Environment variables docs under `/docs/environment-variables` when running with `USTATS_MODE=marketing`).
5. Run `npm run dev` and open `http://localhost:3000`.

Leave `USTATS_MODE` unset for the app/dashboard. Set `USTATS_MODE=marketing` only when working on the public landing/docs site.

## Project conventions

- Dashboard metrics must be aggregated in **Postgres** (RPCs / SQL), not by loading all `events` into Node. See `.cursor/rules/analytics-aggregation.mdc`.
- Prefer matching existing UI patterns in `src/components/dashboard` and docs chrome in `src/components/docs`.
- Schema changes belong in new files under `supabase/migrations/` — never rewrite applied migrations.
- This Next.js version may differ from older docs you know; check `node_modules/next/dist/docs/` when unsure.

## Pull requests

- Keep PRs focused and describe the “why”.
- Run `npm run lint` and `npm run build` before opening a PR.
- Do not commit `.env`, secrets, or service role keys.
- For UI changes, a short before/after note or screenshot helps.

## Reporting issues

Use GitHub Issues for bugs and feature ideas. Include:

- ustats version / commit
- Host (Vercel, local, etc.) and Node version
- Steps to reproduce and expected vs actual behavior

Security vulnerabilities: see [SECURITY.md](SECURITY.md) — do not open a public issue for sensitive reports.

## License

By contributing, you agree that your contributions are licensed under the MIT License.
