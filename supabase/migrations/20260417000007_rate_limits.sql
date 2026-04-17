-- Limita solicitudes de join a máximo 10 pendientes por usuario
create or replace function public.check_request_limit()
returns trigger
language plpgsql
as $$
begin
  if (
    select count(*) from public.member_requests
    where user_id = new.user_id
  ) >= 10 then
    raise exception 'Demasiadas solicitudes pendientes. Espera a ser aceptado o rechazado antes de enviar más.';
  end if;
  return new;
end;
$$;

create trigger limit_member_requests
  before insert on public.member_requests
  for each row execute procedure public.check_request_limit();
