import { Dish, Category, RestaurantInfo, AboutInfo, GalleryItem } from '../types';
import { DISHES, CATEGORIES, RESTAURANT_INFO, ABOUT_INFO, GALLERY } from '../data';
import { getSupabaseClient } from './supabaseClient';

async function generateDeviceFingerprint(): Promise<string> {
  const nav = window.navigator;
  const screen = window.screen;
  const str = `${nav.userAgent}-${nav.language}-${screen.colorDepth}-${screen.width}x${screen.height}-${new Date().getTimezoneOffset()}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function adminApiFetch(endpoint: string, body: any): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;
  const fingerprint = await generateDeviceFingerprint();
  const res = await fetch(`/api/admin/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'X-Device-Fingerprint': fingerprint
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    throw new Error('Admin API error: ' + res.statusText);
  }
}

function getLocalOrStatic<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(`namaste_siam_${key}`);
    const parsed = item ? JSON.parse(item) : null;
    return parsed ? parsed : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setLocal<T>(key: string, value: T): void {
  try {
    localStorage.setItem(`namaste_siam_${key}`, JSON.stringify(value));
  } catch (err) {
    console.error('Failed to save to local storage fallback:', err);
  }
}

export function generateSlug(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // remove non-word chars
    .replace(/[\s_]+/g, '-')  // replace spaces/underscores with hyphens
    .replace(/-+/g, '-');     // remove consecutive hyphens
}

function mapDbDishToDish(db: any): Dish {
  const normId = db.id || 1;
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

/**
 * Service to manage all menu and restaurant data operations dynamically.
 * Features real-time Supabase remote reads and writes with automatic seeding capabilities.
 */
export const MenuService = {
  /**
   * Get general restaurant profile and chat coordinator settings
   */
  async getRestaurantInfo(): Promise<RestaurantInfo> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return getLocalOrStatic('restaurant_info', RESTAURANT_INFO);
    }

    try {
      const { data: infoList, error: infoError } = await supabase.from('restaurant_info').select('*').limit(1);
      const { data: chatList, error: chatError } = await supabase.from('chat_settings').select('*').limit(1);

      if (infoError || chatError) {
        console.warn('Supabase fetch info failed, falling back safely:', infoError || chatError);
        return getLocalOrStatic('restaurant_info', RESTAURANT_INFO);
      }

      let infoRow = infoList?.[0];
      let chatRow = chatList?.[0];

      // Auto-Seed Table: restaurant_info if empty
      if (!infoRow) {
        const { data: insertedInfo, error: errI } = await supabase.from('restaurant_info').insert([{
          name: RESTAURANT_INFO.name,
          address: RESTAURANT_INFO.address,
          phone: RESTAURANT_INFO.phone,
          opening_hours: RESTAURANT_INFO.openingHours,
          instagram: RESTAURANT_INFO.instagram,
          website: RESTAURANT_INFO.website,
          dining_style: RESTAURANT_INFO.diningStyle
        }]).select().single();
        
        if (!errI && insertedInfo) {
          infoRow = insertedInfo;
        } else {
          infoRow = {
            name: RESTAURANT_INFO.name,
            address: RESTAURANT_INFO.address,
            phone: RESTAURANT_INFO.phone,
            opening_hours: RESTAURANT_INFO.openingHours,
            instagram: RESTAURANT_INFO.instagram,
            website: RESTAURANT_INFO.website,
            dining_style: RESTAURANT_INFO.diningStyle
          };
        }
      }

      // Auto-Seed Table: chat_settings if empty
      if (!chatRow) {
        const { data: insertedChat, error: errC } = await supabase.from('chat_settings').insert([{
          whatsapp_number: RESTAURANT_INFO.whatsappNumber || '',
          whatsapp_default_message: RESTAURANT_INFO.whatsappMessage || '',
          line_id: RESTAURANT_INFO.lineId || '',
          line_qr_url: RESTAURANT_INFO.lineQrUrl || '',
          contact_active_channel: RESTAURANT_INFO.contactActiveChannel || 'both'
        }]).select().single();

        if (!errC && insertedChat) {
          chatRow = insertedChat;
        } else {
          chatRow = {
            whatsapp_number: RESTAURANT_INFO.whatsappNumber || '',
            whatsapp_default_message: RESTAURANT_INFO.whatsappMessage || '',
            line_id: RESTAURANT_INFO.lineId || '',
            line_qr_url: RESTAURANT_INFO.lineQrUrl || '',
            contact_active_channel: RESTAURANT_INFO.contactActiveChannel || 'both'
          };
        }
      }

      const mergedRes: RestaurantInfo = {
        name: infoRow.name,
        address: infoRow.address,
        phone: infoRow.phone,
        openingHours: infoRow.opening_hours,
        instagram: infoRow.instagram,
        website: infoRow.website,
        diningStyle: infoRow.dining_style,
        whatsappNumber: chatRow.whatsapp_number,
        whatsappMessage: chatRow.whatsapp_default_message,
        lineId: chatRow.line_id,
        lineQrUrl: chatRow.line_qr_url,
        contactActiveChannel: chatRow.contact_active_channel as any
      };

      setLocal('restaurant_info', mergedRes);
      return mergedRes;
    } catch (err) {
      console.error('Supabase getRestaurantInfo exception:', err);
      return getLocalOrStatic('restaurant_info', RESTAURANT_INFO);
    }
  },

  /**
   * Save general restaurant profile and chat settings
   */
  async saveRestaurantInfo(info: RestaurantInfo): Promise<void> {
    setLocal('restaurant_info', info);
    try {
      await adminApiFetch('save-restaurant-info', { info });
      console.log('Saved restaurant info to Supabase via API successfully.');
    } catch (err) {
      console.error('API error in saveRestaurantInfo:', err);
    }
  },

  /**
   * Get brand story and bullet milestones
   */
  async getAboutInfo(): Promise<AboutInfo> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return getLocalOrStatic('about_info', ABOUT_INFO);
    }

    try {
      let { data, error } = await supabase.from('about_info').select('*').limit(1);
      if (error) {
        console.warn('Supabase fetch about_info failed:', error);
        return getLocalOrStatic('about_info', ABOUT_INFO);
      }

      let row = data?.[0];
      if (!row) {
        // Auto-seed
        const { data: inserted, error: err } = await supabase.from('about_info').insert([{
          story_paragraphs: ABOUT_INFO.story,
          highlights: ABOUT_INFO.highlights
        }]).select().single();
        
        row = inserted || { story_paragraphs: ABOUT_INFO.story, highlights: ABOUT_INFO.highlights };
      }

      const mappedAbout: AboutInfo = {
        story: row.story_paragraphs || [],
        highlights: row.highlights || []
      };

      setLocal('about_info', mappedAbout);
      return mappedAbout;
    } catch (err) {
      console.error('Supabase getAboutInfo exception:', err);
      return getLocalOrStatic('about_info', ABOUT_INFO);
    }
  },

  /**
   * Save brand story and bullet milestones
   */
  async saveAboutInfo(about: AboutInfo): Promise<void> {
    setLocal('about_info', about);
    try {
      await adminApiFetch('save-about-info', { info: about });
      console.log('Saved about_info to Supabase via API successfully.');
    } catch (err) {
      console.error('API error in saveAboutInfo:', err);
    }
  },

  /**
   * Get dynamic listing of menu categories
   */
  async getCategories(): Promise<Category[]> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return getLocalOrStatic('categories', CATEGORIES);
    }

    try {
      let { data, error } = await supabase.from('categories').select('*').order('display_order');
      if (error) {
        console.warn('Supabase fetch categories failed:', error);
        return getLocalOrStatic('categories', CATEGORIES);
      }

      if (!data || data.length === 0) {
        // Auto-seed real items (filtering out virtual "all" category)
        const toSeed = CATEGORIES.filter(c => c.id !== 'all').map((c, idx) => ({
          id: c.id,
          slug: c.slug || generateSlug(c.label || c.name),
          name: c.name || c.label,
          label: c.label || c.name,
          sort_order: c.display_order || (idx + 1),
          display_order: c.display_order || (idx + 1),
          active: c.active !== false,
          is_visible: c.active !== false
        }));
        await supabase.from('categories').insert(toSeed);
        setLocal('categories', CATEGORIES);
        return CATEGORIES;
      }

      const dbCats = data.map(c => ({
        id: c.id,
        slug: c.slug || generateSlug(c.name || c.label || c.id),
        name: c.name || c.label || c.id,
        label: c.label || c.name || c.id,
        display_order: c.display_order !== undefined && c.display_order !== null ? Number(c.display_order) : (Number(c.sort_order) || 0),
        active: c.active !== undefined && c.active !== null ? !!c.active : (c.is_visible !== undefined && c.is_visible !== null ? !!c.is_visible : true)
      }));
      // Prepend 'All' category for UI compatibility
      const mergedCats = [{ id: 'all', slug: 'all', name: 'All', label: 'All', display_order: 0, active: true }, ...dbCats];
      setLocal('categories', mergedCats);
      return mergedCats;
    } catch (err) {
      console.error('Supabase getCategories exception:', err);
      return getLocalOrStatic('categories', CATEGORIES);
    }
  },

  /**
   * Save complete list of food categories
   */
  async saveCategories(cats: Category[]): Promise<void> {
    setLocal('categories', cats);
    try {
      const realCats = cats.filter(c => c.id !== 'all');
      
      const upsertRows = realCats.map((c, idx) => ({
        id: c.id,
        slug: c.slug || generateSlug(c.label || c.name || c.id),
        name: c.name || c.label || c.id,
        label: c.label || c.name || c.id,
        sort_order: c.display_order !== undefined ? c.display_order : (idx + 1),
        display_order: c.display_order !== undefined ? c.display_order : (idx + 1),
        is_visible: c.active !== false,
        active: c.active !== false,
        updated_at: new Date().toISOString()
      }));

      if (upsertRows.length > 0) {
        await adminApiFetch('save-categories', { categories: upsertRows });
      }
      console.log('Saved categories to Supabase via API successfully.');
    } catch (err) {
      console.error('API error in saveCategories:', err);
    }
  },

  /**
   * Get complete dynamic list of dishes and drinks
   */
  async getDishes(): Promise<Dish[]> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return getLocalOrStatic('dishes', DISHES);
    }

    try {
      let { data, error } = await supabase.from('foods').select('*').order('display_order');
      if (error) {
        console.warn('Supabase fetch foods failed, trying legacy or recovery:', error);
        // Fallback or retry ordering by id if display_order isn't added to table yet
        let fallbackQuery = await supabase.from('foods').select('*').order('id');
        if (fallbackQuery.error) {
          return getLocalOrStatic('dishes', DISHES);
        }
        data = fallbackQuery.data;
      }

      if (!data || data.length === 0) {
        // Auto-seed dishes
        const toSeed = DISHES.map(d => ({
          slug: d.slug || generateSlug(d.name),
          name: d.name,
          description: d.description,
          price_thb: d.priceTHB,
          category_id: d.category,
          veg: d.veg !== false,
          food_type: d.type,
          spice_level: d.spiceLevel,
          ingredients: d.ingredients || [],
          chef_special: d.chefSpecial,
          bestseller: d.bestseller,
          popular: d.popular !== false,
          customer_favorite: d.customerFavorite,
          today_special: d.todaySpecial,
          image_url: d.image,
          active: d.active !== false,
          is_available: d.active !== false,
          display_order: d.display_order || 0,
          display_order_today: d.display_order_today || 0,
          display_order_chef: d.display_order_chef || 0,
          display_order_popular: d.display_order_popular || 0,
          display_order_favorite: d.display_order_favorite || 0
        }));
        
        const { data: inserted, error: seedErr } = await supabase.from('foods').insert(toSeed).select();
        if (seedErr) {
          console.error('Failed to seed foods table:', seedErr);
          return DISHES;
        }
        const seededDishes = inserted.map(mapDbDishToDish);
        setLocal('dishes', seededDishes);
        return seededDishes;
      }

      const results = data.map(mapDbDishToDish);
      setLocal('dishes', results);
      return results;
    } catch (err) {
      console.error('Supabase getDishes exception:', err);
      return getLocalOrStatic('dishes', DISHES);
    }
  },

  /**
   * Save complete list of dishes (bulk upsert / prune sync)
   */
  async saveDishes(allDishes: Dish[]): Promise<void> {
    setLocal('dishes', allDishes);
    try {
      const rows = allDishes.map(d => {
        const mapped: any = {
          slug: d.slug || generateSlug(d.name),
          name: d.name,
          description: d.description,
          price_thb: d.priceTHB,
          category_id: d.category,
          food_type: d.type,
          veg: d.veg !== false,
          spice_level: d.spiceLevel,
          ingredients: d.ingredients || [],
          chef_special: d.chefSpecial,
          bestseller: d.bestseller,
          popular: d.popular !== false,
          customer_favorite: d.customerFavorite,
          today_special: d.todaySpecial,
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
        if (d.id && d.id > 0) {
          mapped.id = d.id;
        }
        return mapped;
      });

      await adminApiFetch('save-dishes', { dishes: rows });
      console.log('Saved dishes to Supabase via API successfully.');
    } catch (err) {
      console.error('API error in saveDishes:', err);
    }
  },

  /**
   * Get items curated for the photographic gallery grid
   */
  async getGalleryItems(): Promise<GalleryItem[]> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return getLocalOrStatic('gallery', GALLERY);
    }

    try {
      let { data, error } = await supabase.from('gallery').select('*').order('display_order');
      if (error) {
        console.warn('Supabase fetch gallery with display_order failed, trying sort_order:', error);
        let fallbackQuery = await supabase.from('gallery').select('*').order('sort_order');
        if (fallbackQuery.error) {
          return getLocalOrStatic('gallery', GALLERY);
        }
        data = fallbackQuery.data;
      }

      if (!data || data.length === 0) {
        const toSeed = GALLERY.map((item, idx) => ({
          title: item.title || item.alt || '',
          image_url: item.image,
          alt_text: item.alt || item.title || '',
          is_tall: item.tall,
          sort_order: item.display_order || (idx + 1),
          display_order: item.display_order || (idx + 1),
          active: item.active !== false,
          is_visible: item.active !== false
        }));
        await supabase.from('gallery').insert(toSeed);
        setLocal('gallery', GALLERY);
        return GALLERY;
      }

      const list = data.map(item => ({
        id: item.id?.toString(),
        title: item.title || item.alt_text || '',
        image: item.image_url,
        alt: item.alt_text || item.title || '',
        tall: item.is_tall,
        display_order: item.display_order !== undefined && item.display_order !== null ? Number(item.display_order) : (Number(item.sort_order) || 0),
        active: item.active !== undefined && item.active !== null ? !!item.active : (item.is_visible !== undefined && item.is_visible !== null ? !!item.is_visible : true)
      }));
      setLocal('gallery', list);
      return list;
    } catch (err) {
      console.error('Supabase getGalleryItems exception:', err);
      return getLocalOrStatic('gallery', GALLERY);
    }
  },

  /**
   * Save complete list of gallery items
   */
  async saveGalleryItems(items: GalleryItem[]): Promise<void> {
    setLocal('gallery', items);
    try {
      const rows = items.map((item, idx) => ({
        title: item.title || item.alt || '',
        image_url: item.image,
        alt_text: item.alt || item.title || '',
        is_tall: item.tall,
        sort_order: item.display_order || (idx + 1),
        display_order: item.display_order || (idx + 1),
        active: item.active !== false,
        is_visible: item.active !== false,
        updated_at: new Date().toISOString()
      }));
      
      await adminApiFetch('save-gallery', { gallery: rows });
      console.log('Saved gallery items to Supabase via API successfully.');
    } catch (err) {
      console.error('API error in saveGalleryItems:', err);
    }
  }
};
