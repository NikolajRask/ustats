-- Optional per-site durable visitor identity (stable salt, no daily rotation).
-- Off by default: daily salted hashes remain the privacy-friendly default.

alter table public.sites
  add column cross_day_tracking boolean not null default false;
