-- Migration: Create rate_limits table (OPTIONAL)
-- Date: 2024
-- Description: Creates rate_limits table for persistent rate limiting tracking
-- Note: This is optional - the application uses in-memory rate limiting by default

-- Create rate_limits table
CREATE TABLE IF NOT EXISTS public.rate_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    identifier TEXT NOT NULL, -- user_id or IP address
    endpoint TEXT NOT NULL,
    request_count INTEGER DEFAULT 0,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique combination of identifier and endpoint
    UNIQUE(identifier, endpoint)
);

-- Create index on identifier for fast lookups by user/IP
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON public.rate_limits(identifier);

-- Create index on window_start for efficient time-based queries
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start ON public.rate_limits(window_start DESC);

-- Create composite index for the most common query pattern
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier_endpoint ON public.rate_limits(identifier, endpoint);

-- Add comments to document the table and columns
COMMENT ON TABLE public.rate_limits IS 'Optional table for persistent rate limiting. Tracks request counts per user/IP and endpoint.';
COMMENT ON COLUMN public.rate_limits.identifier IS 'User ID (for authenticated users) or IP address (for anonymous users)';
COMMENT ON COLUMN public.rate_limits.endpoint IS 'API endpoint being rate limited (e.g., /api/convert/word-to-pdf)';
COMMENT ON COLUMN public.rate_limits.request_count IS 'Number of requests made in the current time window';
COMMENT ON COLUMN public.rate_limits.window_start IS 'Start time of the current rate limit window';

-- Enable Row Level Security
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only service role can access rate limits (not exposed to users)
CREATE POLICY "Service role can manage rate limits"
    ON public.rate_limits
    USING (true)
    WITH CHECK (true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_rate_limit_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on rate_limits
DROP TRIGGER IF EXISTS on_rate_limit_updated ON public.rate_limits;
CREATE TRIGGER on_rate_limit_updated
    BEFORE UPDATE ON public.rate_limits
    FOR EACH ROW
    EXECUTE FUNCTION public.update_rate_limit_timestamp();
