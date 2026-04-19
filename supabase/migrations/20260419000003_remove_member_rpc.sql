-- RPC para desvincular miembro. SECURITY DEFINER bypasea RLS,
-- la autorización se valida dentro de la función.

create or replace function public.remove_company_member(p_member_id uuid)
returns void
language plpgsql security definer
as $$
declare
  v_company_id uuid;
  v_role       public.member_role;
begin
  select company_id, role
    into v_company_id, v_role
    from public.company_members
   where id = p_member_id;

  if not found then
    raise exception 'Miembro no encontrado.';
  end if;

  if v_role = 'admin' then
    raise exception 'No se puede desvincular a un admin.';
  end if;

  if not exists (
    select 1 from public.company_members
     where company_id = v_company_id
       and user_id = auth.uid()
       and role = 'admin'
  ) then
    raise exception 'Sin permiso para desvincular este miembro.';
  end if;

  delete from public.company_members where id = p_member_id;
end;
$$;
