# ustats

Self-hosted, privacy-friendly web analytics on **your** Supabase project.

Open-source alternative to Plausible / a.st — pageviews, unique visitors, top pages, referrers, countries/devices, UTMs, custom events, and a realtime live feed.

## Stack

- Next.js (App Router)
- Supabase (Postgres, Auth, Realtime)
- Cookie-free tracking (daily salted visitor hash; raw IPs are not stored)

## Quick start

### 1. Create a Supabase project

In the [Supabase dashboard](https://supabase.com/dashboard), create a project and note:

- Project URL
- `anon` (public) key
- `service_role` key (server only — never expose in the browser)

### 2. Apply the database migration

```bash
npm install
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

Or paste the SQL from [`supabase/migrations/20260731212513_init.sql`](supabase/migrations/20260731212513_init.sql) into the SQL editor.

Enable **Realtime** for the `events` table if the migration did not already add it (Dashboard → Database → Publications).

### 3. Configure environment

```bash
cp .env.example .env.local
```

Fill in:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (collector inserts) |
| `USTATS_HASH_SALT` | Long random string for visitor hashing |
| `NEXT_PUBLIC_APP_URL` | Public URL of this install (for embed snippets) |

In Supabase Auth settings, add your app URL to **Redirect URLs** (e.g. `http://localhost:3000/auth/callback`).

### 4. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), create an account, add a site, and copy the embed snippet.

### 5. Embed the tracker

```html
<script defer data-key="YOUR_SITE_PUBLIC_KEY" src="https://your-ustats-host/script.js"></script>
```

Custom events:

```js
ustats.track("signup", { plan: "pro" });
```

SPA route changes are tracked automatically via `history.pushState` / `popstate`.

## Deploy

Deploy the Next.js app anywhere Node works (Vercel, Fly, Docker, etc.). Set the same env vars in your host. Point `NEXT_PUBLIC_APP_URL` at the production URL.

Geo country codes are read from CDN headers when available (`x-vercel-ip-country`, `cf-ipcountry`).

## Architecture

```
Browser  --script.js-->  POST /api/collect  -->  Supabase (service role insert)
Owner    --dashboard-->  Supabase Auth + RLS select on events
Live UI  <--Realtime---  postgres_changes on events
```

- Collector validates the site `public_key` and domain, drops obvious bots, hashes IP+UA with a daily salt, and stores the event.
- Dashboard users only see sites they belong to (`site_members` + RLS).
- No direct client inserts on `events` — only the service role collector writes.

## Local development notes

- Changing `USTATS_HASH_SALT` or waiting past UTC midnight changes visitor identity (by design).
- For production, generate a strong `USTATS_HASH_SALT` and keep the service role key server-side only.

## License

MIT
