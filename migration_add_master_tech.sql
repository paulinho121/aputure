-- Migration to support Master users and elevate assistenciatecnica@mcistore.com.br
-- This script ensures the profiles table exists and sets the master flag.

-- 1. Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE,
    is_master BOOLEAN DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create policies for profiles
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Profiles are viewable by everyone') THEN
        CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can update own profile') THEN
        CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
    END IF;
END $$;

-- 4. Create a function to handle new user signups and create a profile
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email)
    VALUES (new.id, new.email);
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create the trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
        CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    END IF;
END $$;

-- 6. Elevate requested emails to master level
DO $$
DECLARE
    u_email TEXT;
    u_id UUID;
    emails_to_elevate TEXT[] := ARRAY['assistenciatecnica@mcistore.com.br', 'jonathan@mcistore.com.br'];
BEGIN
    FOREACH u_email IN ARRAY emails_to_elevate
    LOOP
        SELECT id INTO u_id FROM auth.users WHERE email = u_email;
        
        IF u_id IS NOT NULL THEN
            -- Ensure profile exists and is master
            INSERT INTO public.profiles (id, email, is_master)
            VALUES (u_id, u_email, true)
            ON CONFLICT (id) DO UPDATE SET is_master = true;
            
            RAISE NOTICE 'User % elevated to master.', u_email;
        ELSE
            RAISE NOTICE 'User % not found in auth.users. Skipping.', u_email;
        END IF;
    END LOOP;
END $$;
