import { getSupabaseClient } from './supabaseClient';

export interface ImageUploadResult {
  url: string;
  width?: number;
  height?: number;
  sizeMB?: string;
  source: 'supabase' | 'base64' | 'external';
}

/**
 * Sanitizes dish name into a clean, URL-safe asset filename.
 */
export function sanitizeFileName(originalName: string, prefix: string): string {
  const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
  const cleanPrefix = prefix
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'dish';

  const uniqueId = Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
  return `${cleanPrefix}-${uniqueId}.${extension}`;
}

/**
 * Inspects an image data URL or blob to get its natural dimensions and file size.
 */
export function inspectImage(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error('Failed to inspect image dimensions.'));
    img.src = dataUrl;
  });
}

/**
 * Uploads a local file directly into Supabase Storage.
 * Falls back to base64 if Supabase Storage is not configured or inaccessible.
 */
export async function uploadDishImage(
  file: File,
  dishName: string,
  bucket: 'food-images' | 'gallery' = 'food-images'
): Promise<ImageUploadResult> {
  const supabase = getSupabaseClient();
  const fileName = sanitizeFileName(file.name, dishName);
  const sizeMB = (file.size / (1024 * 1024)).toFixed(2);

  // Read base64 for dimensions inspection
  const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const { width, height } = await inspectImage(base64Data);

  // If Supabase client exists, attempt upload to Supabase Storage bucket
  if (supabase) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '31536000',
          upsert: true
        });

      if (!error && data) {
        const { data: publicUrlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(data.path);

        if (publicUrlData?.publicUrl) {
          return {
            url: publicUrlData.publicUrl,
            width,
            height,
            sizeMB,
            source: 'supabase'
          };
        }
      }
    } catch (err) {
      console.warn('Supabase storage upload failed, falling back to base64:', err);
    }
  }

  // Fallback to base64 data URL
  return {
    url: base64Data,
    width,
    height,
    sizeMB,
    source: 'base64'
  };
}

/**
 * Resolves an external link or Instagram post URL:
 * 1. Calls our server endpoint (/api/fetch-link-image) to fetch without CORS blocks.
 * 2. Uploads the image to Supabase Storage if possible.
 * 3. Returns the public URL, dimensions, and size.
 */
export async function fetchImageFromLink(
  linkUrl: string,
  dishName: string,
  bucket: 'food-images' | 'gallery' = 'food-images'
): Promise<ImageUploadResult> {
  const cleanUrl = linkUrl.trim();
  if (!cleanUrl) {
    throw new Error('Please enter a valid link.');
  }

  // Call server proxy endpoint
  const response = await fetch('/api/fetch-link-image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ url: cleanUrl, dishName, bucket })
  });

  const data = await response.json();
  if (!response.ok || data.error) {
    throw new Error(data.error || 'Failed to fetch image from link.');
  }

  const previewSrc = data.base64 || data.imageUrl;
  let dims = { width: 1200, height: 1200 };
  try {
    dims = await inspectImage(previewSrc);
  } catch {
    // ignore
  }

  const sizeMB = data.sizeBytes ? (data.sizeBytes / (1024 * 1024)).toFixed(2) : '1.0';

  return {
    url: data.imageUrl || data.base64,
    width: dims.width,
    height: dims.height,
    sizeMB,
    source: data.supabaseUrl ? 'supabase' : 'external'
  };
}
