-- Letter wall database (letters.html).
-- Run this once in Supabase → SQL Editor, and enable Authentication → Sign In / Providers → "Anonymous sign-ins".

create table if not exists public.letters (
    id          bigint generated always as identity primary key,
    user_id     uuid not null unique default auth.uid() references auth.users (id) on delete cascade,  -- one letter per visitor
    name        text not null check (char_length(btrim(name)) between 1 and 40),
    message     text not null check (char_length(btrim(message)) between 1 and 1000),
    created_at  timestamptz not null default now()
);

alter table public.letters enable row level security;

-- Everyone can read the wall.
drop policy if exists "letters are public" on public.letters;
create policy "letters are public"
    on public.letters for select
    using (true);

-- A signed-in (anonymous) visitor can add exactly one letter, only as themselves.
-- The unique(user_id) constraint above blocks a second one.
drop policy if exists "visitors add their own letter" on public.letters;
create policy "visitors add their own letter"
    on public.letters for insert
    to authenticated
    with check (user_id = auth.uid());

-- No update/delete policies: letters can't be edited or removed from the site.
-- You can still delete unwanted letters yourself in Table Editor → letters.
