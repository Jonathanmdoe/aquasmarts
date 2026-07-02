CREATE POLICY "Team members can view their farm"
ON public.farms
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.farm_id = farms.id AND tm.user_id = auth.uid()
  )
);