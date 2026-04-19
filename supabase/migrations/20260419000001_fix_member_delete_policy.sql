-- Fix: RLS delete policy en company_members usaba subquery recursivo.
-- Reemplazamos con una función SECURITY DEFINER que bypasea RLS.

create or replace function public.is_company_admin(p_company_id uuid)
returns boolean
language sql security definer stable
as $$
  select exists (
    select 1 from public.company_members
    where company_id = p_company_id
      and user_id = auth.uid()
      and role = 'admin'
  )
$$;

drop policy if exists "company_members: admin elimina miembros no-admin" on public.company_members;

create policy "company_members: admin elimina miembros no-admin"
  on public.company_members for delete
  using (
    role != 'admin'
    and public.is_company_admin(company_id)
  );
