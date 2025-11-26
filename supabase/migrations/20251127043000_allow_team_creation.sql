-- Allow authenticated users to insert into teams table
CREATE POLICY "Users can create teams"
ON public.teams
FOR INSERT
TO authenticated
WITH CHECK (true);
