-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS TABLE (extends Supabase auth.users)
-- Supabase already provides auth.users table, we'll create a profiles table for additional user data
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- FILES TABLE
CREATE TABLE IF NOT EXISTS public.files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    
    storage_path TEXT NOT NULL,
    storage_bucket TEXT NOT NULL,
    
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'deleted')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CONVERSIONS TABLE
CREATE TABLE IF NOT EXISTS public.conversions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    input_file_id UUID REFERENCES public.files(id) ON DELETE SET NULL,
    output_file_id UUID REFERENCES public.files(id) ON DELETE SET NULL,
    
    conversion_type TEXT NOT NULL,
    
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- INDEXES for better query performance
CREATE INDEX IF NOT EXISTS idx_files_user_id ON public.files(user_id);
CREATE INDEX IF NOT EXISTS idx_files_created_at ON public.files(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_files_status ON public.files(status);
CREATE INDEX IF NOT EXISTS idx_files_created_at_status ON public.files(created_at DESC, status);
CREATE INDEX IF NOT EXISTS idx_conversions_user_id ON public.conversions(user_id);
CREATE INDEX IF NOT EXISTS idx_conversions_created_at ON public.conversions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversions_status ON public.conversions(status);

-- ROW LEVEL SECURITY (RLS) POLICIES

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Files policies
CREATE POLICY "Users can view their own files"
    ON public.files FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own files"
    ON public.files FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own files"
    ON public.files FOR DELETE
    USING (auth.uid() = user_id);

-- Conversions policies
CREATE POLICY "Users can view their own conversions"
    ON public.conversions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversions"
    ON public.conversions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversions"
    ON public.conversions FOR UPDATE
    USING (auth.uid() = user_id);

-- FUNCTIONS

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on profiles
DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
CREATE TRIGGER on_profile_updated
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- STORAGE BUCKETS (Run these in Supabase Dashboard > Storage)
-- You need to create these buckets manually in Supabase Dashboard:
-- 1. uploads (private)
-- 2. converted (private)
-- 3. temp (private)

-- Storage policies will be set in the Supabase Dashboard
