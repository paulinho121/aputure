-- Migration to unify parts tables into a single 'parts' table
-- Updated to handle duplicate codes by scoping uniqueness to (code, manufacturer)

-- 1. Add new columns to 'parts' table
ALTER TABLE public.parts 
ADD COLUMN IF NOT EXISTS manufacturer text DEFAULT 'Aputure',
ADD COLUMN IF NOT EXISTS units_per_package integer DEFAULT 1;

-- 2. Update existing parts to be 'Aputure' (if not already set)
UPDATE public.parts SET manufacturer = 'Aputure' WHERE manufacturer IS NULL;

-- 3. Modify Unique Constraint to allow same code for different manufacturers
-- Drop the existing unique constraint on specific 'code' if it exists.
-- Note: The constraint name 'parts_code_key' is standard, but if it differs, this might fail.
ALTER TABLE public.parts DROP CONSTRAINT IF EXISTS parts_code_key;

-- Create a new unique constraint on (code, manufacturer)
-- This allows '123' for Aputure and '123' for Astera to coexist.
ALTER TABLE public.parts ADD CONSTRAINT parts_code_manufacturer_key UNIQUE (code, manufacturer);


-- 4. Copy Astera parts to main table
INSERT INTO public.parts (
    id, name, code, category, quantity, min_stock, price, 
    location, image_url, created_at, manufacturer, units_per_package
)
SELECT 
    id, name, code, category, quantity, min_stock, price, 
    location, image_url, created_at, 'Astera', units_per_package 
FROM public.astera_parts
ON CONFLICT (id) DO NOTHING; -- Avoid duplicates if running multiple times

-- 5. Copy Cream Source parts to main table
INSERT INTO public.parts (
    id, name, code, category, quantity, min_stock, price, 
    location, image_url, created_at, manufacturer, units_per_package
)
SELECT 
    id, name, code, category, quantity, min_stock, price, 
    location, image_url, created_at, 'Cream Source', units_per_package 
FROM public.cream_source_parts
ON CONFLICT (id) DO NOTHING;
