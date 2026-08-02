-- Site performance reports (DOCX) + private storage bucket

create table public.site_reports (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete cascade,
  range_days int not null check (range_days in (7, 30, 90)),
  range_from timestamptz not null,
  range_to timestamptz not null,
  file_name text not null,
  storage_path text not null,
  created_at timestamptz not null default now(),
  constraint site_reports_file_name_not_blank check (char_length(trim(file_name)) > 0),
  constraint site_reports_storage_path_not_blank check (char_length(trim(storage_path)) > 0)
);

create index site_reports_site_created_at_idx
  on public.site_reports (site_id, created_at desc);

alter table public.site_reports enable row level security;

create policy "Members can select site_reports"
  on public.site_reports for select
  to authenticated
  using (private.is_site_member(site_id));

create policy "Members can insert site_reports"
  on public.site_reports for insert
  to authenticated
  with check (private.is_site_member(site_id) and created_by = auth.uid());

create policy "Members can delete site_reports"
  on public.site_reports for delete
  to authenticated
  using (private.is_site_member(site_id));

grant select, insert, delete on public.site_reports to authenticated;

-- Private bucket: objects live at reports/{site_id}/{report_id}.docx
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'ustats',
  'ustats',
  false,
  10485760,
  array['application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
on conflict (id) do nothing;

create policy "Members can select report objects"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'ustats'
    and (storage.foldername(name))[1] = 'reports'
    and private.is_site_member(((storage.foldername(name))[2])::uuid)
  );

create policy "Members can insert report objects"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'ustats'
    and (storage.foldername(name))[1] = 'reports'
    and private.is_site_member(((storage.foldername(name))[2])::uuid)
  );

create policy "Members can update report objects"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'ustats'
    and (storage.foldername(name))[1] = 'reports'
    and private.is_site_member(((storage.foldername(name))[2])::uuid)
  )
  with check (
    bucket_id = 'ustats'
    and (storage.foldername(name))[1] = 'reports'
    and private.is_site_member(((storage.foldername(name))[2])::uuid)
  );

create policy "Members can delete report objects"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'ustats'
    and (storage.foldername(name))[1] = 'reports'
    and private.is_site_member(((storage.foldername(name))[2])::uuid)
  );
