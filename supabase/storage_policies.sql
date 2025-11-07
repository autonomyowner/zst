-- Storage Policies for product_images bucket
-- NOTE: Storage policies cannot be created via SQL due to permissions
-- You MUST create them through the Supabase Dashboard UI
-- See STORAGE_SETUP.md for detailed instructions

-- This file is for reference only - the policies below show what needs to be created
-- but must be done through Dashboard → Storage → Policies

-- Reference Policies (DO NOT RUN - Create via Dashboard UI):

-- Policy 1: Public read access
-- Name: "Public read access for product_images"
-- Operation: SELECT
-- Policy: (bucket_id = 'product_images')

-- Policy 2: Authenticated users can upload
-- Name: "Authenticated upload to product_images"
-- Operation: INSERT
-- Policy: (bucket_id = 'product_images' AND auth.role() = 'authenticated')

-- Policy 3: Users can update their own files
-- Name: "Users update own files in product_images"
-- Operation: UPDATE
-- Policy: 
--   USING: (bucket_id = 'product_images' AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()::text)
--   WITH CHECK: (bucket_id = 'product_images' AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()::text)

-- Policy 4: Users can delete their own files
-- Name: "Users delete own files in product_images"
-- Operation: DELETE
-- Policy: (bucket_id = 'product_images' AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()::text)

