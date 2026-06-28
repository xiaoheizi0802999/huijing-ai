create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;
revoke all on schema private from public;
revoke all on schema private from anon, authenticated;

create table public.users_profile (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references auth.users(id) on delete cascade,
  credits integer not null default 0 check (credits >= 0),
  last_daily_credit_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.generation_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  request_id uuid unique not null,
  original_input jsonb not null,
  optimized_prompt text not null,
  image_url text not null,
  storage_path text not null,
  image_type text not null,
  style text not null,
  aspect_ratio text not null,
  cost_credits integer not null default 1 check (cost_credits > 0),
  created_at timestamptz not null default now()
);

create table public.credit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  change_amount integer not null,
  reason text not null check (
    reason in (
      'daily_grant',
      'generation_reserve',
      'generation_charge',
      'generation_refund'
    )
  ),
  related_generation_id uuid references public.generation_history(id) on delete set null,
  request_id uuid,
  created_at timestamptz not null default now()
);

create table public.generation_requests (
  id uuid primary key default gen_random_uuid(),
  request_id uuid unique not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null check (status in ('processing', 'succeeded', 'failed')),
  reserved_credits integer not null default 0 check (reserved_credits in (0, 1)),
  generation_id uuid references public.generation_history(id) on delete set null,
  error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index generation_history_user_created_idx
  on public.generation_history(user_id, created_at desc);
create index credit_logs_user_created_idx
  on public.credit_logs(user_id, created_at desc);
create index credit_logs_related_generation_idx
  on public.credit_logs(related_generation_id);
create index generation_requests_user_created_idx
  on public.generation_requests(user_id, created_at desc);
create index generation_requests_generation_idx
  on public.generation_requests(generation_id);

alter table public.users_profile enable row level security;
alter table public.generation_history enable row level security;
alter table public.credit_logs enable row level security;
alter table public.generation_requests enable row level security;

grant select on public.users_profile, public.generation_history, public.credit_logs
  to authenticated;
revoke all on public.generation_requests from anon, authenticated;

create policy "users read own profile"
on public.users_profile for select to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "users read own generations"
on public.generation_history for select to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "users read own credit logs"
on public.credit_logs for select to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create or replace function private.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_users_profile_updated_at
before update on public.users_profile
for each row execute function private.set_updated_at();

create trigger set_generation_requests_updated_at
before update on public.generation_requests
for each row execute function private.set_updated_at();

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_today date := (now() at time zone 'Asia/Shanghai')::date;
begin
  insert into public.users_profile (
    user_id,
    credits,
    last_daily_credit_date
  )
  values (new.id, 5, v_today)
  on conflict (user_id) do nothing;

  if found then
    insert into public.credit_logs (
      user_id,
      change_amount,
      reason
    )
    values (new.id, 5, 'daily_grant');
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

create or replace function private.claim_daily_credits(p_user_id uuid)
returns table(credits integer, granted integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_today date := (now() at time zone 'Asia/Shanghai')::date;
  v_profile public.users_profile%rowtype;
  v_granted integer := 0;
begin
  if p_user_id is null then
    raise exception 'user id is required';
  end if;

  insert into public.users_profile (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;

  select *
  into v_profile
  from public.users_profile
  where user_id = p_user_id
  for update;

  if not found then
    raise exception 'user profile not found';
  end if;

  if v_profile.last_daily_credit_date is null
     or v_profile.last_daily_credit_date < v_today then
    update public.users_profile
    set credits = public.users_profile.credits + 5,
        last_daily_credit_date = v_today
    where user_id = p_user_id
    returning * into v_profile;

    insert into public.credit_logs (
      user_id,
      change_amount,
      reason
    )
    values (p_user_id, 5, 'daily_grant');

    v_granted := 5;
  end if;

  return query select v_profile.credits, v_granted;
end;
$$;

create or replace function private.reserve_generation(
  p_user_id uuid,
  p_request_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request public.generation_requests%rowtype;
  v_credits integer;
  v_request_exists boolean := false;
begin
  if p_user_id is null or p_request_id is null then
    raise exception 'user id and request id are required';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_request_id::text, 0));
  perform private.claim_daily_credits(p_user_id);

  select *
  into v_request
  from public.generation_requests
  where request_id = p_request_id
  for update;
  v_request_exists := found;

  if v_request_exists and v_request.user_id <> p_user_id then
    raise exception 'request owner mismatch';
  end if;

  select credits
  into v_credits
  from public.users_profile
  where user_id = p_user_id
  for update;

  if v_request_exists and v_request.status = 'succeeded' then
    return jsonb_build_object(
      'state', 'succeeded',
      'generationId', v_request.generation_id,
      'credits', v_credits
    );
  end if;

  if v_request_exists and v_request.status = 'processing' then
    return jsonb_build_object(
      'state', 'processing',
      'credits', v_credits
    );
  end if;

  if v_credits < 1 then
    return jsonb_build_object(
      'state', 'insufficient',
      'credits', v_credits
    );
  end if;

  update public.users_profile
  set credits = credits - 1
  where user_id = p_user_id
  returning credits into v_credits;

  if v_request_exists then
    update public.generation_requests
    set status = 'processing',
        reserved_credits = 1,
        generation_id = null,
        error_code = null
    where request_id = p_request_id;
  else
    insert into public.generation_requests (
      request_id,
      user_id,
      status,
      reserved_credits
    )
    values (p_request_id, p_user_id, 'processing', 1);
  end if;

  insert into public.credit_logs (
    user_id,
    change_amount,
    reason,
    request_id
  )
  values (p_user_id, -1, 'generation_reserve', p_request_id);

  return jsonb_build_object(
    'state', 'reserved',
    'credits', v_credits
  );
end;
$$;

create or replace function private.complete_generation(
  p_user_id uuid,
  p_request_id uuid,
  p_generation_id uuid,
  p_original_input jsonb,
  p_optimized_prompt text,
  p_image_url text,
  p_storage_path text,
  p_image_type text,
  p_style text,
  p_aspect_ratio text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request public.generation_requests%rowtype;
begin
  if p_user_id is null or p_request_id is null or p_generation_id is null then
    raise exception 'user id, request id and generation id are required';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_request_id::text, 0));

  select *
  into v_request
  from public.generation_requests
  where request_id = p_request_id
  for update;

  if not found then
    raise exception 'generation request not found';
  end if;

  if v_request.user_id <> p_user_id then
    raise exception 'request owner mismatch';
  end if;

  if v_request.status = 'succeeded' then
    return v_request.generation_id;
  end if;

  if v_request.status <> 'processing'
     or v_request.reserved_credits <> 1 then
    raise exception 'generation request is not reserved';
  end if;

  insert into public.generation_history (
    id,
    user_id,
    request_id,
    original_input,
    optimized_prompt,
    image_url,
    storage_path,
    image_type,
    style,
    aspect_ratio,
    cost_credits
  )
  values (
    p_generation_id,
    p_user_id,
    p_request_id,
    p_original_input,
    p_optimized_prompt,
    p_image_url,
    p_storage_path,
    p_image_type,
    p_style,
    p_aspect_ratio,
    1
  );

  update public.credit_logs
  set reason = 'generation_charge',
      related_generation_id = p_generation_id
  where id = (
    select id
    from public.credit_logs
    where user_id = p_user_id
      and request_id = p_request_id
      and reason = 'generation_reserve'
      and related_generation_id is null
    order by created_at desc
    limit 1
  );

  update public.generation_requests
  set status = 'succeeded',
      reserved_credits = 0,
      generation_id = p_generation_id,
      error_code = null
  where request_id = p_request_id;

  return p_generation_id;
end;
$$;

create or replace function private.fail_generation(
  p_user_id uuid,
  p_request_id uuid,
  p_error_code text
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request public.generation_requests%rowtype;
  v_credits integer;
begin
  if p_user_id is null or p_request_id is null then
    raise exception 'user id and request id are required';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_request_id::text, 0));

  select *
  into v_request
  from public.generation_requests
  where request_id = p_request_id
  for update;

  if not found then
    select credits
    into v_credits
    from public.users_profile
    where user_id = p_user_id;

    return coalesce(v_credits, 0);
  end if;

  if v_request.user_id <> p_user_id then
    raise exception 'request owner mismatch';
  end if;

  if v_request.status = 'processing'
     and v_request.reserved_credits = 1 then
    update public.users_profile
    set credits = credits + 1
    where user_id = p_user_id
    returning credits into v_credits;

    insert into public.credit_logs (
      user_id,
      change_amount,
      reason,
      request_id
    )
    values (p_user_id, 1, 'generation_refund', p_request_id);

    update public.generation_requests
    set status = 'failed',
        reserved_credits = 0,
        error_code = left(coalesce(p_error_code, 'UNKNOWN'), 80)
    where request_id = p_request_id;
  else
    select credits
    into v_credits
    from public.users_profile
    where user_id = p_user_id;

    if v_request.status = 'processing' then
      update public.generation_requests
      set status = 'failed',
          error_code = left(coalesce(p_error_code, 'UNKNOWN'), 80)
      where request_id = p_request_id;
    end if;
  end if;

  return coalesce(v_credits, 0);
end;
$$;

revoke all on all functions in schema private from public, anon, authenticated;
grant usage on schema private to service_role;
grant execute on all functions in schema private to service_role;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'generations',
  'generations',
  false,
  52428800,
  array['image/png', 'image/jpeg', 'image/webp', 'image/avif']
)
on conflict (id) do update
set name = excluded.name,
    public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;
