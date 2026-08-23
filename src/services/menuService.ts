import { Dish, Category, RestaurantInfo, AboutInfo, GalleryItem } from '../types';
import { getSupabaseClient } from './supabaseClient';

function requireClient() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }
  return supabase;
}

function fail(operation: string, error: unknown): never {
  const message = error && typeof error === 'object' && 'message' in error 
    ? (error as any).message 
    : String(error);
  throw new Error(`Supabase ${operation} failed: ${message}`);
}

export function generateSlug(text: string): string {
  if (!text) return '';
  return text.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/-+/g, '-');
}

function mapDbDishToDish(db: any): Dish {
  return {
    id: db.id,
    slug: db.slug || generateSlug(db.name),
    name: db.name,
    description: db.description,
    priceTHB: Number(db.price_thb),
    category: db.category_id,
    type: (db.food_type === 'nonveg' || db.veg === false) ? 'nonveg' : 'veg',
    veg: db.veg !== undefined ? !!db.veg : (db.food_type !== 'nonveg'),
    spiceLevel: db.spice_level,
    ingredients: db.ingredients || [],
    chefSpecial: !!db.chef_special,
    bestseller: !!db.bestseller,
    popular: db.popular !== undefined ? !!db.popular : !!db.bestseller,
    customerFavorite: !!db.customer_favorite,
    todaySpecial: !!db.today_special,
    image: db.image_url,
    display_order: db.display_order ?? 1,
    display_order_today: db.display_order_today ?? 1,
    display_order_chef: db.display_order_chef ?? 1,
    display_order_popular: db.display_order_popular ?? 1,
    display_order_favorite: db.display_order_favorite ?? 1,
    active: db.active !== undefined && db.active !== null ? !!db.active : true
  };
}

function mapDishToRow(d: Dish): any {
  const row: any = {
    slug: d.slug || generateSlug(d.name),
    name: d.name,
    description: d.description,
    price_thb: d.priceTHB,
    category_id: d.category,
    food_type: d.type,
    veg: d.veg !== false,
    spice_level: d.spiceLevel,
    ingredients: d.ingredients || [],
    chef_special: !!d.chefSpecial,
    bestseller: !!d.bestseller,
    popular: d.popular !== false,
    customer_favorite: !!d.customerFavorite,
    today_special: !!d.todaySpecial,
    image_url: d.image,
    active: d.active !== false,
    is_available: d.active !== false,
    display_order: d.display_order || 0,
    display_order_today: d.display_order_today || 0,
    display_order_chef: d.display_order_chef || 0,
    display_order_popular: d.display_order_popular || 0,
    display_order_favorite: d.display_order_favorite || 0,
    updated_at: new Date().toISOString()
  };
  // ✅ IMPORTANT: Always include ID if it exists (handles both UUID strings and numbers)
  if (d.id !== undefined && d.id !== null && d.id !== '') {
    row.id = d.id;
  }
  return row;
}

function mapCategoryToRow(c: Category, idx: number): any {
  return {
    id: c.id,
    slug: c.slug || generateSlug(c.label || c.name || c.id),
    name: c.name || c.label || c.id,
    label: c.label || c.name || c.id,
    display_order: c.display_order ?? idx + 1,
    is_visible: c.active !== false,
    active: c.active !== false,
    updated_at: new Date().toISOString()
  };
}

function mapGalleryToRow(item: GalleryItem, idx: number): any {
  const row: any = {
    title: item.title || item.alt || '',
    image_url: item.image,
    alt_text: item.alt || item.title || '',
    is_tall: !!item.tall,
    display_order: item.display_order ?? idx + 1,
    active: item.active !== false,
    is_visible: item.active !== false,
    updated_at: new Date().toISOString()
  };
  if (item.id !== undefined && item.id !== null && item.id !== '') {
    row.id = item.id;
  }
  return row;
}

export const MenuService = {
  async getRestaurantInfo(): Promise<RestaurantInfo> {
    const supabase = requireClient();
    const { data: infoList, error: infoError } = await supabase.from('restaurant_info').select('*').limit(1);
    if (infoError) fail('read restaurant_info', infoError);
    const { data: chatList, error: chatError } = await supabase.from('chat_settings').select('*').limit(1);
    if (chatError) fail('read chat_settings', chatError);
    const infoRow = infoList?.[0];
    if (!infoRow) throw new Error('No row found in restaurant_info.');
    const chatRow = chatList?.[0] || {};
    return {
      name: infoRow.name,
      address: infoRow.address,
      phone: infoRow.phone,
      openingHours: infoRow.opening_hours,
      instagram: infoRow.instagram,
      website: infoRow.website,
      diningStyle: infoRow.dining_style,
      whatsappNumber: chatRow.whatsapp_number || '',
      whatsappMessage: chatRow.whatsapp_default_message || '',
      lineId: chatRow.line_id || '',
      lineQrUrl: chatRow.line_qr_url || '',
      contactActiveChannel: (chatRow.contact_active_channel || 'both') as any
    };
  },

  async saveRestaurantInfo(info: RestaurantInfo): Promise<void> {
    const supabase = requireClient();
    const { data: existingInfo, error: readInfoErr } = await supabase.from('restaurant_info').select('id').limit(1);
    if (readInfoErr) fail('read restaurant_info', readInfoErr);
    const infoRow: any = {
      name: info.name,
      address: info.address,
      phone: info.phone,
      opening_hours: info.openingHours,
      instagram: info.instagram,
      website: info.website,
      dining_style: info.diningStyle,
      updated_at: new Date().toISOString()
    };
    if (existingInfo?.[0]?.id) infoRow.id = existingInfo[0].id;
    const { error: infoErr } = await supabase.from('restaurant_info').upsert(infoRow);
    if (infoErr) fail('save restaurant_info', infoErr);

    const { data: existingChat, error: readChatErr } = await supabase.from('chat_settings').select('id').limit(1);
    if (readChatErr) fail('read chat_settings', readChatErr);
    const chatRow: any = {
      whatsapp_number: info.whatsappNumber || '',
      whatsapp_default_message: info.whatsappMessage || '',
      line_id: info.lineId || '',
      line_qr_url: info.lineQrUrl || '',
      contact_active_channel: info.contactActiveChannel || 'both',
      updated_at: new Date().toISOString()
    };
    if (existingChat?.[0]?.id) chatRow.id = existingChat[0].id;
    const { error: chatErr } = await supabase.from('chat_settings').upsert(chatRow);
    if (chatErr) fail('save chat_settings', chatErr);
  },

  async getAboutInfo(): Promise<AboutInfo> {
    const supabase = requireClient();
    const { data, error } = await supabase.from('about_info').select('*').limit(1);
    if (error) fail('read about_info', error);
    const row = data?.[0];
    if (!row) throw new Error('No row found in about_info.');
    return { story: row.story_paragraphs || [], highlights: row.highlights || [] };
  },

  async saveAboutInfo(about: AboutInfo): Promise<void> {
    const supabase = requireClient();
    const { data: existing, error: readErr } = await supabase.from('about_info').select('id').limit(1);
    if (readErr) fail('read about_info', readErr);
    const row: any = {
      story_paragraphs: about.story || [],
      highlights: about.highlights || [],
      updated_at: new Date().toISOString()
    };
    if (existing?.[0]?.id) row.id = existing[0].id;
    const { error } = await supabase.from('about_info').upsert(row);
    if (error) fail('save about_info', error);
  },

  async getCategories(): Promise<Category[]> {
    const supabase = requireClient();
    const { data, error } = await supabase.from('categories').select('*').order('display_order');
    if (error) fail('read categories', error);
    const dbCats: Category[] = (data || []).map((c: any) => ({
      id: String(c.id),
      slug: c.slug || generateSlug(c.name || c.label || c.id),
      name: c.name || c.label || c.id,
      label: c.label || c.name || c.id,
      display_order: c.display_order ?? Number(c.sort_order) ?? 0,
      active: c.active !== undefined && c.active !== null ? !!c.active : true
    }));
    return [{ id: 'all', slug: 'all', name: 'All', label: 'All', display_order: 0, active: true } as Category, ...dbCats];
  },

  async saveCategories(cats: Category[]): Promise<void> {
    const supabase = requireClient();
    const realCats = cats.filter(c => c.id !== 'all');
    const rows = realCats.map(mapCategoryToRow);
    const { data: existing, error: readErr } = await supabase.from('categories').select('id');
    if (readErr) fail('read categories', readErr);
    const keepIds = new Set(rows.map(r => String(r.id)));
    const removeIds = (existing || []).map((r: any) => String(r.id)).filter((id: string) => !keepIds.has(id));
    if (rows.length > 0) {
      const { error } = await supabase.from('categories').upsert(rows, { onConflict: 'id' });
      if (error) fail('save categories', error);
    }
    if (removeIds.length > 0) {
      const { error } = await supabase.from('categories').delete().in('id', removeIds);
      if (error) fail('delete removed categories', error);
    }
  },

  async deleteCategory(id: string): Promise<void> {
    const supabase = requireClient();
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) fail(`delete category "${id}"`, error);
  },

  async getDishes(): Promise<Dish[]> {
    const supabase = requireClient();
    const { data, error } = await supabase.from('foods').select('*').order('display_order');
    if (error) fail('read foods', error);
    return (data || []).map(mapDbDishToDish);
  },

  async saveDishes(allDishes: Dish[]): Promise<void> {
    const supabase = requireClient();
    const rows = allDishes.map(mapDishToRow);
    const { data: existing, error: readErr } = await supabase.from('foods').select('id');
    if (readErr) fail('read foods', readErr);
    // ✅ Use String() for consistent comparison - handles both UUID and number IDs
    const keepIds = new Set(rows.filter(r => r.id !== undefined && r.id !== null).map(r => String(r.id)));
    const removeIds = (existing || []).map((r: any) => String(r.id)).filter((id: string) => !keepIds.has(id));
    if (rows.length > 0) {
      const { error } = await supabase.from('foods').upsert(rows, { onConflict: 'id' });
      if (error) fail('save dishes', error);
    }
    if (removeIds.length > 0) {
      const { error } = await supabase.from('foods').delete().in('id', removeIds);
      if (error) fail('delete removed dishes', error);
    }
  },

  async saveDish(dish: Dish): Promise<Dish> {
    const supabase = requireClient();
    const row = mapDishToRow(dish);
    const { data, error } = await supabase.from('foods').upsert(row, { onConflict: 'id' }).select().single();
    if (error) fail(`save dish "${dish.name}"`, error);
    if (!data) throw new Error(`Supabase save dish "${dish.name}" returned no row.`);
    return mapDbDishToDish(data);
  },

  // ✅ Accept both string and number to handle UUID and numeric IDs
  async deleteDish(id: string | number): Promise<void> {
    const supabase = requireClient();
    const { error } = await supabase.from('foods').delete().eq('id', id);
    if (error) fail(`delete dish id ${id}`, error);
  },

  async getGalleryItems(): Promise<GalleryItem[]> {
    const supabase = requireClient();
    const { data, error } = await supabase.from('gallery').select('*').order('display_order');
    if (error) fail('read gallery', error);
    return (data || []).map((item: any) => ({
      id: String(item.id),
      title: item.title || item.alt_text || '',
      image: item.image_url,
      alt: item.alt_text || item.title || '',
      tall: !!item.is_tall,
      display_order: item.display_order ?? Number(item.sort_order) ?? 0,
      active: item.active !== undefined && item.active !== null ? !!item.active : true
    }));
  },

  async saveGalleryItems(items: GalleryItem[]): Promise<void> {
    const supabase = requireClient();
    const rows = items.map(mapGalleryToRow);
    const { data: existing, error: readErr } = await supabase.from('gallery').select('id');
    if (readErr) fail('read gallery', readErr);
    const keepIds = new Set(rows.filter(r => r.id !== undefined && r.id !== null).map(r => String(r.id)));
    const removeIds = (existing || []).map((r: any) => String(r.id)).filter((id: string) => !keepIds.has(id));
    if (rows.length > 0) {
      const { error } = await supabase.from('gallery').upsert(rows, { onConflict: 'id' });
      if (error) fail('save gallery', error);
    }
    if (removeIds.length > 0) {
      const { error } = await supabase.from('gallery').delete().in('id', removeIds);
      if (error) fail('delete removed gallery items', error);
    }
  },

  async deleteGalleryItem(id: string | number): Promise<void> {
    const supabase = requireClient();
    const { error } = await supabase.from('gallery').delete().eq('id', id);
    if (error) fail(`delete gallery item ${id}`, error);
  }
};