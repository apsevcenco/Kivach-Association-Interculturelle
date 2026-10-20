alter table public.page_visits
  add column if not exists visitor_id text,
  add column if not exists device_type text,
  add column if not exists browser_name text,
  add column if not exists browser_language text;

create index if not exists page_visits_visitor_id_idx
  on public.page_visits (visitor_id);

create index if not exists page_visits_session_id_idx
  on public.page_visits (session_id);

drop policy if exists "Public can insert page visits" on public.page_visits;
create policy "Public can insert page visits"
on public.page_visits for insert
to anon, authenticated
with check (
  page_key in ('home', 'about', 'president', 'projects', 'bunin', 'gallery', 'contact', 'cookies', 'privacy', 'legal')
  and length(page_path) between 1 and 300
  and page_path !~ '^/([a-z]{2}/)?admin(/|$)'
  and language in ('fr', 'en', 'ru', 'de', 'it', 'ar', 'es')
  and (session_id is null or length(session_id) <= 120)
  and (visitor_id is null or length(visitor_id) <= 120)
  and (referrer is null or length(referrer) <= 160)
  and (device_type is null or device_type in ('mobile', 'tablet', 'desktop'))
  and (browser_name is null or length(browser_name) <= 80)
  and (browser_language is null or length(browser_language) <= 35)
);
