create table public.events (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  name        text not null,
  starts_at   timestamptz not null,
  ends_at     timestamptz not null,
  created_by  uuid not null references public.profiles(id),
  created_at  timestamptz not null default now()
);

alter table public.events enable row level security;

create policy "events: miembros leen eventos de su company"
  on public.events for select
  using (
    exists (
      select 1 from public.company_members
      where company_id = events.company_id and user_id = auth.uid()
    )
  );

create policy "events: admins crean eventos"
  on public.events for insert
  with check (
    exists (
      select 1 from public.company_members
      where company_id = events.company_id
        and user_id = auth.uid() and role = 'admin'
    )
  );
