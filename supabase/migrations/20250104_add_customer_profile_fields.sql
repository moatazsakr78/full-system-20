-- Add governorate and profile_image_url columns to customers table
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS governorate TEXT,
ADD COLUMN IF NOT EXISTS profile_image_url TEXT;

-- Create storage bucket for customer profile images if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('customer-profiles', 'customer-profiles', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for customer profile images
CREATE POLICY "Anyone can view customer profile images"
ON storage.objects FOR SELECT
USING (bucket_id = 'customer-profiles');

CREATE POLICY "Authenticated users can upload profile images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'customer-profiles'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own profile images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'customer-profiles'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'customer-profiles'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own profile images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'customer-profiles'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
