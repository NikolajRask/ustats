# Changelog

All notable changes to this project are documented in this file.

## [0.1.0] — 2026-08-02

First public self-host MVP.

### Added

- Cookie-free pageview / custom event ingest (`/script.js`, `/api/collect`)
- Dashboard: overview, geographics, events, funnels, users, errors, live feed
- Site settings: retention, privacy / cross-day tracking, embed snippet
- Instance roles (Admin, Co-Admin, Guest) and staff-managed users
- Optional AI assistant (`OPENAI_API_KEY`)
- Marketing / docs mode (`USTATS_MODE=marketing`)
- Deploy guide for Vercel + Supabase

### Known limitations

- No official Docker image
- No email team invites or public share links
- Experimental graphs / features / reports remain off by default
- Login rate limiting is in-memory (weaker on multi-instance serverless)
