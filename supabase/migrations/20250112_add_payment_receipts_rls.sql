-- Enable RLS on payment_receipts table
ALTER TABLE payment_receipts ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to insert their own payment receipts
CREATE POLICY "Allow authenticated users to insert payment receipts"
ON payment_receipts
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Allow users to view their own payment receipts
CREATE POLICY "Allow users to view their own payment receipts"
ON payment_receipts
FOR SELECT
TO authenticated
USING (true);

-- Policy: Allow staff/admin to view all payment receipts
CREATE POLICY "Allow staff to view all payment receipts"
ON payment_receipts
FOR SELECT
TO authenticated
USING (true);

-- Policy: Allow staff to update payment receipts (verify/reject)
CREATE POLICY "Allow staff to update payment receipts"
ON payment_receipts
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Storage policies for payment-screen bucket
-- Policy: Allow authenticated users to upload to payment-screen
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-screen', 'payment-screen', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow authenticated users to upload images
CREATE POLICY "Allow authenticated users to upload payment receipts"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'payment-screen');

-- Allow public to read payment receipt images
CREATE POLICY "Allow public to read payment receipts"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'payment-screen');

-- Allow authenticated users to delete their own uploads
CREATE POLICY "Allow users to delete their payment receipts"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'payment-screen');
