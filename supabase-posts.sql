-- Blog posts + post images. Run this in Supabase → SQL Editor (after supabase.sql and supabase-replies.sql).
-- Safe to run again.

-- 0. Admin check (same as in supabase-replies.sql, repeated so this file works on its own)
create table if not exists public.admins (
    user_id uuid primary key references auth.users (id) on delete cascade
);
alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
    select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- 1. Posts
create table if not exists public.posts (
    id          bigint generated always as identity primary key,
    title       text not null check (char_length(btrim(title)) between 1 and 200),
    body        text not null default '' check (char_length(body) <= 20000),
    image_url   text check (image_url is null or (image_url ~ '^https://' and char_length(image_url) <= 1000)),
    published   boolean not null default true,
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);

alter table public.posts enable row level security;

grant select on public.posts to anon, authenticated;
grant insert, update, delete on public.posts to authenticated;

-- Everyone sees published posts; the admin also sees drafts.
drop policy if exists "published posts are public" on public.posts;
create policy "published posts are public"
    on public.posts for select
    using (published or public.is_admin());

-- Only the admin can write.
drop policy if exists "admin adds posts" on public.posts;
create policy "admin adds posts"
    on public.posts for insert
    to authenticated
    with check (public.is_admin());

drop policy if exists "admin edits posts" on public.posts;
create policy "admin edits posts"
    on public.posts for update
    to authenticated
    using (public.is_admin())
    with check (public.is_admin());

drop policy if exists "admin deletes posts" on public.posts;
create policy "admin deletes posts"
    on public.posts for delete
    to authenticated
    using (public.is_admin());

-- 2. Image uploads: a public bucket anyone can view, only the admin can upload to (max 5 MB, images only)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('post-images', 'post-images', true, 5242880, array['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/avif'])
on conflict (id) do update
    set public = true,
        file_size_limit = excluded.file_size_limit,
        allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "admin uploads post images" on storage.objects;
create policy "admin uploads post images"
    on storage.objects for insert
    to authenticated
    with check (bucket_id = 'post-images' and public.is_admin());

drop policy if exists "admin deletes post images" on storage.objects;
create policy "admin deletes post images"
    on storage.objects for delete
    to authenticated
    using (bucket_id = 'post-images' and public.is_admin());
