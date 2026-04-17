-- ============================================================
-- Migration: Staff Schema
-- Agrega código de company, tabla member_requests y políticas RLS
-- ============================================================

-- Código único de company para generar links de invitación
alter table public.companies
  add column code text unique;

update public.companies
  set code = upper(substring(replace(id::text, '-', ''), 1, 8));

alter table public.companies
  alter column code set not null;

-- Trigger: asignar código al crear una company nueva
create or replace function public.set_company_code()
returns trigger
language plpgsql
as $$
begin
  if new.code is null then
    new.code := upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  end if;
  return new;
end;
$$;

create trigger on_company_created
  before insert on public.companies
  for each row execute procedure public.set_company_code();

-- ------------------------------------------------------------
-- member_requests
-- Solicitudes de sellers para unirse a una company
-- ------------------------------------------------------------
create table public.member_requests (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  company_id   uuid not null references public.companies(id) on delete cascade,
  requested_at timestamptz not null default now(),
  unique (user_id, company_id)
);

alter table public.member_requests enable row level security;

create policy "member_requests: usuario lee sus solicitudes"
  on public.member_requests for select
  using (user_id = auth.uid());

create policy "member_requests: usuario crea solicitudes"
  on public.member_requests for insert
  with check (user_id = auth.uid());

create policy "member_requests: admin lee solicitudes de su company"
  on public.member_requests for select
  using (
    exists (
      select 1 from public.company_members
      where company_id = member_requests.company_id
        and user_id = auth.uid() and role = 'admin'
    )
  );

create policy "member_requests: admin elimina solicitudes de su company"
  on public.member_requests for delete
  using (
    exists (
      select 1 from public.company_members
      where company_id = member_requests.company_id
        and user_id = auth.uid() and role = 'admin'
    )
  );

-- ------------------------------------------------------------
-- company_members: nuevas políticas para admin
-- ------------------------------------------------------------
create policy "company_members: admin agrega miembros"
  on public.company_members for insert
  with check (
    exists (
      select 1 from public.company_members my_m
      where my_m.company_id = company_members.company_id
        and my_m.user_id = auth.uid() and my_m.role = 'admin'
    )
  );

create policy "company_members: admin elimina miembros no-admin"
  on public.company_members for delete
  using (
    role != 'admin'
    and exists (
      select 1 from public.company_members my_m
      where my_m.company_id = company_members.company_id
        and my_m.user_id = auth.uid() and my_m.role = 'admin'
    )
  );

-- companies: cualquiera puede leer por código (para el flujo de /join)
create policy "companies: leer por código público"
  on public.companies for select
  using (true);

-- profiles: admin puede leer perfiles de miembros de su company
create policy "profiles: admin lee perfiles de su company"
  on public.profiles for select
  using (
    exists (
      select 1 from public.company_members cm
      join public.company_members my_m
        on my_m.company_id = cm.company_id
        and my_m.user_id = auth.uid() and my_m.role = 'admin'
      where cm.user_id = profiles.id
    )
  );

-- ------------------------------------------------------------
-- Fix RLS circular reference en company_members (pendiente anterior)
-- ------------------------------------------------------------
drop policy if exists "company_members: ver miembros de mi company" on public.company_members;

create policy "company_members: leer mis propias membresías"
  on public.company_members for select
  using (user_id = auth.uid());

create policy "company_members: admin lee miembros de su company"
  on public.company_members for select
  using (
    exists (
      select 1 from public.company_members my_m
      where my_m.company_id = company_members.company_id
        and my_m.user_id = auth.uid() and my_m.role = 'admin'
    )
  );
