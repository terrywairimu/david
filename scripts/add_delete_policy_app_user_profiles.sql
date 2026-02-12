-- Allow admins to delete user profiles from app_user_profiles
-- Run this in Supabase SQL Editor if not applied via MCP
CREATE POLICY "Admin can delete profiles"
  ON public.app_user_profiles
  FOR DELETE
  TO authenticated
  USING (public.is_current_user_admin());
