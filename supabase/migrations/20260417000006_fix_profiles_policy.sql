-- Función security definer para verificar si el admin comparte company con un usuario
-- Bypasea RLS en company_members para evitar recursión
create or replace function public.admin_shares_company(member_user_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.company_members cm
    join public.company_members admin_m
      on admin_m.company_id = cm.company_id
      and admin_m.user_id = auth.uid()
      and admin_m.role = 'admin'
    where cm.user_id = member_user_id
  )
$$;

-- Policy que permite al admin leer perfiles de miembros de su company
create policy "profiles: admin lee perfiles de su company"
  on public.profiles for select
  using (public.admin_shares_company(id));
