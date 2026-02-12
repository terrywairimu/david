-- Auto-create app_user_profiles when a new user signs up (email or Google OAuth)
-- Run this in Supabase SQL Editor if Google sign-ups don't get profiles loaded
-- This trigger runs server-side with elevated privileges, bypassing RLS

-- Ensure app_user_profiles table exists (adjust columns to match your schema)
-- If the table doesn't exist, create it first - check your existing schema

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  provider_val text;
BEGIN
  -- Determine provider from auth.users or auth.identities
  provider_val := COALESCE(
    NEW.raw_app_meta_data->>'provider',
    (SELECT i.provider FROM auth.identities i WHERE i.user_id = NEW.id LIMIT 1),
    'email'
  );
  IF provider_val IS NULL OR provider_val = '' THEN
    provider_val := 'email';
  END IF;
  IF provider_val != 'google' THEN
    provider_val := 'email';
  END IF;

  INSERT INTO public.app_user_profiles (id, email, full_name, avatar_url, provider)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url',
    provider_val::text
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_app_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_app_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();
