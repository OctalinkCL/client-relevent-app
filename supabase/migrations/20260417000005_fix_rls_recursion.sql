-- Drop circular policies que causan 500 en todas las queries
drop policy if exists "company_members: admin lee miembros de su company" on public.company_members;
drop policy if exists "profiles: admin lee perfiles de su company" on public.profiles;

-- Security definer functions para bypasear RLS sin recursión
-- El admin puede listar miembros de su company
create or replace function public.list_company_members(p_company_id uuid)
returns table (
  id uuid,
  user_id uuid,
  company_id uuid,
  role public.member_role,
  created_at timestamptz,
  full_name text,
  avatar_url text
)
language sql
security definer
stable
as $$
  select
    cm.id, cm.user_id, cm.company_id, cm.role, cm.created_at,
    p.full_name, p.avatar_url
  from public.company_members cm
  join public.profiles p on p.id = cm.user_id
  where cm.company_id = p_company_id
    and exists (
      select 1 from public.company_members admin_check
      where admin_check.company_id = p_company_id
        and admin_check.user_id = auth.uid()
        and admin_check.role = 'admin'
    )
$$;

-- El admin puede listar solicitudes pendientes de su company
create or replace function public.list_member_requests(p_company_id uuid)
returns table (
  id uuid,
  user_id uuid,
  company_id uuid,
  requested_at timestamptz,
  full_name text,
  avatar_url text
)
language sql
security definer
stable
as $$
  select
    mr.id, mr.user_id, mr.company_id, mr.requested_at,
    p.full_name, p.avatar_url
  from public.member_requests mr
  join public.profiles p on p.id = mr.user_id
  where mr.company_id = p_company_id
    and exists (
      select 1 from public.company_members admin_check
      where admin_check.company_id = p_company_id
        and admin_check.user_id = auth.uid()
        and admin_check.role = 'admin'
    )
$$;
