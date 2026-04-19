-- Fix v2: is_company_admin retornaba false. Usar admin_shares_company que ya
-- funciona en la policy de profiles (probado en producción).

drop policy if exists "company_members: admin elimina miembros no-admin" on public.company_members;

create policy "company_members: admin elimina miembros no-admin"
  on public.company_members for delete
  using (
    role != 'admin'
    and public.admin_shares_company(user_id)
  );
