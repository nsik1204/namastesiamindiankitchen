import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

function getSupabaseAdmin() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase environment variables are missing');
  }
  return createClient(supabaseUrl, supabaseServiceKey);
}

const ALLOWED_ADMIN_EMAIL = 'YOUR_EMAIL_HERE';

// Middleware to verify admin authentication and device fingerprint
const verifyAdmin = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  const fingerprint = req.headers['x-device-fingerprint'] as string;

  if (!authHeader || !fingerprint) {
    return res.status(404).send('Page Not Found\n\nThe requested page could not be found.');
  }

  const token = authHeader.replace('Bearer ', '');
  if (!token) {
    return res.status(404).send('Page Not Found\n\nThe requested page could not be found.');
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data: { user }, error } = await getSupabaseAdmin().auth.getUser(token);

    if (error || !user || user.email !== ALLOWED_ADMIN_EMAIL) {
      return res.status(404).send('Page Not Found\n\nThe requested page could not be found.');
    }

    // Check device fingerprint in admin_devices
    const { data: device, error: deviceError } = await getSupabaseAdmin()
      .from('admin_devices')
      .select('fingerprint')
      .eq('email', user.email)
      .eq('fingerprint', fingerprint)
      .eq('is_active', true)
      .single();

    if (deviceError || !device) {
      return res.status(404).send('Page Not Found\n\nThe requested page could not be found.');
    }

    // Attach user to request if needed
    (req as any).adminUser = user;
    next();
  } catch (err) {
    return res.status(404).send('Page Not Found\n\nThe requested page could not be found.');
  }
};

// Protect all /api/admin routes
app.use('/api/admin', verifyAdmin);

app.post('/api/admin/save-restaurant-info', async (req, res) => {
  const { info } = req.body;
  if (!info) return res.status(400).json({ error: 'Missing data' });
  
  const restInfo = {
    name: info.name,
    address: info.address,
    phone: info.phone,
    opening_hours: info.openingHours,
    instagram: info.instagram,
    website: info.website,
    dining_style: info.diningStyle,
    updated_at: new Date().toISOString()
  };

  const chatInfo = {
    whatsapp_number: info.whatsappNumber || '',
    whatsapp_default_message: info.whatsappMessage || '',
    line_id: info.lineId || '',
    line_qr_url: info.lineQrUrl || '',
    contact_active_channel: info.contactActiveChannel || 'both',
    updated_at: new Date().toISOString()
  };

  try {
    const { data: rows } = await getSupabaseAdmin().from('restaurant_info').select('id').limit(1);
    if (rows && rows.length > 0) {
      await getSupabaseAdmin().from('restaurant_info').update(restInfo).eq('id', rows[0].id);
    } else {
      await getSupabaseAdmin().from('restaurant_info').insert([restInfo]);
    }

    const { data: chatRows } = await getSupabaseAdmin().from('chat_settings').select('id').limit(1);
    if (chatRows && chatRows.length > 0) {
      await getSupabaseAdmin().from('chat_settings').update(chatInfo).eq('id', chatRows[0].id);
    } else {
      await getSupabaseAdmin().from('chat_settings').insert([chatInfo]);
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/save-about-info', async (req, res) => {
  const { info } = req.body;
  if (!info) return res.status(400).json({ error: 'Missing data' });
  
  const aboutInfo = {
    story_paragraphs: info.story,
    highlights: info.highlights,
    updated_at: new Date().toISOString()
  };

  try {
    const { data: rows } = await getSupabaseAdmin().from('about_info').select('id').limit(1);
    if (rows && rows.length > 0) {
      await getSupabaseAdmin().from('about_info').update(aboutInfo).eq('id', rows[0].id);
    } else {
      await getSupabaseAdmin().from('about_info').insert([aboutInfo]);
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/save-dishes', async (req, res) => {
  const { dishes } = req.body;
  if (!dishes) return res.status(400).json({ error: 'Missing data' });
  try {
    const ids = dishes.map((d: any) => d.id).filter((id: any) => id > 0);
    if (ids.length > 0) {
      await getSupabaseAdmin().from('foods').delete().not('id', 'in', ids);
    } else {
      await getSupabaseAdmin().from('foods').delete().neq('id', 0);
    }
    
    if (dishes.length > 0) {
      const { error } = await getSupabaseAdmin().from('foods').upsert(dishes);
      if (error) return res.status(500).json({ error: error.message });
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/save-gallery', async (req, res) => {
  const { gallery } = req.body;
  if (!gallery) return res.status(400).json({ error: 'Missing data' });
  try {
    await getSupabaseAdmin().from('gallery').delete().neq('image_url', '');
    if (gallery.length > 0) {
      const { error } = await getSupabaseAdmin().from('gallery').insert(gallery);
      if (error) return res.status(500).json({ error: error.message });
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/save-categories', async (req, res) => {
  const { categories } = req.body;
  if (!categories) return res.status(400).json({ error: 'Missing data' });
  try {
    const { error } = await getSupabaseAdmin().from('categories').upsert(categories, { onConflict: 'id' });
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
