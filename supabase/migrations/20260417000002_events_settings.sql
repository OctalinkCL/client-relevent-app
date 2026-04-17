alter table public.events
  add column flyer_url  text,
  add column is_public  boolean not null default true,
  add column status     text    not null default 'published';

-- Admins pueden actualizar eventos de su company
create policy "events: admins editan eventos"
  on public.events for update
  using (
    exists (
      select 1 from public.company_members
      where company_id = events.company_id
        and user_id = auth.uid() and role = 'admin'
    )
  );
