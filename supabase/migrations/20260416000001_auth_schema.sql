-- ============================================================
-- Migration: Auth Schema
-- Tablas: profiles, companies, company_members, company_features
-- ============================================================

-- Tipos enumerados
create type public.user_role as enum ('superadmin', 'admin', 'seller', 'door');
create type public.company_type as enum ('venue', 'producer');
create type public.company_plan as enum ('starter', 'pro', 'enterprise');
create type public.member_role as enum ('admin', 'seller', 'door');
create type public.feature_name as enum ('tasks', 'events', 'access', 'analytics');

-- ------------------------------------------------------------
-- profiles
-- Extiende auth.users. Se crea automáticamente al registrar
-- un nuevo usuario via trigger.
-- ------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null,
  avatar_url  text,
  role        public.user_role not null default 'seller',
  created_at  timestamptz not null default now()
);

-- Trigger: crea el profile automáticamente al crear un auth.user
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ------------------------------------------------------------
-- companies
-- ------------------------------------------------------------
create table public.companies (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  type        public.company_type not null default 'venue',
  plan        public.company_plan not null default 'starter',
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------
-- company_members
-- Un usuario puede pertenecer a N companies con roles distintos
-- ------------------------------------------------------------
create table public.company_members (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  company_id  uuid not null references public.companies(id) on delete cascade,
  role        public.member_role not null default 'seller',
  created_at  timestamptz not null default now(),
  unique (user_id, company_id)
);

-- ------------------------------------------------------------
-- company_features
-- Overrides del plan: superadmin puede habilitar/deshabilitar
-- módulos específicos por company, fuera de lo que define el plan.
-- ------------------------------------------------------------
create table public.company_features (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  feature     public.feature_name not null,
  is_enabled  boolean not null default true,
  unique (company_id, feature)
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.company_members enable row level security;
alter table public.company_features enable row level security;

-- profiles: cada usuario lee/edita solo su propio perfil
create policy "profiles: usuario lee su propio perfil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: usuario edita su propio perfil"
  on public.profiles for update
  using (auth.uid() = id);

-- companies: un usuario ve las companies a las que pertenece
create policy "companies: miembro puede leer su company"
  on public.companies for select
  using (
    exists (
      select 1 from public.company_members
      where company_members.company_id = companies.id
        and company_members.user_id = auth.uid()
    )
  );

-- company_members: un usuario ve los miembros de sus companies
create policy "company_members: ver miembros de mi company"
  on public.company_members for select
  using (
    exists (
      select 1 from public.company_members as my_membership
      where my_membership.company_id = company_members.company_id
        and my_membership.user_id = auth.uid()
    )
  );

-- company_features: miembros de la company pueden leer sus features
create policy "company_features: miembro puede leer features de su company"
  on public.company_features for select
  using (
    exists (
      select 1 from public.company_members
      where company_members.company_id = company_features.company_id
        and company_members.user_id = auth.uid()
    )
  );
