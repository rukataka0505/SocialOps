-- Rollback the previous migration and recreate with simpler logic
-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view assignments for their team's tasks" ON public.task_assignments;
DROP POLICY IF EXISTS "Users can insert assignments for their team's tasks" ON public.task_assignments;
DROP POLICY IF EXISTS "Users can update assignments for their team's tasks" ON public.task_assignments;
DROP POLICY IF EXISTS "Users can delete assignments for their team's tasks" ON public.task_assignments;

-- Simpler approach: Just verify the assigned user is a team member
-- This works for both authenticated and guest users
CREATE POLICY "Users can view assignments for their team's tasks"
  ON public.task_assignments FOR SELECT
  USING (
    task_id IN (
      SELECT t.id FROM public.tasks t
      JOIN public.team_members tm ON tm.team_id = t.team_id
      WHERE tm.user_id = COALESCE(auth.uid(), task_assignments.user_id)
    )
  );

CREATE POLICY "Users can insert assignments for their team's tasks"
  ON public.task_assignments FOR INSERT
  WITH CHECK (
    task_id IN (
      SELECT t.id FROM public.tasks t
      JOIN public.team_members tm ON tm.team_id = t.team_id
      WHERE tm.user_id = task_assignments.user_id
    )
  );

CREATE POLICY "Users can update assignments for their team's tasks"
  ON public.task_assignments FOR UPDATE
  USING (
    task_id IN (
      SELECT t.id FROM public.tasks t
      JOIN public.team_members tm ON tm.team_id = t.team_id
      WHERE tm.user_id = task_assignments.user_id
    )
  );

CREATE POLICY "Users can delete assignments for their team's tasks"
  ON public.task_assignments FOR DELETE
  USING (
    task_id IN (
      SELECT t.id FROM public.tasks t
      JOIN public.team_members tm ON tm.team_id = t.team_id
      WHERE tm.user_id = task_assignments.user_id
    )
  );
