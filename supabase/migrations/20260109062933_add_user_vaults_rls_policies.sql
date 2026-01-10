-- Enable Row Level Security on user_vaults
ALTER TABLE public.user_vaults ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own vault data
CREATE POLICY "Users can read own vault"
ON public.user_vaults
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own vault data
CREATE POLICY "Users can insert own vault"
ON public.user_vaults
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own vault data
CREATE POLICY "Users can update own vault"
ON public.user_vaults
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
