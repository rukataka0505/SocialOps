create table if not exists public.task_assignments (
  id uuid default gen_random_uuid() primary key,
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(task_id, user_id)
);

-- Add RLS policies
alter table public.task_assignments enable row level security;

create policy "Users can view assignments for their team's tasks"
  on public.task_assignments for select
  using (
    exists (
      select 1 from public.tasks
      where tasks.id = task_assignments.task_id
      and tasks.team_id in (
        select team_id from public.team_members
        where user_id = auth.uid()
      )
    )
  );

create policy "Users can insert assignments for their team's tasks"
  on public.task_assignments for insert
  with check (
    exists (
      select 1 from public.tasks
      where tasks.id = task_assignments.task_id
      and tasks.team_id in (
        select team_id from public.team_members
        where user_id = auth.uid()
      )
    )
  );

create policy "Users can update assignments for their team's tasks"
  on public.task_assignments for update
  using (
    exists (
      select 1 from public.tasks
      where tasks.id = task_assignments.task_id
      and tasks.team_id in (
        select team_id from public.team_members
        where user_id = auth.uid()
      )
    )
  );

create policy "Users can delete assignments for their team's tasks"
  on public.task_assignments for delete
  using (
    exists (
      select 1 from public.tasks
      where tasks.id = task_assignments.task_id
      and tasks.team_id in (
        select team_id from public.team_members
        where user_id = auth.uid()
      )
    )
  );
