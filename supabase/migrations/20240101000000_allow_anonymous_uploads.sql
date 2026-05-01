-- Migration: Allow Anonymous User Uploads
-- This migration modifies RLS policies to allow anonymous users (auth.uid() IS NULL)
-- to INSERT file and conversion records with user_id = NULL

-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert their own files" ON public.files;
DROP POLICY IF EXISTS "Users can insert their own conversions" ON public.conversions;

-- Recreate files INSERT policy with anonymous user support
CREATE POLICY "Users can insert their own files"
    ON public.files FOR INSERT
    WITH CHECK (auth.uid() = user_id OR (auth.uid() IS NULL AND user_id IS NULL));

-- Recreate conversions INSERT policy with anonymous user support
CREATE POLICY "Users can insert their own conversions"
    ON public.conversions FOR INSERT
    WITH CHECK (auth.uid() = user_id OR (auth.uid() IS NULL AND user_id IS NULL));
