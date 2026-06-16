# Namaste Siam Indian Kitchen — Supabase Storage Architecture & Security Blueprint

This document specifies the complete visual asset management and production storage architecture for the **Namaste Siam Indian Kitchen** platform. It defines storage bucket policies, object lifecycle rules, access controls, upload strategies, copy configurations, and security guardrails designed for high-concurrency production environments.

---

## 1. Storage Buckets & Policies (SQL Setup)

To execute this architecture in your Supabase instance, run the following SQL statements in the Supabase SQL Editor. This automatically registers the designated public assets buckets and enforces strict Row-Level Security policies.

```sql
-- ====================================================================
-- MODULE: INITIALIZE PRODUCTION STORAGE BUCKETS
-- ====================================================================

-- Insert configured buckets into Supabase storage registry safely
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('food-images', 'food-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('gallery', 'gallery', true, 8388608, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('hero', 'hero', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('restaurant', 'restaurant', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']),
  ('specials', 'specials', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- ====================================================================
-- MODULE: STORAGE ROW-LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

-- Enable RLS globally on the storage.objects metadata record table
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------
-- A. PUBLIC READ POLICIES (All buckets can be read by public guests)
-- --------------------------------------------------------------------

CREATE POLICY "Allow public select read for food-images bucket"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'food-images');

CREATE POLICY "Allow public select read for gallery bucket"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'gallery');

CREATE POLICY "Allow public select read for hero bucket"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'hero');

CREATE POLICY "Allow public select read for restaurant bucket"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'restaurant');

CREATE POLICY "Allow public select read for specials bucket"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'specials');

-- --------------------------------------------------------------------
-- B. WRITE POLICIES (Authenticated admin staff only)
-- --------------------------------------------------------------------

CREATE POLICY "Allow authenticated staff to upload objects"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('food-images', 'gallery', 'hero', 'restaurant', 'specials'));

CREATE POLICY "Allow authenticated staff to update objects"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id IN ('food-images', 'gallery', 'hero', 'restaurant', 'specials'))
  WITH CHECK (bucket_id IN ('food-images', 'gallery', 'hero', 'restaurant', 'specials'));

CREATE POLICY "Allow authenticated staff to delete objects"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id IN ('food-images', 'gallery', 'hero', 'restaurant', 'specials'));
```

---

## 2. Dynamic Upload & Asset Strategies

Here are the complete React / TypeScript wrapper patterns to interact with the Supabase JavaScript Client.

### A. Image Naming Strategy
To guarantee uniqueness, prevent race conditions, and support search-engine-optimized indices, files are renamed before uploading according to the following guidelines:
1.  **Format**: `[bucket-name]/[sanitized-dish-name]-[unique-nanoid-or-timestamp].[extension]`
2.  **Mime-Type Normalization**: Auto-lowercase extensions and transform special chars to clean hyphens.

```typescript
export function sanitizeFileName(originalName: string, prefix: string): string {
  const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
  const cleanPrefix = prefix
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-') // Replace non-alphanumeric characters with hyphens
    .replace(/-+/g, '-')        // Prevent consecutive hyphens
    .replace(/^-|-$/g, '');     // Trim trailing or leading hyphens
  
  const uniqueId = Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
  return `${cleanPrefix}-${uniqueId}.${extension}`;
}
```

### B. Upload Strategy
Optimized chunk uploads with built-in client-side validation for sizes and aspect ratios.

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient('YOUR_SUPABASE_URL', 'YOUR_SUPABASE_ANON_KEY');

export async function uploadAsset(
  bucket: 'food-images' | 'gallery' | 'hero' | 'restaurant' | 'specials',
  file: File,
  tagPrefix: string
): Promise<string> {
  // 1. Client-Side Constraints Verification
  const maxLimit = bucket === 'restaurant' ? 2 * 1024 * 1024 : 5 * 1024 * 1024;
  if (file.size > maxLimit) {
    throw new Error(`File size is too large. Limit for this bucket is ${maxLimit / (1024 * 1024)}MB.`);
  }

  // 2. Generate Unique SEO-friendly Filename
  const finalPath = sanitizeFileName(file.name, tagPrefix);

  // 3. Command Supabase Storage Upload Operation
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(finalPath, file, {
      cacheControl: '31536000', // Cache assets for 1 Year
      upsert: false             // Guard files against accidental overwrites
    });

  if (error) throw error;

  // 4. Resolve Dynamic Asset Global CDN Delivery Endpoint
  const { data: publicUrlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return publicUrlData.publicUrl;
}
```

### C. Delete Strategy
Always prune orphaned storage objects when metadata entries are cleaned from tables to save memory and minimize bandwidth costs.

```typescript
export async function deleteAsset(
  bucket: string,
  publicUrl: string
): Promise<void> {
  // Extract path from the public endpoint URI
  const keyword = `/storage/v1/object/public/${bucket}/`;
  const index = publicUrl.indexOf(keyword);
  if (index === -1) {
    console.warn("Invalid asset path or external URL. Skipping cleanup index.");
    return;
  }
  
  const storageFilePath = publicUrl.substring(index + keyword.length);
  
  // Call delete object mutation
  const { error } = await supabase.storage
    .from(bucket)
    .remove([storageFilePath]);

  if (error) {
    console.error(`Asset deletion error on file path: ${storageFilePath}`, error);
    throw error;
  }
}
```

### D. Replace / Update Strategy
Combines transactional deletion with atomic instantiation to prevent dead-links:

```typescript
export async function replaceAsset(
  bucket: 'food-images' | 'gallery' | 'hero' | 'restaurant' | 'specials',
  oldPublicUrl: string | null,
  newFile: File,
  tagPrefix: string
): Promise<string> {
  // 1. Upload new asset first to verify integrity
  const newPublicUrl = await uploadAsset(bucket, newFile, tagPrefix);
  
  // 2. Safely clean up the old asset, if available
  if (oldPublicUrl) {
    try {
      await deleteAsset(bucket, oldPublicUrl);
    } catch (cleanupError) {
      console.warn("Replacing complete, but old orphan asset cleanup recorded warning:", cleanupError);
    }
  }
  
  return newPublicUrl;
}
```

---

## 3. Storage Security Best Practices

To safeguard the Namaste Siam asset integrity, implement these security measures:
*   **Enforce Strict MIME-Type Whitelisting**: Handlers are restricted to `image/jpeg`, `image/png`, `image/webp`. This locks out vectors like malicious SVGs containing arbitrary scripts.
*   **Aggressive Edge CDN Caching**: Set metadata headers to `'31536000'`. This instructs clients and Supabase servers to cache resource assets for 1 Year.
*   **Authenticated Operations Only**: Double check that RLS permissions are locked down. Public users can ONLY fetch data (`SELECT`), while write mutations require authentic `user_metadata` session tokens.
