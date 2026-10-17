-- Visitor counter: one visitor per IP address. Run this once in Supabase → SQL Editor.
-- IPs are never stored in plain text — only a SHA-256 hash, so the table can count but not list addresses.

create table if not exists public.visitors (
    ip_hash    text primary key,
    first_seen timestamptz not null default now()
);

-- Nobody can read or write the table directly; only the function below touches it.
alter table public.visitors enable row level security;
revoke all on public.visitors from anon, authenticated;

-- Records the caller's IP (if new) and returns the total number of unique visitors.
create or replace function public.register_visit()
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
    headers json := coalesce(nullif(current_setting('request.headers', true), '')::json, '{}'::json);
    ip text;
begin
    ip := btrim(coalesce(
        headers->>'cf-connecting-ip',
        split_part(headers->>'x-forwarded-for', ',', 1),
        headers->>'x-real-ip',
        ''
    ));

    if ip <> '' then
        insert into public.visitors (ip_hash)
        values (encode(sha256(convert_to('swaxilep:' || ip, 'UTF8')), 'hex'))
        on conflict do nothing;
    end if;

    return (select count(*) from public.visitors);
end;
$$;

revoke all on function public.register_visit() from public;
grant execute on function public.register_visit() to anon, authenticated;
