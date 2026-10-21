-- Editable profile content (about, experience, education, skills, contact links…), edited from /admin → Profile.
-- Run this in Supabase → SQL Editor (after supabase-replies.sql, which creates the admins table). Safe to run again.

create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
    select exists (select 1 from public.admins where user_id = auth.uid());
$$;

create table if not exists public.site_content (
    key         text primary key check (char_length(key) between 1 and 40),
    data        jsonb not null default '{}'::jsonb check (pg_column_size(data) <= 200000),
    updated_at  timestamptz not null default now()
);

alter table public.site_content enable row level security;

grant select on public.site_content to anon, authenticated;
grant insert, update on public.site_content to authenticated;

-- Everyone can read the profile; only the admin can change it.
drop policy if exists "site content is public" on public.site_content;
create policy "site content is public"
    on public.site_content for select
    using (true);

drop policy if exists "admin adds site content" on public.site_content;
create policy "admin adds site content"
    on public.site_content for insert
    to authenticated
    with check (public.is_admin());

drop policy if exists "admin edits site content" on public.site_content;
create policy "admin edits site content"
    on public.site_content for update
    to authenticated
    using (public.is_admin())
    with check (public.is_admin());
