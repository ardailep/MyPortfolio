-- Replies for the letter wall. Run this in Supabase → SQL Editor (after supabase.sql).
-- Safe to run again: it only adds what's missing (e.g. the GIF column added later).
-- Before running: create your admin account in Authentication → Users → "Add user" (email + password,
-- tick "Auto Confirm User"), then put that email in the last statement below.

-- 1. Reply columns on letters
alter table public.letters
    add column if not exists reply      text check (reply is null or char_length(reply) <= 1000),
    add column if not exists replied_at timestamptz,
    add column if not exists reply_gif  text check (reply_gif is null or (reply_gif ~ '^https://' and char_length(reply_gif) <= 500));

-- 2. Who counts as admin
create table if not exists public.admins (
    user_id uuid primary key references auth.users (id) on delete cascade
);
alter table public.admins enable row level security;

drop policy if exists "admins can see themselves" on public.admins;
create policy "admins can see themselves"
    on public.admins for select
    to authenticated
    using (user_id = auth.uid());

create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
    select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- 3. Column permissions: visitors may only write name + message; only the reply columns can ever be updated
revoke insert, update on public.letters from anon, authenticated;
grant insert (name, message) on public.letters to authenticated;
grant update (reply, reply_gif, replied_at) on public.letters to authenticated;

-- 4. Only admins can write replies
drop policy if exists "admin can reply" on public.letters;
create policy "admin can reply"
    on public.letters for update
    to authenticated
    using (public.is_admin())
    with check (public.is_admin());

-- 5. Make your account an admin (replace the email with the one you created in step 0)
insert into public.admins (user_id)
select id from auth.users where email = 'teoman.33.canbaz@gmail.com'
on conflict do nothing;
