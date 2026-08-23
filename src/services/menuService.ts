import { Dish, Category, RestaurantInfo, AboutInfo, GalleryItem } from '../types';
import { getSupabaseClient } from './supabaseClient';

function requireClient() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase client is not configured. Set the Supabase URL and anon key environment variables.');
  }
  return supabase;
}

function fail(operation: string, error: unknown): never {
  const message =
    error && typeof error === 'object' && 'message' in (error as any)
      ? (error as any).message
      : String(error);
  throw new Error(`Supabase ${operation} failed: ${message}`);
}

export function generateSlug(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-');
}

// ✅ FIX: Safe ID to string converter - handles number, string, UUID, null
function safeId(id: any): string | undefined {
  if (id === undefined || id === null || id === '') return undefined;
  return String(id);
}

function mapDbDishToDish(db: any): Dish {
  const normId = db.id !== undefined && db.id !== null ? Number(db.id) || 1 : 1;
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
    display_order: db.display_order !== undefined && db.display_order !== null ? Number(db.display_order) : normId,
    display_order_today: db.display_order_today !== undefined && db.display_order_today !== null ? Number(db.display_order_today) : normId,
    display_order_chef: db.display_order_chef !== undefined && db.display_order_chef !== null ? Number(db.display_order_chef) : normId,
    display_order_popular: db.display_order_popular !== undefined && db.display_order_popular !== null ? Number(db.display_order_popular) : normId,
    display_order_favorite: db.display_order_favorite !== undefined && db.display_order_favorite !== null ? Number(db.display_order_favorite) : normId,
    active: db.active !== undefined && db.active !== null ? !!db.active : (db.is_available !== undefined && db.is_available !== null ? !!db.is_available : true)
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
  // ✅ FIX: Always include id if it exists - don't check Number(id) > 0
  const idStr = safeId(d.id);
  if (idStr !== undefined) {
    row.id = d.id; // Keep original type (string or number)
  }
  return row;
}

function mapCategoryToRow(c: Category, idx: number): any {
  return {
    id: c.id,
    slug: c.slug || generateSlug(c.label || c.name || c.id),
    name: c.name || c.label || c.id,
    label: c.label || c.name || c.id,
    sort_order: c.display_order !== undefined ? c.display_order : idx + 1,
    display_order: c.display_order !== undefined ? c.display_order : idx + 1,
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
    sort_order: item.display_order || idx + 1,
    display_order: item.display_order || idx + 1,
    active: item.active !== false,
    is_visible: item.active !== false,
    updated_at: new Date().toISOString()
  };
  const idStr = safeId(item.id);
  if (idStr !== undefined) {
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
      name: info.name, address: info.address, phone: info.phone,
      opening_hours: info.openingHours, instagram: info.instagram,
      website: info.website, dining_style: info.diningStyle,
      updated_at: new Date().toISOString()
    };
    if (existingInfo?.[0]?.id) infoRow.id = existingInfo[0].id;
    const { error: infoErr } = await supabase.from('restaurant_info