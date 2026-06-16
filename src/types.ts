export interface Dish {
  id: number;
  slug: string;
  name: string;
  description: string;
  priceTHB: number;
  category: string; // matches category_id
  type: 'veg' | 'nonveg';
  veg: boolean; // matches veg BOOLEAN
  spiceLevel: string;
  ingredients: string[];
  chefSpecial: boolean;
  bestseller: boolean; // maps to bestseller
  popular: boolean; // maps to bestseller / popular as well
  customerFavorite: boolean;
  todaySpecial: boolean;
  image: string; // maps to image_url
  display_order: number;
  display_order_today: number;
  display_order_chef: number;
  display_order_popular: number;
  display_order_favorite: number;
  active?: boolean; // matches active BOOLEAN or is_available
}

export interface Category {
  id: string;
  slug: string;
  name: string; // matches name VARCHAR
  label: string; // maps to label / name for visual display UI
  display_order: number;
  active?: boolean; // matches active BOOLEAN or is_visible
}

export interface GalleryItem {
  id?: string;
  title?: string; // matches title VARCHAR
  image: string; // maps to image_url
  alt: string; // maps to alt_text or title
  tall: boolean; // maps to is_tall
  display_order: number;
  active?: boolean; // matches active BOOLEAN or is_visible
}

export interface RestaurantInfo {
  name: string;
  address: string;
  phone: string;
  openingHours: string;
  instagram: string;
  website: string;
  diningStyle: string;
  whatsappNumber?: string;
  whatsappMessage?: string;
  lineId?: string;
  lineQrUrl?: string;
  contactActiveChannel?: 'whatsapp' | 'line' | 'both' | 'disabled';
}

export interface AboutInfo {
  story: string[];
  highlights: string[];
}
