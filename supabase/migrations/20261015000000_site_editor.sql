-- Public page content and an explicit allow-list for editors.
create table if not exists public.site_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.site_content (
  id integer primary key check (id = 1),
  content jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.site_admins enable row level security;
alter table public.site_content enable row level security;

revoke all on public.site_admins from anon, authenticated;
revoke all on public.site_content from anon, authenticated;
grant select on public.site_admins to authenticated;
grant select on public.site_content to anon, authenticated;
grant insert, update on public.site_content to authenticated;

drop policy if exists "Editors can see their membership" on public.site_admins;
create policy "Editors can see their membership"
  on public.site_admins for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Visitors can read site content" on public.site_content;
create policy "Visitors can read site content"
  on public.site_content for select to anon, authenticated
  using (id = 1);

drop policy if exists "Editors can insert site content" on public.site_content;
create policy "Editors can insert site content"
  on public.site_content for insert to authenticated
  with check (
    id = 1 and exists (
      select 1 from public.site_admins where user_id = (select auth.uid())
    )
  );

drop policy if exists "Editors can update site content" on public.site_content;
create policy "Editors can update site content"
  on public.site_content for update to authenticated
  using (
    id = 1 and exists (
      select 1 from public.site_admins where user_id = (select auth.uid())
    )
  )
  with check (
    id = 1 and exists (
      select 1 from public.site_admins where user_id = (select auth.uid())
    )
  );

-- Public bucket serves images; only editors may upload them.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-media', 'site-media', true, 26214400,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'application/pdf']
)
on conflict (id) do nothing;

drop policy if exists "Editors can upload site media" on storage.objects;
create policy "Editors can upload site media"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'site-media' and
    (storage.foldername(name))[1] = 'uploads' and
    exists (select 1 from public.site_admins where user_id = (select auth.uid()))
  );
