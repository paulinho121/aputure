-- Add complement column to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS complement TEXT;
