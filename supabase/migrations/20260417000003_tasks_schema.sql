-- ============================================================
-- Tasks module
-- ============================================================

create table public.tasks (
  id                uuid primary key default gen_random_uuid(),
  event_id          uuid not null references public.events(id) on delete cascade,
  company_id        uuid not null references public.companies(id) on delete cascade,
  title             text not null,
  description       text,
  flyer_url         text,
  caption_template  text,
  deadline          timestamptz not null,
  created_by        uuid not null references public.profiles(id),
  created_at        timestamptz not null default now()
);

create table public.task_assignments (
  id           uuid primary key default gen_random_uuid(),
  task_id      uuid not null references public.tasks(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  status       text not null default 'pending',
  assigned_at  timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (task_id, user_id)
);

create table public.task_submissions (
  id              uuid primary key default gen_random_uuid(),
  assignment_id   uuid not null references public.task_assignments(id) on delete cascade,
  screenshot_url  text not null,
  observation     text,
  submitted_at    timestamptz not null default now()
);

-- RLS
alter table public.tasks enable row level security;
alter table public.task_assignments enable row level security;
alter table public.task_submissions enable row level security;

-- tasks: miembros leen tareas de su company
create policy "tasks: miembros leen tareas de su company"
  on public.tasks for select
  using (
    exists (
      select 1 from public.company_members
      where company_id = tasks.company_id and user_id = auth.uid()
    )
  );

-- tasks: admins crean y editan tareas
create policy "tasks: admins crean tareas"
  on public.tasks for insert
  with check (
    exists (
      select 1 from public.company_members
      where company_id = tasks.company_id
        and user_id = auth.uid() and role = 'admin'
    )
  );

create policy "tasks: admins editan tareas"
  on public.tasks for update
  using (
    exists (
      select 1 from public.company_members
      where company_id = tasks.company_id
        and user_id = auth.uid() and role = 'admin'
    )
  );

-- task_assignments: seller ve sus propias asignaciones
create policy "task_assignments: seller ve sus asignaciones"
  on public.task_assignments for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.tasks t
      join public.company_members cm on cm.company_id = t.company_id
      where t.id = task_assignments.task_id
        and cm.user_id = auth.uid() and cm.role = 'admin'
    )
  );

create policy "task_assignments: admins crean asignaciones"
  on public.task_assignments for insert
  with check (
    exists (
      select 1 from public.tasks t
      join public.company_members cm on cm.company_id = t.company_id
      where t.id = task_assignments.task_id
        and cm.user_id = auth.uid() and cm.role = 'admin'
    )
  );

create policy "task_assignments: seller actualiza su asignacion"
  on public.task_assignments for update
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.tasks t
      join public.company_members cm on cm.company_id = t.company_id
      where t.id = task_assignments.task_id
        and cm.user_id = auth.uid() and cm.role = 'admin'
    )
  );

-- task_submissions: seller ve sus propias, admin ve todas de su company
create policy "task_submissions: acceso por assignment"
  on public.task_submissions for select
  using (
    exists (
      select 1 from public.task_assignments ta
      where ta.id = task_submissions.assignment_id
        and (
          ta.user_id = auth.uid()
          or exists (
            select 1 from public.tasks t
            join public.company_members cm on cm.company_id = t.company_id
            where t.id = ta.task_id
              and cm.user_id = auth.uid() and cm.role = 'admin'
          )
        )
    )
  );

create policy "task_submissions: seller crea submission"
  on public.task_submissions for insert
  with check (
    exists (
      select 1 from public.task_assignments ta
      where ta.id = task_submissions.assignment_id
        and ta.user_id = auth.uid()
        and ta.status = 'pending'
    )
  );
