-- Migration: Add status field to files table
-- Date: 2024
-- Description: Adds status column to track active vs deleted files for cleanup job

-- Add status column with check constraint
ALTER TABLE public.files 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' 
CHECK (status IN ('active', 'deleted'));

-- Create index on status for efficient filtering
CREATE INDEX IF NOT EXISTS idx_files_status ON public.files(status);

-- Create composite index on created_at and status for cleanup job queries
CREATE INDEX IF NOT EXISTS idx_files_created_at_status ON public.files(created_at DESC, status);

-- Add comment to document the column
COMMENT ON COLUMN public.files.status IS 'File status: active (available) or deleted (marked for cleanup)';
