create table if not exists public.page_visits (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  visit_date date not null default current_date,
  page_key text not null,
  page_path text not null,
  language text not null default 'fr',
  session_id text,
  referrer text
);

alter table public.page_visits enable row level security;

create index if not exists page_visits_created_at_idx on public.page_visits (created_at desc);
create index if not exists page_visits_visit_date_idx on public.page_visits (visit_date desc);
create index if not exists page_visits_page_key_idx on public.page_visits (page_key);

revoke all on public.page_visits from anon, authenticated;
grant insert on public.page_visits to anon, authenticated;
grant select, delete on public.page_visits to authenticated;

drop policy if exists "Public can insert page visits" on public.page_visits;
create policy "Public can insert page visits"
on public.page_visits for insert
to anon, authenticated
with check (
  page_key in ('home', 'about', 'president', 'projects', 'bunin', 'gallery', 'contact', 'cookies', 'privacy', 'legal')
  and length(page_path) between 1 and 300
  and language in ('fr', 'en', 'ru', 'de', 'it', 'ar', 'es')
  and (session_id is null or length(session_id) <= 120)
  and (referrer is null or length(referrer) <= 160)
);

drop policy if exists "Editors can read page visits" on public.page_visits;
create policy "Editors can read page visits"
on public.page_visits for select
to authenticated
using (exists (select 1 from public.site_admins where site_admins.user_id = (select auth.uid())));

drop policy if exists "Editors can delete page visits" on public.page_visits;
create policy "Editors can delete page visits"
on public.page_visits for delete
to authenticated
using (exists (select 1 from public.site_admins where site_admins.user_id = (select auth.uid())));
