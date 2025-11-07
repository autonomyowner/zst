# Supabase Storage Setup Guide

## Create the Product Images Bucket

To enable image uploads for product listings, you need to create the `product_images` storage bucket in Supabase.

### Steps:

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard/project/ukkgmqvappkeqgdrbsar
   - Or go to your project dashboard and select your project

2. **Open Storage**
   - Click on **"Storage"** in the left sidebar

3. **Create New Bucket**
   - Click the **"New bucket"** button (or "+" icon)
   - Enter bucket details:
     - **Name**: `product_images`
     - **Public bucket**: ✅ **Enable this** (check the checkbox)
     - **File size limit**: 5 MB (or your preferred limit)
     - **Allowed MIME types**: Leave empty to allow all image types, or specify:
       - `image/jpeg`
       - `image/png`
       - `image/webp`
       - `image/gif`

4. **Configure Bucket Policies**

   After creating the bucket, you need to set up Row Level Security (RLS) policies:

   **Go to Storage → Policies → product_images**

   Click **"New Policy"** and create each policy:

   **Policy 1: Allow public read access**
   - Policy name: `Public read access`
   - Allowed operation: `SELECT`
   - Target roles: Leave default or select `anon`, `authenticated`
   - Policy definition (USING expression):
   ```sql
   bucket_id = 'product_images'
   ```
   - Click **"Save policy"**

   **Policy 2: Allow authenticated users to upload**
   - Policy name: `Authenticated upload`
   - Allowed operation: `INSERT`
   - Target roles: `authenticated`
   - Policy definition (WITH CHECK expression):
   ```sql
   bucket_id = 'product_images' AND auth.role() = 'authenticated'
   ```
   - Click **"Save policy"**

   **Policy 3: Allow users to update their own files**
   - Policy name: `Users can update own files`
   - Allowed operation: `UPDATE`
   - Target roles: `authenticated`
   - Policy definition:
     - USING expression:
     ```sql
     bucket_id = 'product_images' AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()::text
     ```
     - WITH CHECK expression (same as USING):
     ```sql
     bucket_id = 'product_images' AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()::text
     ```
   - Click **"Save policy"**

   **Policy 4: Allow users to delete their own files**
   - Policy name: `Users can delete own files`
   - Allowed operation: `DELETE`
   - Target roles: `authenticated`
   - Policy definition (USING expression):
   ```sql
   bucket_id = 'product_images' AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()::text
   ```
   - Click **"Save policy"**

### Simplified Setup (Minimum Required)

If you want a simpler setup that allows all authenticated users to upload/update/delete any file (less secure but easier):

1. **Policy 1: Public read**
   - Operation: SELECT
   - Expression: `bucket_id = 'product_images'`

2. **Policy 2: Authenticated full access**
   - Operation: ALL (or INSERT, UPDATE, DELETE separately)
   - Expression: `bucket_id = 'product_images' AND auth.role() = 'authenticated'`

⚠️ **Note**: This simpler setup allows any authenticated user to modify any file in the bucket. Use the detailed policies above for better security.

### Important Note

⚠️ **Storage policies CANNOT be created via SQL** - you must use the Dashboard UI. The storage.objects table is managed by Supabase and requires special permissions.

Use the Dashboard UI method described above, or see the simplified setup below.

### Verify Setup

1. **Test the bucket exists:**
   - Go to Storage → product_images
   - You should see an empty bucket

2. **Test upload (via your app):**
   - Try creating a listing with an image
   - The upload should succeed
   - The image should appear in the bucket at: `{userId}/{timestamp}-{random}.jpg`

3. **Test public access:**
   - After uploading, copy the image URL
   - Open it in an incognito browser window
   - The image should be accessible

### Troubleshooting

**Error: "Bucket not found"**
- Make sure the bucket name is exactly `product_images` (lowercase, no spaces)
- Verify the bucket exists in Storage → Buckets

**Error: "new row violates row-level security policy"**
- Check that the storage policies are correctly set up
- Verify the user is authenticated (logged in)
- Check that the policy conditions match your file path structure

**Error: "permission denied"**
- Ensure the bucket is set to **Public** (for read access)
- Verify the authenticated upload policy is active
- Check that the user has a valid session

**Images not displaying**
- Verify the bucket is public
- Check the image URL is correct
- Ensure CORS is configured (usually handled automatically by Supabase)

### File Structure

Images are stored with the following structure:
```
product_images/
  └── {userId}/
      └── {timestamp}-{random}.{extension}
```

Example:
```
product_images/
  └── dbbd22a8-46f2-46d9-accf-c732da603ca1/
      └── 1762286744802-49qtrzwxj5m.jpg
```

This structure:
- Organizes files by user ID
- Prevents filename conflicts with timestamps
- Makes it easy to identify and clean up user files

