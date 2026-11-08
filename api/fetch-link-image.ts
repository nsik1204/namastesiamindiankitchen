import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { url, dishName, bucket } = req.body || {};
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Valid image URL is required.' });
  }

  const cleanUrl = url.trim();
  let targetImageUrl = cleanUrl;

  try {
    // If it's an Instagram post / reel URL, attempt embed scrape
    const instaMatch = cleanUrl.match(/instagram\.com\/(?:p|reel|tv)\/([^/?#&]+)/i);
    if (instaMatch) {
      const shortcode = instaMatch[1];
      try {
        const embedRes = await fetch(`https://www.instagram.com/p/${shortcode}/embed/captioned/`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9'
          }
        });
        if (embedRes.ok) {
          const html = await embedRes.text();
          const imgMatch = html.match(/class=["']EmbeddedMediaImage["'][^>]*src=["']([^"']+)["']/i) ||
                           html.match(/<img[^>]*src=["']([^"']+)["'][^>]*class=["'][^"']*EmbeddedMediaImage/i) ||
                           html.match(/(https:\/\/[^"'<>\s]+scontent[^"'<>\s]+)/i);
          if (imgMatch && imgMatch[1]) {
            targetImageUrl = imgMatch[1].replace(/\\u0026/g, '&').replace(/&amp;/g, '&').replace(/\\/g, '');
          }
        }
      } catch (embedErr) {
        console.warn('Instagram embed scraping attempt failed:', embedErr);
      }
    }

    // Fetch the target image
    const imageRes = await fetch(targetImageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
      }
    });

    if (!imageRes.ok) {
      return res.status(400).json({
        error: `Could not load image (HTTP ${imageRes.status}). For Instagram, open the photo, right-click and choose "Copy Image Address", then paste here.`
      });
    }

    const contentType = imageRes.headers.get('content-type') || 'image/jpeg';
    if (!contentType.startsWith('image/') && !contentType.includes('octet-stream')) {
      return res.status(400).json({
        error: 'The link did not return an image. For Instagram, right-click the photo and choose "Copy Image Address".'
      });
    }

    const arrayBuffer = await imageRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = `data:${contentType};base64,${buffer.toString('base64')}`;

    let supabaseUrl: string | null = null;
    const targetBucket = bucket === 'gallery' ? 'gallery' : 'food-images';
    const supabaseUrlEnv = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKeyEnv = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (supabaseUrlEnv && supabaseKeyEnv) {
      try {
        const supabaseAdmin = createClient(supabaseUrlEnv, supabaseKeyEnv);
        const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
        const cleanPrefix = (dishName || 'dish')
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .slice(0, 30);
        const filename = `${cleanPrefix}-${Date.now().toString(36)}.${ext}`;

        const { data: uploadData, error: uploadErr } = await supabaseAdmin.storage
          .from(targetBucket)
          .upload(filename, buffer, {
            contentType,
            upsert: true,
            cacheControl: '31536000'
          });

        if (!uploadErr && uploadData) {
          const { data: pubData } = supabaseAdmin.storage
            .from(targetBucket)
            .getPublicUrl(uploadData.path);
          supabaseUrl = pubData.publicUrl;
        }
      } catch (storageErr) {
        console.warn('Storage upload warning:', storageErr);
      }
    }

    return res.status(200).json({
      success: true,
      imageUrl: supabaseUrl || base64,
      base64,
      supabaseUrl,
      sizeBytes: buffer.length
    });
  } catch (err: any) {
    console.error('fetch-link-image error:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch image from link.' });
  }
}

