-- Migration: Add deleted_at column to tasks table
-- Date: 2025-11-26
-- Purpose: Fix missing deleted_at column and relax client_id constraint

-- 1. Add deleted_at column for soft delete support
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 2. Make client_id nullable to support manual tasks without clients
-- Note: This should already be nullable based on the schema, but we ensure it here
ALTER TABLE public.tasks 
ALTER COLUMN client_id DROP NOT NULL;

-- Reload PostgREST cache
NOTIFY pgrst, 'reload config';
