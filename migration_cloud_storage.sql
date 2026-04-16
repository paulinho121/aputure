-- Create the storage bucket for the cloud files
INSERT INTO storage.buckets (id, name, public)
VALUES ('aputure-cloud', 'aputure-cloud', true)
ON CONFLICT (id) DO NOTHING;

-- Set up access policies for the bucket
-- Allow public read access to the files
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'aputure-cloud' );

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'aputure-cloud' );

-- Allow authenticated users to delete files (Admin behavior restricted in frontend)
CREATE POLICY "Authenticated Delete"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'aputure-cloud' );
