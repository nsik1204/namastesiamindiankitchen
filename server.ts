import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

function getSupabaseAdmin() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase environment variables are missing');
  }
  return createClient(supabaseUrl, supabaseServiceKey);
}

function getAdminEmail() {
  return process.env.ADMIN_EMAIL || process.env.VITE_ADMIN_EMAIL || '';
}

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
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    const adminEmail = getAdminEmail();
    if (error || !user || user.email !== adminEmail) {
      return res.status(404).send('Page Not Found\n\nThe requested page could not be found.');
    }

    const { data: device, error: deviceError } = await supabaseAdmin
      .from('admin_devices')
      .select('fingerprint')
      .eq('email', user.email)
      .eq('fingerprint', fingerprint)
      .eq('is_active', true)
      .single();

    if (deviceError || !device) {
      return res.status(404).send('Page Not Found\n\nThe requested page could not be found.');
    }

    (req as any).adminUser = user;
    next();
  } catch (err) {
    return res.status(404).send('Page Not Found\n\nThe requested page could not be found.');
  }
};

app.post('/api/admin/check-device', async (req, res) => {
  const { fingerprint } = req.body;
  if (!fingerprint) return res.status(400).json({ error: 'Fingerprint required' });
  const adminEmail = getAdminEmail();
  if (!adminEmail) return res.status(500).json({ error: 'ADMIN_EMAIL not configured' });
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data: device, error } = await supabaseAdmin
      .from('admin_devices')
      .select('fingerprint')
      .eq('email', adminEmail)
      .eq('fingerprint', fingerprint)
      .eq('is_active', true)
      .single();
    if (error || !device) return res.json({ approved: false });
    return res.json({ approved: true });
  } catch (err) {
    return res.json({ approved: false });
  }
});

app.use('/api/admin', verifyAdmin);

app.post('/api/admin/toggle-active', async (req, res) => {
  const { type, id, slug, active } = req.body;
  try {
    const supabaseAdmin = getSupabaseAdmin();
    let error = null;
    const payload = { active, is_available: active, is_visible: active };
    if (type === 'dish') {
      const q = supabaseAdmin.from('foods').update(payload);
      if (id) q.eq('id', id); else q.eq('slug', slug);
      error = (await q).error;
    } else if (type === 'category') {
      const q = supabaseAdmin.from('categories').update(payload);
      if (id) q.eq('id', id); else q.eq('slug', slug);
      error = (await q).error;
    }
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post('/api/admin/delete', async (req, res) => {
  const { type, id, slug } = req.body;
  try {
    const supabaseAdmin = getSupabaseAdmin();
    let error = null;
    if (type === 'dish') {
      const q = supabaseAdmin.from('foods').delete();
      if (id) q.eq('id', id); else q.eq('slug', slug);
      error = (await q).error;
    } else if (type === 'category') {
      const q = supabaseAdmin.from('categories').delete();
      if (id) q.eq('id', id); else q.eq('slug', slug);
      error = (await q).error;
    }
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post('/api/admin/save-restaurant-info', async (req, res) => {
  const { info } = req.body;
  const restInfo = { name: info.name, address: info.address, phone: info.phone, opening_hours: info.openingHours, instagram: info.instagram, website: info.website, dining_style: info.diningStyle, updated_at: new Date().toISOString() };
  const chatInfo = { whatsapp_number: info.whatsappNumber || '', whatsapp_default_message: info.whatsappMessage || '', line_id: info.lineId || '', line_qr_url: info.lineQrUrl || '', contact_active_channel: info.contactActiveChannel || 'both', updated_at: new Date().toISOString() };
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data: rows } = await supabaseAdmin.from('restaurant_info').select('id').limit(1);
    if (rows && rows.length > 0) await supabaseAdmin.from('restaurant_info').update(restInfo).eq('id', rows[0].id);
    else await supabaseAdmin.from('restaurant_info').insert([restInfo]);

    const { data: chatRows } = await supabaseAdmin.from('chat_settings').select('id').limit(1);
    if (chatRows && chatRows.length > 0) await supabaseAdmin.from('chat_settings').update(chatInfo).eq('id', chatRows[0].id);
    else await supabaseAdmin.from('chat_settings').insert([chatInfo]);
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post('/api/admin/save-about-info', async (req, res) => {
  const { info } = req.body;
  const aboutInfo = { story_paragraphs: info.story, highlights: info.highlights, updated_at: new Date().toISOString() };
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data: rows } = await supabaseAdmin.from('about_info').select('id').limit(1);
    if (rows && rows.length > 0) await supabaseAdmin.from('about_info').update(aboutInfo).eq('id', rows[0].id);
    else await supabaseAdmin.from('about_info').insert([aboutInfo]);
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post('/api/admin/save-dishes', async (req, res) => {
  const { dishes } = req.body;
  try {
    if (dishes.length > 0) {
      const { error } = await getSupabaseAdmin().from('foods').upsert(dishes);
      if (error) return res.status(500).json({ error: error.message });
    }
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post('/api/admin/save-gallery', async (req, res) => {
  const { gallery } = req.body;
  try {
    await getSupabaseAdmin().from('gallery').delete().neq('image_url', '');
    if (gallery.length > 0) {
      const { error } = await getSupabaseAdmin().from('gallery').insert(gallery);
      if (error) return res.status(500).json({ error: error.message });
    }
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post('/api/admin/save-categories', async (req, res) => {
  const { categories } = req.body;
  try {
    const { error } = await getSupabaseAdmin().from('categories').upsert(categories, { onConflict: 'slug' });
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => { res.sendFile(path.join(distPath, 'index.html')); });
  }
  app.listen(PORT, '0.0.0.0', () => { console.log(`Server running on http://0.0.0.0:${PORT}`); });
}

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] === currentFile && !process.env.VERCEL) {
  startServer();
}

export default app;