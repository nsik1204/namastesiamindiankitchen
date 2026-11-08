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
 * Inspects an image data URL or direct link to get its natural dimensions.
 */
export function inspectImage(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
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
 * Resolves an external link or Instagram photo URL.
 * 1. Checks if it's directly readable by browser (e.g. CDN/direct image URL).
 * 2. If blocked or Instagram post page, calls serverless proxy endpoint /api/fetch-link-image.
 * 3. Gracefully reports actionable instructions if Meta blocks unauthenticated scraping.
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

  // Check if it's a direct image URL or Instagram CDN address
  const isDirectImage =
    cleanUrl.match(/\.(jpeg|jpg|png|webp|avif)(\?.*)?$/i) ||
    cleanUrl.includes('scontent') ||
    cleanUrl.includes('cdninstagram.com') ||
    cleanUrl.includes('unsplash.com') ||
    cleanUrl.includes('supabase.co');

  if (isDirectImage) {
    try {
      const dims = await inspectImage(cleanUrl);
      return {
        url: cleanUrl,
        width: dims.width,
        height: dims.height,
        sizeMB: '1.0',
        source: 'external'
      };
    } catch {
      // If direct browser loading is blocked by CORS, continue to proxy
    }
  }

  // Call server proxy endpoint safely
  let rawText = '';
  let data: any = null;

  try {
    const response = await fetch('/api/fetch-link-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url: cleanUrl, dishName, bucket })
    });

    rawText = await response.text();
    if (!rawText || !rawText.trim()) {
      throw new SyntaxError('Empty response');
    }

    data = JSON.parse(rawText);

    if (!response.ok || data.error) {
      throw new Error(data.error || 'Failed to fetch image from link.');
    }
  } catch (err: any) {
    if (err instanceof SyntaxError || err.message?.includes('JSON') || err.message?.includes('Empty response')) {
      if (cleanUrl.includes('instagram.com/p/') || cleanUrl.includes('instagram.com/reel/')) {
        throw new Error(
          'Instagram post pages are protected by Meta login. Please right-click the photo on Instagram, select "Copy Image Address", and paste that direct link here!'
        );
      }
      throw new Error(
        'Could not fetch image from this link. Please make sure you are pasting a direct image address (e.g. ending in .jpg, .png, or from "Copy Image Address").'
      );
    }
    throw err;
  }

  const previewSrc = data.base64 || data.imageUrl;
  let dims = { width: 1200, height: 1200 };
  try {
    dims = await inspectImage(previewSrc);
  } catch {
    // fallback
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
