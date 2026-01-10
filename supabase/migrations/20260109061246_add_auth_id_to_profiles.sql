-- Add auth_id column to profiles table
-- This column links to auth.users(id) for the user_vaults foreign key

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS auth_id uuid REFERENCES auth.users(id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_auth_id ON public.profiles(auth_id);
