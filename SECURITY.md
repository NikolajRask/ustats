# Security Policy

## Supported versions

ustats is early (v0.1). Security fixes land on the default branch (`main`). Self-hosters should pull the latest `main` (or tagged releases when published) and re-apply migrations with `npx supabase db push`.

## Reporting a vulnerability

Please **do not** open a public GitHub issue for security problems.

Email or message the maintainer privately via the contact methods listed on the [GitHub repository](https://github.com/NikolajRask/ustats) (or open a **private** security advisory if enabled on the repo).

Include:

- A description of the issue and impact
- Steps to reproduce or a proof of concept
- Affected commit / version if known

You should receive an acknowledgement within a few days. Please give us reasonable time to patch before public disclosure.

## Self-host hardening checklist

- Keep `SUPABASE_SERVICE_ROLE_KEY` server-side only
- Set a strong unique `USTATS_HASH_SALT`
- Set `DISABLE_SIGNUP=true` and disable Email sign-ups in Supabase Auth
- Remove `USTATS_BOOTSTRAP_*` after the first admin exists
- Prefer a strong `USTATS_RECOVERY_PHRASE` if you enable password recovery in Settings
- Restrict who has Admin / Co-Admin roles; guests are read-only for assigned sites
