-- Conversion funnels: ordered steps (path or custom event) per site

create table public.funnels (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint funnels_name_not_blank check (char_length(trim(name)) > 0)
);

create table public.funnel_steps (
  id uuid primary key default gen_random_uuid(),
  funnel_id uuid not null references public.funnels (id) on delete cascade,
  position integer not null,
  name text not null,
  step_type text not null check (step_type in ('path', 'event')),
  match_value text not null,
  created_at timestamptz not null default now(),
  constraint funnel_steps_name_not_blank check (char_length(trim(name)) > 0),
  constraint funnel_steps_match_not_blank check (char_length(trim(match_value)) > 0),
  constraint funnel_steps_position_positive check (position >= 0),
  constraint funnel_steps_funnel_position_unique unique (funnel_id, position)
);

create index funnels_site_id_idx on public.funnels (site_id);
create index funnel_steps_funnel_id_idx on public.funnel_steps (funnel_id);

alter table public.funnels enable row level security;
alter table public.funnel_steps enable row level security;

create policy "Members can select funnels"
  on public.funnels for select
  to authenticated
  using (private.is_site_member(site_id));

create policy "Members can insert funnels"
  on public.funnels for insert
  to authenticated
  with check (private.is_site_member(site_id));

create policy "Members can update funnels"
  on public.funnels for update
  to authenticated
  using (private.is_site_member(site_id))
  with check (private.is_site_member(site_id));

create policy "Members can delete funnels"
  on public.funnels for delete
  to authenticated
  using (private.is_site_member(site_id));

create policy "Members can select funnel_steps"
  on public.funnel_steps for select
  to authenticated
  using (
    exists (
      select 1
      from public.funnels f
      where f.id = funnel_id
        and private.is_site_member(f.site_id)
    )
  );

create policy "Members can insert funnel_steps"
  on public.funnel_steps for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.funnels f
      where f.id = funnel_id
        and private.is_site_member(f.site_id)
    )
  );

create policy "Members can update funnel_steps"
  on public.funnel_steps for update
  to authenticated
  using (
    exists (
      select 1
      from public.funnels f
      where f.id = funnel_id
        and private.is_site_member(f.site_id)
    )
  )
  with check (
    exists (
      select 1
      from public.funnels f
      where f.id = funnel_id
        and private.is_site_member(f.site_id)
    )
  );

create policy "Members can delete funnel_steps"
  on public.funnel_steps for delete
  to authenticated
  using (
    exists (
      select 1
      from public.funnels f
      where f.id = funnel_id
        and private.is_site_member(f.site_id)
    )
  );

grant select, insert, update, delete on public.funnels to authenticated;
grant select, insert, update, delete on public.funnel_steps to authenticated;
