create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null check (char_length(btrim(name)) between 2 and 120),
  email text not null check (char_length(email) between 3 and 254 and email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  message text not null check (char_length(btrim(message)) between 10 and 5000),
  language text not null check (language in ('fr', 'en', 'ru', 'de', 'it', 'ar', 'es')),
  page_path text not null check (char_length(page_path) between 1 and 300 and page_path ~ '^/([a-z]{2}/)?contact/?$'),
  status text not null default 'new' check (status in ('new', 'read')),
  read_at timestamptz,
  check ((status = 'new' and read_at is null) or status = 'read')
);

create index if not exists contact_messages_created_at_idx on public.contact_messages (created_at desc);
create index if not exists contact_messages_status_idx on public.contact_messages (status, created_at desc);

alter table public.contact_messages enable row level security;
revoke all on public.contact_messages from anon, authenticated;
grant insert (name, email, message, language, page_path) on public.contact_messages to anon, authenticated;
grant select, update, delete on public.contact_messages to authenticated;

drop policy if exists "Visitors can send contact messages" on public.contact_messages;
create policy "Visitors can send contact messages"
  on public.contact_messages for insert to anon, authenticated
  with check (
    status = 'new' and read_at is null
    and char_length(btrim(name)) between 2 and 120
    and char_length(email) between 3 and 254
    and email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    and char_length(btrim(message)) between 10 and 5000
    and language in ('fr', 'en', 'ru', 'de', 'it', 'ar', 'es')
    and page_path ~ '^/([a-z]{2}/)?contact/?$'
  );

drop policy if exists "Editors can read contact messages" on public.contact_messages;
create policy "Editors can read contact messages"
  on public.contact_messages for select to authenticated
  using (exists (select 1 from public.site_admins where user_id = (select auth.uid())));

drop policy if exists "Editors can update contact messages" on public.contact_messages;
create policy "Editors can update contact messages"
  on public.contact_messages for update to authenticated
  using (exists (select 1 from public.site_admins where user_id = (select auth.uid())))
  with check (exists (select 1 from public.site_admins where user_id = (select auth.uid())));

drop policy if exists "Editors can delete contact messages" on public.contact_messages;
create policy "Editors can delete contact messages"
  on public.contact_messages for delete to authenticated
  using (exists (select 1 from public.site_admins where user_id = (select auth.uid())));

-- Replace the former demonstration copy in the live CMS document.
update public.site_content
set content = jsonb_set(
  jsonb_set(content, array['text', 'contact.formIntro'], to_jsonb('Présentez-nous votre question, votre idée ou votre proposition. Nous vous répondrons par e-mail.'::text), true),
  array['text', 'contact.formNote'], to_jsonb('Les champs sont obligatoires. Votre adresse sera utilisée uniquement pour vous répondre.'::text), true
)
where id = 1;

update public.site_content set content = jsonb_set(jsonb_set(content, array['translations','en','text','contact.formIntro'], to_jsonb('Tell us about your question, idea, or proposal. We will reply by email.'::text), true), array['translations','en','text','contact.formNote'], to_jsonb('All fields are required. Your address will be used only to reply to your message.'::text), true) where id = 1;
update public.site_content set content = jsonb_set(jsonb_set(content, array['translations','ru','text','contact.formIntro'], to_jsonb('Расскажите о вашем вопросе, идее или предложении. Мы ответим вам по электронной почте.'::text), true), array['translations','ru','text','contact.formNote'], to_jsonb('Все поля обязательны. Ваш адрес будет использован только для ответа на сообщение.'::text), true) where id = 1;
update public.site_content set content = jsonb_set(jsonb_set(content, array['translations','de','text','contact.formIntro'], to_jsonb('Schreiben Sie uns über Ihre Frage, Idee oder Ihren Vorschlag. Wir antworten Ihnen per E-Mail.'::text), true), array['translations','de','text','contact.formNote'], to_jsonb('Alle Felder sind Pflichtfelder. Ihre Adresse wird ausschließlich für unsere Antwort verwendet.'::text), true) where id = 1;
update public.site_content set content = jsonb_set(jsonb_set(content, array['translations','it','text','contact.formIntro'], to_jsonb('Raccontaci la tua domanda, idea o proposta. Ti risponderemo via e-mail.'::text), true), array['translations','it','text','contact.formNote'], to_jsonb('Tutti i campi sono obbligatori. Il tuo indirizzo sarà utilizzato solo per rispondere al messaggio.'::text), true) where id = 1;
update public.site_content set content = jsonb_set(jsonb_set(content, array['translations','ar','text','contact.formIntro'], to_jsonb('اكتبوا لنا عن سؤالكم أو فكرتكم أو مقترحكم، وسنرد عليكم عبر البريد الإلكتروني.'::text), true), array['translations','ar','text','contact.formNote'], to_jsonb('جميع الحقول إلزامية. سيُستخدم عنوانكم فقط للرد على الرسالة.'::text), true) where id = 1;
update public.site_content set content = jsonb_set(jsonb_set(content, array['translations','es','text','contact.formIntro'], to_jsonb('Cuéntanos tu pregunta, idea o propuesta. Te responderemos por correo electrónico.'::text), true), array['translations','es','text','contact.formNote'], to_jsonb('Todos los campos son obligatorios. Tu dirección se utilizará únicamente para responder al mensaje.'::text), true) where id = 1;
