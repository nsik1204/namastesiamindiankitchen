import React, { useState, useMemo } from 'react';
import { MenuService } from "../../services/menuService";
import { uploadDishImage, fetchImageFromLink } from '../../services/storageService';
import { Dish, Category, RestaurantInfo, AboutInfo, GalleryItem } from '../../types';
import { useAdminAuth } from '../../context/AdminAuthContext';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Tag,
  Store,
  MessageSquare,
  Image as ImageIcon,
  Sparkles,
  ChefHat,
  Flame,
  Heart,
  Check,
  Plus,
  Trash2,
  Edit3,
  SlidersHorizontal,
  Upload,
  CheckCircle2,
  AlertCircle,
  Info,
  ArrowLeft,
  LogOut,
  Eye,
  EyeOff,
  RefreshCw,
  Phone,
  Clock,
  MapPin,
  Globe,
  Instagram,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Link as LinkIcon,
  ExternalLink
} from 'lucide-react';

interface AdminDashboardProps {
  dishes: Dish[];
  categories: Category[];
  restaurantInfo: RestaurantInfo;
  aboutInfo: AboutInfo;
  gallery: GalleryItem[];
  onUpdateDishes: (updatedDishes: Dish[]) => void;
  onUpdateRestaurantInfo: (updatedInfo: RestaurantInfo) => void;
  onUpdateAboutInfo: (updatedAbout: AboutInfo) => void;
  onUpdateCategories: (updatedCategories: Category[]) => void;
  onUpdateGallery: (updatedGallery: GalleryItem[]) => void;
  onClose: () => void;
  onLogout?: () => void;
}

export default function AdminDashboard({
  dishes,
  categories,
  restaurantInfo,
  aboutInfo,
  gallery,
  onUpdateDishes,
  onUpdateRestaurantInfo,
  onUpdateAboutInfo,
  onUpdateCategories,
  onUpdateGallery,
  onClose,
  onLogout
}: AdminDashboardProps) {
  const { logout } = useAdminAuth();
  
  // Navigation Tabs state
  const [activeTab, setActiveTab] = useState<'overview' | 'dishes' | 'categories' | 'restaurant' | 'chat' | 'gallery'>('overview');

  // File upload validation states
  const [foodImgValidation, setFoodImgValidation] = useState<{
    width: number;
    height: number;
    sizeMB: string;
    isCorrectSize: boolean;
    isCorrectDimensions: boolean;
  } | null>(null);

  const [galleryImgValidation, setGalleryImgValidation] = useState<{
    width: number;
    height: number;
    sizeMB: string;
    isCorrectSize: boolean;
    isCorrectDimensions: boolean;
  } | null>(null);

  const [editingGalleryIndex, setEditingGalleryIndex] = useState<number | null>(null);

  // Hidden references for file uploads
  const foodFileRef = React.useRef<HTMLInputElement>(null);
  const galleryFileRef = React.useRef<HTMLInputElement>(null);

  // Unified Alert/Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Simulates loading states for premium visual feel
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // Image Source Mode states (Device Upload vs. Instagram/Web Link)
  const [dishImageMode, setDishImageMode] = useState<'upload' | 'link'>('upload');
  const [dishLinkInput, setDishLinkInput] = useState<string>('');
  const [isFetchingLink, setIsFetchingLink] = useState<boolean>(false);

  const [galleryImageMode, setGalleryImageMode] = useState<'upload' | 'link'>('upload');
  const [galleryLinkInput, setGalleryLinkInput] = useState<string>('');
  const [isFetchingGalleryLink, setIsFetchingGalleryLink] = useState<boolean>(false);

  // Stats Derived States
  const stats = useMemo(() => {
    const totalDishes = dishes.length;
    const totalCats = categories.length;
    const subVeg = dishes.filter(d => d.type === 'veg').length;
    const subNonVeg = dishes.filter(d => d.type === 'nonveg').length;
    const todaysSpecialsCount = dishes.filter(d => d.todaySpecial).length;
    const chefRecsCount = dishes.filter(d => d.chefSpecial).length;
    const favoritesCount = dishes.filter(d => d.customerFavorite).length;
    const bestsellerCount = dishes.filter(d => d.bestseller).length;

    return {
      totalDishes,
      totalCats,
      subVeg,
      subNonVeg,
      todaysSpecialsCount,
      chefRecsCount,
      favoritesCount,
      bestsellerCount
    };
  }, [dishes, categories]);

  // ==========================================
  // DISH MANAGEMENT STATES & OPERATIONS
  // ==========================================
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [ingredientInput, setIngredientInput] = useState<string>('');
  const [dishForm, setDishForm] = useState<Partial<Dish>>({
    name: '',
    description: '',
    priceTHB: 0,
    category: categories[0]?.id || 'starters',
    type: 'veg',
    spiceLevel: '🌶 Mild',
    ingredients: [],
    chefSpecial: false,
    bestseller: false,
    customerFavorite: false,
    todaySpecial: false,
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1000&q=80'
  });

  const handleEditDish = (dish: Dish) => {
    setEditingDish(dish);
    setDishForm({ ...dish });
    showToast(`Loaded "${dish.name}" into editor`, 'info');
  };

  const handleCancelEditDish = () => {
    setEditingDish(null);
    setDishForm({
      name: '',
      description: '',
      priceTHB: 150,
      category: categories[0]?.id || 'starters',
      type: 'veg',
      spiceLevel: '🌶 Mild',
      ingredients: [],
      chefSpecial: false,
      bestseller: false,
      customerFavorite: false,
      todaySpecial: false,
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1000&q=80'
    });
  };

  const handleSaveDishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dishForm.name?.trim() || !dishForm.description?.trim()) {
      showToast('Name and Description are required.', 'error');
      return;
    }
    if ((dishForm.priceTHB ?? 0) < 0) {
      showToast('Price cannot be negative.', 'error');
      return;
    }
    
    // Validate category exists
    const validCategories = categories.filter(c => c.id !== 'all');
    if (!validCategories.some(c => c.id === dishForm.category)) {
      showToast('Invalid category selected. Please choose a valid category.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      if (editingDish) {
        const updatedDish = { ...editingDish, ...dishForm } as Dish;
        const savedDish = await MenuService.saveDish(updatedDish);
        const updatedDishes = dishes.map(d => d.id === savedDish.id ? savedDish : d);
        onUpdateDishes(updatedDishes);
        showToast(`Dish "${savedDish.name}" updated successfully!`);
        setEditingDish(null);
      } else {
        const numericIds = dishes.map(d => Number(d.id)).filter(n => !isNaN(n));
        const nextId = numericIds.length > 0 ? Math.max(...numericIds) + 1 : 1;
        const nextOrder = dishes.length > 0 ? Math.max(...dishes.map(d => d.display_order || 0)) + 1 : 1;
        
        const newDish = {
          ...dishForm,
          id: nextId,
          display_order: dishForm.display_order || nextOrder,
          display_order_today: dishForm.display_order_today || nextOrder,
          display_order_chef: dishForm.display_order_chef || nextOrder,
          display_order_popular: dishForm.display_order_popular || nextOrder,
          display_order_favorite: dishForm.display_order_favorite || nextOrder,
          active: true
        } as Dish;
        
        const savedDish = await MenuService.saveDish(newDish);
        const updatedDishes = [savedDish, ...dishes];
        onUpdateDishes(updatedDishes);
        showToast(`Dish "${savedDish.name}" added successfully!`);
      }
      handleCancelEditDish();
    } catch (err) {
      console.error('Failed to save dish:', err);
      const msg = err instanceof Error ? err.message : 'Failed to save dish';
      if (msg.includes('fk_foods_category')) {
        showToast('Error: Selected category does not exist in database. Please create the category first.', 'error');
      } else {
        showToast(msg, 'error');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleDisableDish = async (dish: Dish) => {
    setIsSaving(true);
    try {
      const updatedDish = { ...dish, active: !dish.active };
      const savedDish = await MenuService.saveDish(updatedDish);
      const updatedDishes = dishes.map(d => d.id === savedDish.id ? savedDish : d);
      onUpdateDishes(updatedDishes);
      showToast(savedDish.active ? 'Dish re-enabled' : 'Dish hidden from menu', 'info');
    } catch (err) {
      console.error('Failed to toggle dish:', err);
      showToast(err instanceof Error ? err.message : 'Failed to toggle state.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleDisableCategory = async (cat: Category) => {
    setIsSaving(true);
    try {
      const active = !cat.active;
      const updated = categories.map(c => c.id === cat.id ? { ...c, active } : c);
      await MenuService.saveCategories(updated);
      onUpdateCategories(updated);
      showToast(active ? 'Category re-enabled' : 'Category hidden from menu', 'info');
    } catch (err) {
      console.error('Failed to toggle category active state:', err);
      showToast(err instanceof Error ? err.message : 'Failed to toggle active state', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteDish = async (id: number, name: string) => {
    if (window.confirm(`WARNING: You are about to permanently delete "${name}".\n\nThis action cannot be undone.\n\nAre you sure you want to proceed?`)) {
      setIsSaving(true);
      try {
        await MenuService.deleteDish(id);
        const updatedDishes = dishes.filter(d => d.id !== id);
        onUpdateDishes(updatedDishes);
        showToast(`Permanently deleted "${name}".`, 'info');
      } catch (err) {
        console.error('Failed to delete dish:', err);
        showToast(err instanceof Error ? err.message : `Failed to delete "${name}".`, 'error');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleAddIngredient = () => {
    if (ingredientInput.trim()) {
      const currentList = dishForm.ingredients || [];
      if (currentList.includes(ingredientInput.trim())) {
        showToast('Ingredient already added.', 'info');
        return;
      }
      setDishForm({
        ...dishForm,
        ingredients: [...currentList, ingredientInput.trim()]
      });
      setIngredientInput('');
    }
  };

  const handleRemoveIngredient = (index: number) => {
    if (dishForm.ingredients) {
      setDishForm({
        ...dishForm,
        ingredients: dishForm.ingredients.filter((_, i) => i !== index)
      });
    }
  };

  // Dish photo upload from device (uploads to Supabase Storage + fallback)
  const handleFoodFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSizeBytes = 2 * 1024 * 1024;
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    if (file.size > maxSizeBytes) {
      showToast(`Selected file is too large (${sizeInMB} MB). Max limit is 2 MB.`, 'error');
      return;
    }

    setUploadProgress(30);
    try {
      const res = await uploadDishImage(file, dishForm.name || 'dish', 'food-images');
      setDishForm(curr => ({ ...curr, image: res.url }));
      const isDimOk = res.width === 1200 && res.height === 1200;
      setFoodImgValidation({
        width: res.width || 1200,
        height: res.height || 1200,
        sizeMB: res.sizeMB || sizeInMB,
        isCorrectSize: true,
        isCorrectDimensions: isDimOk
      });
      setUploadProgress(100);
      setTimeout(() => setUploadProgress(null), 300);
      showToast(res.source === 'supabase' ? 'Photo uploaded to Supabase Storage!' : 'Photo loaded successfully!');
    } catch (err: any) {
      setUploadProgress(null);
      showToast(err.message || 'Failed to upload photo.', 'error');
    }
  };

  // Fetch dish photo from Instagram post or external link
  const handleFetchDishLink = async () => {
    if (!dishLinkInput.trim()) {
      showToast('Please enter an Instagram post link or image URL.', 'error');
      return;
    }
    setIsFetchingLink(true);
    try {
      const res = await fetchImageFromLink(dishLinkInput, dishForm.name || 'dish', 'food-images');
      setDishForm(curr => ({ ...curr, image: res.url }));
      const isDimOk = res.width === 1200 && res.height === 1200;
      setFoodImgValidation({
        width: res.width || 1200,
        height: res.height || 1200,
        sizeMB: res.sizeMB || '1.0',
        isCorrectSize: true,
        isCorrectDimensions: isDimOk
      });
      showToast(res.source === 'supabase' ? 'Image fetched & saved to Supabase Storage!' : 'Image loaded from link!');
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch image from link.', 'error');
    } finally {
      setIsFetchingLink(false);
    }
  };

  // Gallery photo upload from device
  const handleGalleryFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSizeBytes = 2 * 1024 * 1024;
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    if (file.size > maxSizeBytes) {
      showToast(`Selected file is too large (${sizeInMB} MB). Max limit is 2 MB.`, 'error');
      return;
    }

    setUploadProgress(30);
    try {
      const res = await uploadDishImage(file, 'ambience-gallery', 'gallery');
      setGalleryForm(curr => ({ ...curr, image: res.url }));
      const isDimOk = res.width === 1600 && res.height === 900;
      setGalleryImgValidation({
        width: res.width || 1600,
        height: res.height || 900,
        sizeMB: res.sizeMB || sizeInMB,
        isCorrectSize: true,
        isCorrectDimensions: isDimOk
      });
      setUploadProgress(100);
      setTimeout(() => setUploadProgress(null), 300);
      showToast(res.source === 'supabase' ? 'Gallery photo uploaded to Supabase Storage!' : 'Gallery photo loaded!');
    } catch (err: any) {
      setUploadProgress(null);
      showToast(err.message || 'Failed to upload gallery photo.', 'error');
    }
  };

  // Fetch gallery photo from Instagram post or external link
  const handleFetchGalleryLink = async () => {
    if (!galleryLinkInput.trim()) {
      showToast('Please enter an Instagram post link or image URL.', 'error');
      return;
    }
    setIsFetchingGalleryLink(true);
    try {
      const res = await fetchImageFromLink(galleryLinkInput, 'ambience-gallery', 'gallery');
      setGalleryForm(curr => ({ ...curr, image: res.url }));
      const isDimOk = res.width === 1600 && res.height === 900;
      setGalleryImgValidation({
        width: res.width || 1600,
        height: res.height || 900,
        sizeMB: res.sizeMB || '1.0',
        isCorrectSize: true,
        isCorrectDimensions: isDimOk
      });
      showToast(res.source === 'supabase' ? 'Gallery photo saved to Supabase Storage!' : 'Gallery photo loaded!');
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch gallery image from link.', 'error');
    } finally {
      setIsFetchingGalleryLink(false);
    }
  };

  const moveGalleryItem = (index: number, direction: 'up' | 'down') => {
    const newItems = [...gallery];
    const destinationIndex = direction === 'up' ? index - 1 : index + 1;
    if (destinationIndex >= 0 && destinationIndex < newItems.length) {
      const temp = newItems[index];
      newItems[index] = newItems[destinationIndex];
      newItems[destinationIndex] = temp;
      onUpdateGallery(newItems);
      showToast('Gallery item order updated successfully!');
    }
  };

  const handleEditGalleryItem = (index: number) => {
    const item = gallery[index];
    setEditingGalleryIndex(index);
    setGalleryForm({
      image: item.image,
      alt: item.alt,
      tall: !!item.tall
    });
    setGalleryImgValidation(null);
    showToast(`Loaded gallery asset #${index + 1} for replacing.`, 'info');
  };

  const handleCancelEditGalleryItem = () => {
    setEditingGalleryIndex(null);
    setGalleryForm({
      image: 'https://images.unsplash.com/photo-1528605105345-5344ea20e269?auto=format&fit=crop&w=1200&q=80',
      alt: '',
      tall: false
    });
    setGalleryImgValidation(null);
  };

  const handleUpdateCategoryOrder = (catId: string, newOrder: number) => {
    const updated = categories.map(c => {
      if (c.id === catId) {
        return { ...c, display_order: newOrder };
      }
      return c;
    });
    onUpdateCategories(updated);
    showToast('Category sort order updated successfully!');
  };

  const handleUpdateDishOrderField = (dishId: number, field: 'display_order' | 'display_order_today' | 'display_order_chef' | 'display_order_popular' | 'display_order_favorite', newVal: number) => {
    const updated = dishes.map(d => {
      if (d.id === dishId) {
        return { ...d, [field]: newVal };
      }
      return d;
    });
    onUpdateDishes(updated);
    showToast('Dish sort order updated successfully!');
  };

  const handleUpdateGalleryOrder = (index: number, newOrder: number) => {
    const updated = [...gallery];
    updated[index] = { ...updated[index], display_order: newOrder };
    onUpdateGallery(updated);
    showToast('Gallery sort order updated successfully!');
  };

  const handleUpdateDishActive = async (dishId: number, active: boolean, actionType: string) => {
    setIsSaving(true);
    try {
      const dish = dishes.find(d => d.id === dishId);
      if (!dish) return;
      const updatedDish = { ...dish, active };
      const savedDish = await MenuService.saveDish(updatedDish);
      const updatedDishes = dishes.map(d => d.id === savedDish.id ? savedDish : d);
      onUpdateDishes(updatedDishes);
      
      let label = 'updated';
      if (actionType === 'hidden') label = 'hidden from public view';
      if (actionType === 'disabled') label = 'disabled';
      if (actionType === 'shown') label = 'restored to menu';
      if (actionType === 'enabled') label = 'enabled and active';
      if (actionType === 'restored') label = 'restored to active status';
      showToast(`Dish was successfully ${label}!`);
    } catch (err) {
      console.error('Failed to update dish active state:', err);
      showToast(err instanceof Error ? err.message : 'Failed to update state.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateCategoryActive = (catId: string, active: boolean, actionType: string) => {
    const updated = categories.map(c => {
      if (c.id === catId) {
        return { ...c, active };
      }
      return c;
    });
    onUpdateCategories(updated);

    let label = 'updated';
    if (actionType === 'hidden') label = 'hidden from menu';
    if (actionType === 'disabled') label = 'disabled';
    if (actionType === 'soft_deleted') label = 'marked inactive';
    if (actionType === 'shown') label = 'restored to menu';
    if (actionType === 'enabled') label = 'enabled and active';
    if (actionType === 'restored') label = 'restored to active status';

    showToast(`Category tab was successfully ${label}!`);
  };

  const handleUpdateGalleryActive = (index: number, active: boolean, actionType: string) => {
    const updated = [...gallery];
    updated[index] = { ...updated[index], active };
    onUpdateGallery(updated);

    let label = 'updated';
    if (actionType === 'hidden') label = 'hidden from public view';
    if (actionType === 'disabled') label = 'disabled';
    if (actionType === 'soft_deleted') label = 'marked inactive';
    if (actionType === 'shown') label = 'restored to gallery';
    if (actionType === 'enabled') label = 'enabled';
    if (actionType === 'restored') label = 'restored to active status';

    showToast(`Gallery picture was successfully ${label}!`);
  };

  // ==========================================
  // CATEGORIES MANAGEMENT STATES & OPERATIONS
  // ==========================================
  const [newCatId, setNewCatId] = useState<string>('');
  const [newCatLabel, setNewCatLabel] = useState<string>('');

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = newCatId.trim().toLowerCase().replace(/[^a-z0-9]/g, '-');
    const label = newCatLabel.trim();

    if (!cleanId || !label) {
      showToast('Please provide both Category ID and Display Name.', 'error');
      return;
    }

    if (categories.some(c => c.id === cleanId)) {
      showToast('Category ID already exists.', 'error');
      return;
    }

    const nextOrder = categories.length > 0 ? Math.max(...categories.map(c => c.display_order || 0)) + 1 : 1;
    onUpdateCategories([
      ...categories,
      {
        id: cleanId,
        slug: cleanId,
        name: label,
        label: label,
        display_order: nextOrder,
        active: true
      }
    ]);
    setNewCatId('');
    setNewCatLabel('');
    showToast(`Added category: "${label}"`);
  };

  const handleDeleteCategory = async (id: string, label: string) => {
    if (id === 'all') {
      showToast('Standard "All" filter category cannot be deleted.', 'error');
      return;
    }

    const attachedDishesCount = dishes.filter(d => d.category === id).length;
    if (attachedDishesCount > 0) {
      showToast(
        `Cannot delete "${label}". It has ${attachedDishesCount} linked dishes. Please reassign or delete them first.`, 
        'error'
      );
      return;
    }

    if (!window.confirm(`WARNING: You are about to permanently delete "${label}".\n\nThis action cannot be undone.\n\nAre you sure you want to proceed?`)) {
      return;
    }

    setIsSaving(true);
    try {
      await MenuService.deleteCategory(id);
      const freshCategories = await MenuService.getCategories();
      onUpdateCategories(freshCategories);
      showToast(`Permanently deleted category "${label}".`, 'info');
    } catch (err) {
      console.error('Failed to delete category:', err);
      const msg = err instanceof Error ? err.message : `Failed to delete category "${label}".`;
      if (msg.includes('foreign key')) {
        showToast('Database blocked deletion due to linked dishes.', 'error');
      } else {
        showToast(msg, 'error');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // ==========================================
  // SETTINGS & PROFILE STORY STATES & OPERATIONS
  // ==========================================
  const [profileForm, setProfileForm] = useState<RestaurantInfo>({ ...restaurantInfo });
  const [aboutForm, setAboutForm] = useState<AboutInfo>({ ...aboutInfo });
  const [storyInput, setStoryInput] = useState<string>(aboutInfo.story.join('\n'));
  const [highlightInput, setHighlightInput] = useState<string>('');

  const handleSaveProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 600));

    const parsedStory = storyInput
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    onUpdateRestaurantInfo({ ...profileForm });
    onUpdateAboutInfo({
      story: parsedStory,
      highlights: aboutForm.highlights
    });

    setIsSaving(false);
    showToast('Restaurant details and story saved successfully!');
  };

  const handleAddHighlight = () => {
    if (highlightInput.trim()) {
      if (aboutForm.highlights.includes(highlightInput.trim())) {
        showToast('Highlight already exists.', 'info');
        return;
      }
      setAboutForm({
        ...aboutForm,
        highlights: [...aboutForm.highlights, highlightInput.trim()]
      });
      setHighlightInput('');
    }
  };

  const handleRemoveHighlight = (index: number) => {
    setAboutForm({
      ...aboutForm,
      highlights: aboutForm.highlights.filter((_, i) => i !== index)
    });
  };

  // ==========================================
  // CHAT PLUGINS STATES & OPERATIONS
  // ==========================================
  const [chatForm, setChatForm] = useState({
    whatsappNumber: restaurantInfo.whatsappNumber || '',
    whatsappMessage: restaurantInfo.whatsappMessage || '',
    lineId: restaurantInfo.lineId || '',
    lineQrUrl: restaurantInfo.lineQrUrl || '',
    contactActiveChannel: restaurantInfo.contactActiveChannel || 'both'
  });

  const handleSaveChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 500));

    onUpdateRestaurantInfo({
      ...restaurantInfo,
      whatsappNumber: chatForm.whatsappNumber,
      whatsappMessage: chatForm.whatsappMessage,
      lineId: chatForm.lineId,
      lineQrUrl: chatForm.lineQrUrl,
      contactActiveChannel: chatForm.contactActiveChannel
    });

    setIsSaving(false);
    showToast('WhatsApp & LINE settings saved successfully!');
  };

  // ==========================================
  // GALLERY MANAGEMENT STATES & OPERATIONS
  // ==========================================
  const [galleryForm, setGalleryForm] = useState({
    image: 'https://images.unsplash.com/photo-1528605105345-5344ea20e269?auto=format&fit=crop&w=1200&q=80',
    alt: '',
    tall: false
  });

  const handleAddGalleryItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!galleryForm.image || !galleryForm.alt.trim()) {
      showToast('Image URL and description are required.', 'error');
      return;
    }

    const nextOrder = gallery.length > 0 ? Math.max(...gallery.map(g => g.display_order || 0)) + 1 : 1;
    const newItem: GalleryItem = {
      image: galleryForm.image,
      alt: galleryForm.alt.trim(),
      tall: galleryForm.tall,
      display_order: nextOrder
    };

    if (editingGalleryIndex !== null) {
      const updated = [...gallery];
      const existingItem = gallery[editingGalleryIndex];
      updated[editingGalleryIndex] = { ...newItem, display_order: existingItem.display_order || nextOrder };
      onUpdateGallery(updated);
      showToast('Gallery image replaced successfully!');
      setEditingGalleryIndex(null);
    } else {
      onUpdateGallery([...gallery, newItem]);
      showToast('New ambience photo added to gallery!');
    }

    setGalleryForm({
      image: 'https://images.unsplash.com/photo-1528605105345-5344ea20e269?auto=format&fit=crop&w=1200&q=80',
      alt: '',
      tall: false
    });
    setGalleryImgValidation(null);
  };

  const handleDeleteGalleryItem = (index: number) => {
    if (window.confirm('WARNING: You are about to permanently delete this photo.\n\nThis action cannot be undone.\n\nAre you sure you want to proceed?')) {
      const updated = gallery.filter((_, i) => i !== index);
      onUpdateGallery(updated);
      showToast('Permanently deleted gallery image.', 'info');
    }
  };

  // ==========================================
  // OVERVIEW QUICK ACCESS OPERATIONS
  // ==========================================
  const handleTogglePromoOnDish = (dishId: number, flag: 'todaySpecial' | 'chefSpecial' | 'bestseller' | 'customerFavorite') => {
    const updated = dishes.map(d => {
      if (d.id === dishId) {
        const nextVal = !d[flag];
        if (flag === 'todaySpecial' && nextVal) {
          return { ...d, [flag]: true };
        }
        return { ...d, [flag]: nextVal };
      }
      if (flag === 'todaySpecial') {
        const isEnablingTarget = !dishes.find(item => item.id === dishId)?.[flag];
        if (isEnablingTarget) {
          return { ...d, todaySpecial: false };
        }
      }
      return d;
    });
    onUpdateDishes(updated);
    showToast('Promotion status toggled.');
  };

  return (
    <div className="min-h-screen bg-[#FDF8F1] text-[#2B1A0E] font-body antialiased flex flex-col">
      
      {/* Toast Alert Banner */}
      {toast && (
        <div 
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold transition-all duration-300 flex items-center gap-2.5 ${
            toast.type === 'error' ? 'bg-[#FFF2F2] border-[#F2B8B5] text-[#9B1C1C]' : 
            toast.type === 'info' ? 'bg-[#EFF6FF] border-[#BFDBFE] text-[#1E40AF]' :
            'bg-[#FFFDF9] border-[#E08A2B]/40 text-[#2B1A0E]'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-[#9B1C1C] shrink-0" />
          ) : toast.type === 'info' ? (
            <Info className="w-4 h-4 text-[#1E40AF] shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-[#A90E02] shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* FIXED HEADER NAVBAR */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-[#FFFDF9]/95 backdrop-blur-md border-b border-[rgba(122,74,34,0.16)] z-30 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[rgba(169,14,2,0.08)] border border-[rgba(169,14,2,0.2)] flex items-center justify-center shrink-0">
            <SlidersHorizontal className="w-4 h-4 text-[#A90E02]" />
          </div>
          <div>
            <h1 className="font-extrabold text-[#A90E02] text-base leading-tight tracking-tight">{restaurantInfo.name}</h1>
            <p className="text-xs font-semibold text-[#8C5E2D] tracking-wide">Control Console • Super Admin</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {isSaving && (
            <span className="text-xs text-[#A90E02] bg-[rgba(169,14,2,0.08)] border border-[rgba(169,14,2,0.2)] px-3 py-1 rounded-full font-semibold flex items-center gap-1.5 animate-pulse">
              <RefreshCw className="w-3 h-3 animate-spin" />
              Saving database...
            </span>
          )}
          <button 
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 text-xs bg-[#A90E02] hover:bg-[#8A0B02] text-[#FFFDF9] font-bold py-2 px-4 rounded-full transition-colors shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Public Site
          </button>
          <button 
            type="button"
            onClick={async () => {
              await logout();
              if (onLogout) onLogout();
            }}
            className="inline-flex items-center gap-1.5 text-xs text-[#735B43] hover:text-[#A90E02] font-semibold transition-colors px-2.5 py-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </header>

      {/* DASHBOARD CONTENT BODY */}
      <div className="flex-1 pt-16 flex flex-col md:flex-row">
        
        {/* Left Side Tab Navigator Panel */}
        <aside className="w-full md:w-64 bg-[#FFFDF9] border-r border-b md:border-b-0 border-[rgba(122,74,34,0.16)] p-3 md:p-4 flex md:flex-col gap-1.5 overflow-x-auto md:overflow-y-auto md:sticky md:top-16 md:h-[calc(100vh-64px)] shrink-0">
          <div className="text-xs font-bold text-[#8C5E2D] uppercase tracking-wider px-3 py-1 mb-1 hidden md:block">
            Consoles
          </div>
          
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`shrink-0 md:w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
              activeTab === 'overview' 
                ? 'bg-[#A90E02] text-[#FFFDF9] shadow-xs font-bold' 
                : 'text-[#2B1A0E] hover:bg-[rgba(224,138,43,0.08)] hover:text-[#A90E02]'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            Command Overview
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('dishes')}
            className={`shrink-0 md:w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
              activeTab === 'dishes' 
                ? 'bg-[#A90E02] text-[#FFFDF9] shadow-xs font-bold' 
                : 'text-[#2B1A0E] hover:bg-[rgba(224,138,43,0.08)] hover:text-[#A90E02]'
            }`}
          >
            <UtensilsCrossed className="w-4 h-4 shrink-0" />
            Cuisine Catalog
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('categories')}
            className={`shrink-0 md:w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
              activeTab === 'categories' 
                ? 'bg-[#A90E02] text-[#FFFDF9] shadow-xs font-bold' 
                : 'text-[#2B1A0E] hover:bg-[rgba(224,138,43,0.08)] hover:text-[#A90E02]'
            }`}
          >
            <Tag className="w-4 h-4 shrink-0" />
            Menu Categories
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('restaurant')}
            className={`shrink-0 md:w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
              activeTab === 'restaurant' 
                ? 'bg-[#A90E02] text-[#FFFDF9] shadow-xs font-bold' 
                : 'text-[#2B1A0E] hover:bg-[rgba(224,138,43,0.08)] hover:text-[#A90E02]'
            }`}
          >
            <Store className="w-4 h-4 shrink-0" />
            Brand Profile & Story
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`shrink-0 md:w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
              activeTab === 'chat' 
                ? 'bg-[#A90E02] text-[#FFFDF9] shadow-xs font-bold' 
                : 'text-[#2B1A0E] hover:bg-[rgba(224,138,43,0.08)] hover:text-[#A90E02]'
            }`}
          >
            <MessageSquare className="w-4 h-4 shrink-0" />
            WhatsApp & LINE Setup
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('gallery')}
            className={`shrink-0 md:w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
              activeTab === 'gallery' 
                ? 'bg-[#A90E02] text-[#FFFDF9] shadow-xs font-bold' 
                : 'text-[#2B1A0E] hover:bg-[rgba(224,138,43,0.08)] hover:text-[#A90E02]'
            }`}
          >
            <ImageIcon className="w-4 h-4 shrink-0" />
            Ambience Gallery
          </button>

          <div className="border-t border-[rgba(122,74,34,0.12)] my-3 pt-3 px-1 hidden md:block">
            <div className="bg-[#FDF8F1] p-3 rounded-xl border border-[rgba(122,74,34,0.14)] space-y-1.5">
              <span className="text-xs font-bold text-[#8C5E2D] uppercase tracking-wider block">Live Session</span>
              <span className="block text-xs text-[#2B1A0E] font-medium truncate">Role: Administrator</span>
              <div className="flex items-center gap-2 text-xs text-[#2B1A0E] font-medium pt-0.5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-200"></span>
                <span>Status: Active</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Right Dynamic Target Output Page Panel */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-5xl">
          
          {/* ====================================================================
              VIEW A: OVERVIEW RADAR DASHBOARD
              ==================================================================== */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              
              {/* Top Banner metrics overview */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#FFFDF9] p-5 rounded-2xl border border-[rgba(122,74,34,0.14)] shadow-[0_2px_12px_rgba(61,31,0,0.04)] space-y-1.5">
                  <span className="text-xs text-[#735B43] font-semibold tracking-wide uppercase block">Total Cuisine Items</span>
                  <div className="text-3xl font-extrabold text-[#2B1A0E] tracking-tight">{stats.totalDishes}</div>
                  <span className="text-xs text-[#8C7358] font-medium block">
                    {stats.subVeg} Veg • {stats.subNonVeg} Non-Veg
                  </span>
                </div>
                
                <div className="bg-[#FFFDF9] p-5 rounded-2xl border border-[rgba(122,74,34,0.14)] shadow-[0_2px_12px_rgba(61,31,0,0.04)] space-y-1.5">
                  <span className="text-xs text-[#735B43] font-semibold tracking-wide uppercase block">Menu Categories</span>
                  <div className="text-3xl font-extrabold text-[#2B1A0E] tracking-tight">{stats.totalCats}</div>
                  <span className="text-xs text-[#8C7358] font-medium block">Active Filter Tabs</span>
                </div>

                <div className="bg-[#FFFDF9] p-5 rounded-2xl border border-[rgba(122,74,34,0.14)] shadow-[0_2px_12px_rgba(61,31,0,0.04)] space-y-1.5">
                  <span className="text-xs text-[#735B43] font-semibold tracking-wide uppercase block">Today's Promotion</span>
                  <div className={`text-3xl font-extrabold tracking-tight ${stats.todaysSpecialsCount > 0 ? 'text-[#A90E02]' : 'text-[#735B43]'}`}>
                    {stats.todaysSpecialsCount > 0 ? 'LIVE' : 'OFF'}
                  </div>
                  <span className="text-xs text-[#8C7358] font-medium block truncate">
                    {stats.todaysSpecialsCount} items featured
                  </span>
                </div>

                <div className="bg-[#FFFDF9] p-5 rounded-2xl border border-[rgba(122,74,34,0.14)] shadow-[0_2px_12px_rgba(61,31,0,0.04)] space-y-1.5">
                  <span className="text-xs text-[#735B43] font-semibold tracking-wide uppercase block">Ambience Photo Assets</span>
                  <div className="text-3xl font-extrabold text-[#2B1A0E] tracking-tight">{gallery.length}</div>
                  <span className="text-xs text-[#8C7358] font-medium block">High-resolution assets</span>
                </div>
              </div>

              {/* Special Promoters Board quick control switches */}
              <div className="bg-[#FFFDF9] rounded-2xl border border-[rgba(122,74,34,0.14)] shadow-[0_2px_12px_rgba(61,31,0,0.04)] p-6 space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[rgba(169,14,2,0.08)] flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-[#A90E02]" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#2B1A0E]">Fast Promotion Manager</h3>
                    <p className="text-xs text-[#735B43] mt-0.5">Toggle live customer spotlight segments: Today's Specials, Chef's Choices, Bestsellers, and Customer Favorites.</p>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-[rgba(122,74,34,0.12)]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#F8F2E8] border-b border-[rgba(122,74,34,0.14)] text-[#735B43] font-bold text-xs uppercase tracking-wider">
                        <th className="py-3 px-4">Cuisine Title</th>
                        <th className="py-3 px-4 text-center">
                          <span className="inline-flex items-center gap-1.5 justify-center">
                            <Sparkles className="w-3.5 h-3.5 text-[#C27318]" />
                            Today's Special
                          </span>
                        </th>
                        <th className="py-3 px-4 text-center">
                          <span className="inline-flex items-center gap-1.5 justify-center">
                            <ChefHat className="w-3.5 h-3.5 text-[#A90E02]" />
                            Chef Choice
                          </span>
                        </th>
                        <th className="py-3 px-4 text-center">
                          <span className="inline-flex items-center gap-1.5 justify-center">
                            <Flame className="w-3.5 h-3.5 text-[#E08A2B]" />
                            Bestseller
                          </span>
                        </th>
                        <th className="py-3 px-4 text-center">
                          <span className="inline-flex items-center gap-1.5 justify-center">
                            <Heart className="w-3.5 h-3.5 text-[#A90E02]" />
                            Favorite
                          </span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgba(122,74,34,0.08)] bg-white">
                      {dishes.slice(0, 10).map(dish => (
                        <tr key={dish.id} className="hover:bg-[#FDF8F1]/60 transition-colors">
                          <td className="py-3 px-4 font-semibold text-[#2B1A0E] truncate max-w-[200px]">
                            <div className="font-semibold text-sm text-[#2B1A0E]">{dish.name}</div>
                            <span className="text-[11px] font-semibold text-[#8C5E2D] tracking-wide uppercase mt-0.5 block">
                              {dish.category}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleTogglePromoOnDish(dish.id, 'todaySpecial')}
                              className={`px-3 py-1 text-xs font-bold rounded-full transition-all border ${
                                dish.todaySpecial 
                                  ? 'bg-[#FDF3E3] text-[#A65B0A] border-[#E5A33C]/50 shadow-xs' 
                                  : 'bg-white text-[#8C7358] border-[rgba(122,74,34,0.2)] hover:border-[#A90E02]/50 hover:text-[#A90E02]'
                              }`}
                            >
                              {dish.todaySpecial ? 'Active' : 'Enable'}
                            </button>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleTogglePromoOnDish(dish.id, 'chefSpecial')}
                              className={`px-3 py-1 text-xs font-bold rounded-full transition-all border ${
                                dish.chefSpecial 
                                  ? 'bg-[#FDF0EE] text-[#A90E02] border-[#A90E02]/30 shadow-xs' 
                                  : 'bg-white text-[#8C7358] border-[rgba(122,74,34,0.2)] hover:border-[#A90E02]/50 hover:text-[#A90E02]'
                              }`}
                            >
                              {dish.chefSpecial ? 'Active' : 'Enable'}
                            </button>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleTogglePromoOnDish(dish.id, 'bestseller')}
                              className={`px-3 py-1 text-xs font-bold rounded-full transition-all border ${
                                dish.bestseller 
                                  ? 'bg-[#FDF2EA] text-[#B84A12] border-[#B84A12]/40 shadow-xs' 
                                  : 'bg-white text-[#8C7358] border-[rgba(122,74,34,0.2)] hover:border-[#A90E02]/50 hover:text-[#A90E02]'
                              }`}
                            >
                              {dish.bestseller ? 'Active' : 'Enable'}
                            </button>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleTogglePromoOnDish(dish.id, 'customerFavorite')}
                              className={`px-3 py-1 text-xs font-bold rounded-full transition-all border ${
                                dish.customerFavorite 
                                  ? 'bg-[#FAF0F3] text-[#912042] border-[#912042]/40 shadow-xs' 
                                  : 'bg-white text-[#8C7358] border-[rgba(122,74,34,0.2)] hover:border-[#A90E02]/50 hover:text-[#A90E02]'
                              }`}
                            >
                              {dish.customerFavorite ? 'Active' : 'Enable'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {dishes.length > 10 && (
                    <div className="text-center py-3 text-xs text-[#8C7358] bg-[#FDF8F1] border-t border-[rgba(122,74,34,0.1)]">
                      Showing first 10 items. Manage complete catalog under the "Cuisine Catalog" console.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ====================================================================
              VIEW B: CUISINE CATALOG MANAGEMENT
              ==================================================================== */}
          {activeTab === 'dishes' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              
              {/* CUISINE DISH FORM COMPILER PANEL (LEFT/TOP SIDE 5 COLS) */}
              <div className="lg:col-span-5 bg-[#FFFDF9] p-5 rounded-2xl border border-[rgba(122,74,34,0.14)] shadow-[0_2px_12px_rgba(61,31,0,0.04)] space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[rgba(169,14,2,0.08)] flex items-center justify-center shrink-0">
                    {editingDish ? <Edit3 className="w-4 h-4 text-[#A90E02]" /> : <Plus className="w-4 h-4 text-[#A90E02]" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-[#2B1A0E]">
                      {editingDish ? 'Edit Dish Details' : 'Add New Dish'}
                    </h3>
                    <p className="text-xs text-[#735B43] mt-0.5">Configure dish information, pricing, tags, and cover image.</p>
                  </div>
                </div>

                <form onSubmit={handleSaveDishSubmit} className="space-y-4 text-xs font-medium text-[#2B1A0E]">
                  <div>
                    <label className="block text-xs font-bold text-[#47311B] uppercase tracking-wider mb-1">Cuisine Name</label>
                    <input
                      type="text"
                      value={dishForm.name}
                      onChange={(e) => setDishForm({ ...dishForm, name: e.target.value })}
                      placeholder="e.g. Butter Chicken"
                      className="w-full bg-white border border-[rgba(122,74,34,0.2)] rounded-xl p-2.5 text-xs text-[#2B1A0E] focus:outline-none focus:border-[#A90E02] focus:ring-1 focus:ring-[#A90E02]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#47311B] uppercase tracking-wider mb-1">Description</label>
                    <textarea
                      value={dishForm.description}
                      onChange={(e) => setDishForm({ ...dishForm, description: e.target.value })}
                      placeholder="Rich, creamy tomato curry sauce cooked with aromatic spices..."
                      className="w-full bg-white border border-[rgba(122,74,34,0.2)] rounded-xl p-2.5 text-xs text-[#2B1A0E] focus:outline-none focus:border-[#A90E02] focus:ring-1 focus:ring-[#A90E02]"
                      rows={2}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#47311B] uppercase tracking-wider mb-1">Price (THB)</label>
                      <input
                        type="number"
                        value={dishForm.priceTHB}
                        onChange={(e) => setDishForm({ ...dishForm, priceTHB: Number(e.target.value) })}
                        placeholder="290"
                        className="w-full bg-white border border-[rgba(122,74,34,0.2)] rounded-xl p-2.5 text-xs text-[#2B1A0E] focus:outline-none focus:border-[#A90E02] focus:ring-1 focus:ring-[#A90E02]"
                        min={0}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#47311B] uppercase tracking-wider mb-1">Menu Category</label>
                      <select
                        value={dishForm.category}
                        onChange={(e) => setDishForm({ ...dishForm, category: e.target.value })}
                        className="w-full bg-white border border-[rgba(122,74,34,0.2)] rounded-xl p-2.5 text-xs text-[#2B1A0E] focus:outline-none focus:border-[#A90E02] focus:ring-1 focus:ring-[#A90E02]"
                      >
                        {categories.filter(c => c.id !== 'all').map(c => (
                          <option key={c.id} value={c.id}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-[#47311B] uppercase tracking-wider mb-1">Diet Type</label>
                      <select
                        value={dishForm.type}
                        onChange={(e) => setDishForm({ ...dishForm, type: e.target.value as 'veg' | 'nonveg' })}
                        className="w-full bg-white border border-[rgba(122,74,34,0.2)] rounded-xl p-2.5 text-xs text-[#2B1A0E] focus:outline-none focus:border-[#A90E02] focus:ring-1 focus:ring-[#A90E02]"
                      >
                        <option value="veg">Veg</option>
                        <option value="nonveg">Non-Veg</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#47311B] uppercase tracking-wider mb-1">Spice Index</label>
                      <input
                        type="text"
                        value={dishForm.spiceLevel}
                        onChange={(e) => setDishForm({ ...dishForm, spiceLevel: e.target.value })}
                        placeholder="Mild / Medium / Spicy"
                        className="w-full bg-white border border-[rgba(122,74,34,0.2)] rounded-xl p-2.5 text-xs text-[#2B1A0E] focus:outline-none focus:border-[#A90E02] focus:ring-1 focus:ring-[#A90E02]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#47311B] uppercase tracking-wider mb-1">Sort Order</label>
                      <input
                        type="number"
                        value={dishForm.display_order ?? 0}
                        onChange={(e) => setDishForm({ ...dishForm, display_order: Number(e.target.value) })}
                        placeholder="0"
                        className="w-full bg-white border border-[rgba(122,74,34,0.2)] rounded-xl p-2.5 text-xs text-[#2B1A0E] focus:outline-none focus:border-[#A90E02] focus:ring-1 focus:ring-[#A90E02]"
                      />
                    </div>
                  </div>

                  {/* Food image upload controls */}
                  <div>
                    <label className="block text-xs font-bold text-[#47311B] uppercase tracking-wider mb-1">Dish Picture Cover</label>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1.5 pb-1">
                        <span className="bg-[#FDF3E3] text-[#A65B0A] text-xs px-2.5 py-0.5 rounded-full font-semibold border border-[#E5A33C]/30">
                          Recommended: 1200 × 1200 px
                        </span>
                        <span className="bg-[#F5F2EB] text-[#735B43] text-xs px-2.5 py-0.5 rounded-full font-semibold border border-[rgba(122,74,34,0.15)]">
                          Max: 2 MB
                        </span>
                      </div>

                      {/* Source mode toggle buttons */}
                      <div className="flex rounded-xl bg-[#F5F2EB] p-1 border border-[rgba(122,74,34,0.12)] gap-1">
                        <button
                          type="button"
                          onClick={() => setDishImageMode('upload')}
                          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                            dishImageMode === 'upload'
                              ? 'bg-white text-[#A90E02] shadow-xs'
                              : 'text-[#735B43] hover:text-[#2B1A0E]'
                          }`}
                        >
                          <Upload className="w-3.5 h-3.5" />
                          From Device
                        </button>
                        <button
                          type="button"
                          onClick={() => setDishImageMode('link')}
                          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                            dishImageMode === 'link'
                              ? 'bg-white text-[#A90E02] shadow-xs'
                              : 'text-[#735B43] hover:text-[#2B1A0E]'
                          }`}
                        >
                          <Instagram className="w-3.5 h-3.5 text-[#E1306C]" />
                          Instagram / Web Link
                        </button>
                      </div>

                      {/* MODE A: Device File Upload */}
                      {dishImageMode === 'upload' && (
                        <div>
                          <input
                            type="file"
                            ref={foodFileRef}
                            accept="image/*"
                            onChange={handleFoodFileChange}
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => foodFileRef.current?.click()}
                            className="w-full text-center border-dashed border-[rgba(122,74,34,0.3)] border bg-[#FFFDF9] text-xs text-[#8C5E2D] font-bold py-3 rounded-xl hover:bg-[#FDF8F1] transition-all flex items-center justify-center gap-2"
                            disabled={uploadProgress !== null}
                          >
                            <Upload className="w-4 h-4" />
                            {uploadProgress !== null ? 'Uploading to Supabase Storage...' : 'Browse photo from laptop/device'}
                          </button>
                        </div>
                      )}

                      {/* MODE B: Fetch from Instagram or Image Link */}
                      {dishImageMode === 'link' && (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={dishLinkInput}
                              onChange={(e) => setDishLinkInput(e.target.value)}
                              placeholder="Paste Instagram post URL or direct image link..."
                              className="flex-1 bg-white border border-[rgba(122,74,34,0.2)] rounded-xl p-2.5 text-xs text-[#2B1A0E] focus:outline-none focus:border-[#A90E02]"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleFetchDishLink();
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={handleFetchDishLink}
                              disabled={isFetchingLink}
                              className="bg-[#A90E02] hover:bg-[#8A0B02] text-[#FFFDF9] px-4 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50"
                            >
                              {isFetchingLink ? (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  Fetching...
                                </>
                              ) : (
                                <>
                                  <LinkIcon className="w-3.5 h-3.5" />
                                  Fetch & Load
                                </>
                              )}
                            </button>
                          </div>
                          <div className="bg-[#FDF8F1] p-2.5 rounded-xl border border-[rgba(122,74,34,0.12)] text-[11px] text-[#735B43] leading-relaxed">
                            💡 <strong>Instagram Tip:</strong> You can paste an Instagram post URL (e.g. <code>instagram.com/p/...</code>), or right-click any photo on Instagram and select <em>"Copy Image Address"</em> to paste the direct photo link!
                          </div>
                        </div>
                      )}

                      {/* Manual Image URL override */}
                      <div>
                        <span className="block text-[11px] font-semibold text-[#8C7358] mb-1">Active Image Asset URL:</span>
                        <input
                          type="text"
                          value={dishForm.image || ''}
                          onChange={(e) => setDishForm({ ...dishForm, image: e.target.value })}
                          placeholder="Direct image URL or Supabase CDN link..."
                          className="w-full bg-[#FDF8F1] border border-[rgba(122,74,34,0.15)] rounded-xl p-2 text-xs text-[#735B43] focus:outline-none focus:border-[#A90E02]"
                        />
                      </div>

                      {foodImgValidation && (
                        <div className="bg-[#FFFDF9] border border-[rgba(122,74,34,0.16)] p-3 rounded-xl space-y-1 text-xs text-[#5C3E1F]">
                          <div className="flex justify-between items-center">
                            <span>File size: <strong>{foodImgValidation.sizeMB} MB</strong></span>
                            <span>Resolution: <strong>{foodImgValidation.width} × {foodImgValidation.height} px</strong></span>
                          </div>
                          <div className={`font-semibold flex items-center gap-1.5 ${foodImgValidation.isCorrectDimensions ? 'text-emerald-700' : 'text-amber-800'}`}>
                            {foodImgValidation.isCorrectDimensions ? (
                              <span>✓ Matches the 1200×1200 px recommendation</span>
                            ) : (
                              <span>Resolution is {foodImgValidation.width}×{foodImgValidation.height} px (1200×1200 recommended).</span>
                            )}
                          </div>
                        </div>
                      )}

                      {dishForm.image && (
                        <div className="border border-[rgba(122,74,34,0.14)] p-2.5 rounded-xl bg-white space-y-1.5 flex flex-col items-center">
                          <span className="text-xs text-[#8C7358] font-semibold uppercase tracking-wider">Preview</span>
                          <div className="overflow-hidden rounded-xl bg-gray-50 aspect-square w-28 border border-[rgba(122,74,34,0.1)] shadow-xs">
                            <img 
                              src={dishForm.image} 
                              alt="Cuisine preview" 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1000&q=80';
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Promotion targets block */}
                  <div className="bg-[#FDF8F1] border border-[rgba(122,74,34,0.14)] p-3.5 rounded-xl space-y-2.5">
                    <span className="block text-xs font-bold text-[#8C5E2D] uppercase tracking-wider">Promotional Placements</span>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={dishForm.todaySpecial}
                          onChange={(e) => setDishForm({ ...dishForm, todaySpecial: e.target.checked })}
                          className="rounded border-[rgba(122,74,34,0.3)] text-[#A90E02] focus:ring-0"
                        />
                        <span className="inline-flex items-center gap-1 font-semibold text-[#2B1A0E]">
                          <Sparkles className="w-3 h-3 text-[#C27318]" /> Special
                        </span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={dishForm.chefSpecial}
                          onChange={(e) => setDishForm({ ...dishForm, chefSpecial: e.target.checked })}
                          className="rounded border-[rgba(122,74,34,0.3)] text-[#A90E02] focus:ring-0"
                        />
                        <span className="inline-flex items-center gap-1 font-semibold text-[#2B1A0E]">
                          <ChefHat className="w-3 h-3 text-[#A90E02]" /> Chef's Choice
                        </span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={dishForm.bestseller}
                          onChange={(e) => setDishForm({ ...dishForm, bestseller: e.target.checked })}
                          className="rounded border-[rgba(122,74,34,0.3)] text-[#A90E02] focus:ring-0"
                        />
                        <span className="inline-flex items-center gap-1 font-semibold text-[#2B1A0E]">
                          <Flame className="w-3 h-3 text-[#E08A2B]" /> Bestseller
                        </span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={dishForm.customerFavorite}
                          onChange={(e) => setDishForm({ ...dishForm, customerFavorite: e.target.checked })}
                          className="rounded border-[rgba(122,74,34,0.3)] text-[#A90E02] focus:ring-0"
                        />
                        <span className="inline-flex items-center gap-1 font-semibold text-[#2B1A0E]">
                          <Heart className="w-3 h-3 text-[#A90E02]" /> Favorite
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Interactive Ingredients builder */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#47311B] uppercase tracking-wider">
                      Ingredients ({dishForm.ingredients?.length || 0})
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={ingredientInput}
                        onChange={(e) => setIngredientInput(e.target.value)}
                        placeholder="e.g. Cardamom, Ginger, Garlic..."
                        className="flex-1 bg-white border border-[rgba(122,74,34,0.2)] rounded-xl p-2.5 text-xs text-[#2B1A0E] focus:outline-none focus:border-[#A90E02]"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddIngredient();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleAddIngredient}
                        className="bg-[#2B1A0E] text-[#FFFDF9] px-3.5 font-bold rounded-xl hover:bg-[#3D1F00] transition-colors"
                      >
                        Add
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 max-h-[85px] overflow-y-auto pt-1">
                      {dishForm.ingredients?.map((ing, idx) => (
                        <span 
                          key={idx}
                          onClick={() => handleRemoveIngredient(idx)}
                          className="text-xs bg-[#FDF8F1] border border-[rgba(122,74,34,0.18)] text-[#2B1A0E] px-2.5 py-1 rounded-full cursor-pointer hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 flex items-center gap-1.5 transition-colors"
                          title="Click to remove"
                        >
                          {ing} <span className="opacity-60 text-xs">✕</span>
                        </span>
                      ))}
                      {(!dishForm.ingredients || dishForm.ingredients.length === 0) && (
                        <div className="text-xs text-[#8C7358] italic py-1">No ingredients added yet.</div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      className="flex-1 bg-[#A90E02] hover:bg-[#8A0B02] text-[#FFFDF9] font-bold py-2.5 rounded-xl text-xs transition-colors shadow-xs"
                    >
                      {editingDish ? 'Save Changes' : 'Create Dish'}
                    </button>
                    {editingDish && (
                      <button
                        type="button"
                        onClick={handleCancelEditDish}
                        className="bg-[#F5F2EB] hover:bg-[#EAE4D7] text-[#47311B] font-semibold px-4 rounded-xl text-xs transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* CUISINE DISHES GRID LISTING PANEL (RIGHT SIDE 7 COLS) */}
              <div className="lg:col-span-7 bg-[#FFFDF9] p-5 rounded-2xl border border-[rgba(122,74,34,0.14)] shadow-[0_2px_12px_rgba(61,31,0,0.04)] flex flex-col min-h-[520px] h-[calc(100vh-220px)] max-h-[700px]">
                <div className="flex items-center justify-between pb-3 border-b border-[rgba(122,74,34,0.12)]">
                  <div>
                    <h3 className="font-bold text-base text-[#2B1A0E]">Menu Items ({dishes.length})</h3>
                    <p className="text-xs text-[#735B43] mt-0.5">Manage live dish items, ordering, status, and promotions.</p>
                  </div>
                </div>

                <div className="overflow-y-auto flex-1 space-y-3 pr-2 scrollbar-thin pt-3">
                  {dishes.map(dish => (
                    <div 
                      key={dish.id} 
                      className={`flex gap-3 bg-white p-3.5 rounded-xl border transition-all ${
                        editingDish?.id === dish.id 
                          ? 'border-[#A90E02] bg-[rgba(169,14,2,0.03)] shadow-xs' 
                          : 'border-[rgba(122,74,34,0.12)] hover:border-[rgba(122,74,34,0.25)]'
                      }`}
                    >
                      <img 
                        src={dish.image} 
                        alt={dish.name} 
                        className="w-16 h-16 object-cover rounded-xl flex-shrink-0 border border-[rgba(122,74,34,0.1)] bg-[#FDF8F1]"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1000&q=80';
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-bold text-sm text-[#2B1A0E] truncate">{dish.name}</h4>
                          <span className="font-bold text-[#A90E02] text-xs shrink-0">฿{dish.priceTHB}</span>
                        </div>
                        <p className="text-xs text-[#735B43] line-clamp-2 mt-0.5">{dish.description}</p>
                        
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          <span className="text-xs bg-[#FDF8F1] border border-[rgba(122,74,34,0.14)] text-[#8C5E2D] px-2 py-0.5 rounded-md uppercase font-semibold">
                            {dish.category}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-md font-semibold uppercase ${
                            dish.type === 'veg' 
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}>
                            {dish.type === 'veg' ? 'Veg' : 'Non-Veg'}
                          </span>
                          {dish.todaySpecial && (
                            <span className="text-xs bg-[#FDF3E3] text-[#A65B0A] border border-[#E5A33C]/40 px-2 py-0.5 rounded-md font-bold inline-flex items-center gap-1">
                              <Sparkles className="w-3 h-3" /> Special
                            </span>
                          )}
                          {dish.chefSpecial && (
                            <span className="text-xs bg-[#FDF0EE] text-[#A90E02] border border-[#A90E02]/30 px-2 py-0.5 rounded-md font-bold inline-flex items-center gap-1">
                              <ChefHat className="w-3 h-3" /> Chef
                            </span>
                          )}
                          {dish.bestseller && (
                            <span className="text-xs bg-[#FDF2EA] text-[#B84A12] border border-[#B84A12]/30 px-2 py-0.5 rounded-md font-bold inline-flex items-center gap-1">
                              <Flame className="w-3 h-3" /> Bestseller
                            </span>
                          )}
                          {dish.customerFavorite && (
                            <span className="text-xs bg-[#FAF0F3] text-[#912042] border border-[#912042]/30 px-2 py-0.5 rounded-md font-bold inline-flex items-center gap-1">
                              <Heart className="w-3 h-3" /> Favorite
                            </span>
                          )}
                        </div>

                        {/* Order sorting controls */}
                        <div className="flex flex-wrap gap-x-3 gap-y-1 items-center mt-2.5 pt-2 border-t border-[rgba(122,74,34,0.08)]">
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-[#735B43] font-semibold">Order:</span>
                            <input
                              type="number"
                              value={dish.display_order ?? 0}
                              onChange={(e) => handleUpdateDishOrderField(dish.id, 'display_order', Number(e.target.value))}
                              className="w-12 border border-[rgba(122,74,34,0.2)] rounded-md px-1.5 py-0.5 text-xs text-center font-bold bg-white focus:outline-none focus:border-[#A90E02]"
                            />
                          </div>

                          {dish.todaySpecial && (
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-[#A65B0A] font-semibold">Spec:</span>
                              <input
                                type="number"
                                value={dish.display_order_today ?? 0}
                                onChange={(e) => handleUpdateDishOrderField(dish.id, 'display_order_today', Number(e.target.value))}
                                className="w-12 border border-[rgba(122,74,34,0.2)] rounded-md px-1.5 py-0.5 text-xs text-center font-bold bg-white focus:outline-none focus:border-[#A90E02]"
                              />
                            </div>
                          )}

                          {dish.chefSpecial && (
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-[#A90E02] font-semibold">Chef:</span>
                              <input
                                type="number"
                                value={dish.display_order_chef ?? 0}
                                onChange={(e) => handleUpdateDishOrderField(dish.id, 'display_order_chef', Number(e.target.value))}
                                className="w-12 border border-[rgba(122,74,34,0.2)] rounded-md px-1.5 py-0.5 text-xs text-center font-bold bg-white focus:outline-none focus:border-[#A90E02]"
                              />
                            </div>
                          )}
                        </div>

                        {/* Status & Visibility Control Action Panel */}
                        <div className="flex flex-wrap gap-2 items-center mt-2.5 pt-2 border-t border-[rgba(122,74,34,0.08)]">
                          <span className="text-xs text-[#735B43] font-semibold">Status:</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase ${
                            dish.active !== false 
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}>
                            {dish.active !== false ? 'Active' : 'Inactive'}
                          </span>
                          
                          {dish.active !== false ? (
                            <div className="flex gap-1.5 flex-wrap">
                              <button
                                type="button"
                                onClick={() => handleUpdateDishActive(dish.id, false, 'hidden')}
                                className="bg-[#FFFDF9] hover:bg-amber-50 text-amber-800 text-xs font-semibold px-2 py-0.5 rounded-md border border-amber-200 transition-all"
                                title="Hide this dish"
                              >
                                Hide
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateDishActive(dish.id, false, 'disabled')}
                                className="bg-[#FFFDF9] hover:bg-rose-50 text-rose-800 text-xs font-semibold px-2 py-0.5 rounded-md border border-rose-200 transition-all"
                                title="Disable this dish"
                              >
                                Disable
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-1.5 flex-wrap">
                              <button
                                type="button"
                                onClick={() => handleUpdateDishActive(dish.id, true, 'shown')}
                                className="bg-[#FFFDF9] hover:bg-emerald-50 text-emerald-800 text-xs font-semibold px-2 py-0.5 rounded-md border border-emerald-200 transition-all"
                                title="Show this dish"
                              >
                                Enable & Show
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-1.5 justify-center shrink-0 pl-1">
                        <button
                          type="button"
                          onClick={() => handleEditDish(dish)}
                          className="bg-[#FDF8F1] hover:bg-[#F5EFE6] text-[#A90E02] text-xs font-bold py-1.5 px-3 rounded-lg transition-colors border border-[rgba(122,74,34,0.18)]"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleDisableDish(dish)}
                          className={`text-xs font-bold py-1.5 px-3 rounded-lg transition-colors border ${
                            dish.active 
                              ? 'bg-[#FDF8F1] hover:bg-[#F5EFE6] text-[#735B43] border-[rgba(122,74,34,0.18)]' 
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          {dish.active ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDish(dish.id, dish.name)}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold py-1.5 px-3 rounded-lg transition-colors border border-rose-200"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                  {dishes.length === 0 && (
                    <div className="py-20 text-center text-xs text-[#8C7358] italic">No cuisines available. Create menu items above.</div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* ====================================================================
              VIEW C: MENU CATEGORIES MANAGEMENT CONSOLE
              ==================================================================== */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              
              <div className="bg-[#FFFDF9] p-6 rounded-2xl border border-[rgba(122,74,34,0.14)] shadow-[0_2px_12px_rgba(61,31,0,0.04)] space-y-4">
                <div>
                  <h3 className="font-bold text-base text-[#2B1A0E]">Add Menu Category</h3>
                  <p className="text-xs text-[#735B43] mt-0.5">Define category tabs for sorting and filtering menu items on the public site.</p>
                </div>

                <form onSubmit={handleAddCategory} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold">
                  <div>
                    <label className="block text-xs font-bold text-[#47311B] uppercase tracking-wider mb-1">Unique Code ID (Slug)</label>
                    <input
                      type="text"
                      value={newCatId}
                      onChange={(e) => setNewCatId(e.target.value)}
                      placeholder="e.g. punjabi-special"
                      className="w-full bg-white border border-[rgba(122,74,34,0.2)] rounded-xl p-2.5 text-xs text-[#2B1A0E] focus:outline-none focus:border-[#A90E02]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#47311B] uppercase tracking-wider mb-1">Display Label</label>
                    <input
                      type="text"
                      value={newCatLabel}
                      onChange={(e) => setNewCatLabel(e.target.value)}
                      placeholder="e.g. Punjabi Specials"
                      className="w-full bg-white border border-[rgba(122,74,34,0.2)] rounded-xl p-2.5 text-xs text-[#2B1A0E] focus:outline-none focus:border-[#A90E02]"
                      required
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full bg-[#A90E02] hover:bg-[#8A0B02] text-[#FFFDF9] font-bold py-2.5 rounded-xl text-xs transition-colors shadow-xs"
                    >
                      + Create Category
                    </button>
                  </div>
                </form>
              </div>

              <div className="bg-[#FFFDF9] p-6 rounded-2xl border border-[rgba(122,74,34,0.14)] shadow-[0_2px_12px_rgba(61,31,0,0.04)] space-y-4">
                <div>
                  <h3 className="font-bold text-base text-[#2B1A0E]">Active Category Tabs ({categories.length})</h3>
                  <p className="text-xs text-[#735B43] mt-0.5">Manage, sort, and reorder categories displayed on the menu bar.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {categories.map(cat => {
                    const count = dishes.filter(d => d.category === cat.id).length;
                    return (
                      <div 
                        key={cat.id} 
                        className="bg-white p-4 rounded-xl border border-[rgba(122,74,34,0.14)] flex flex-col justify-between gap-3 hover:border-[#A90E02]/30 transition-all shadow-xs"
                      >
                        <div className="flex justify-between items-start w-full">
                          <div>
                            <h4 className="font-bold text-sm text-[#2B1A0E]">{cat.label}</h4>
                            <span className="text-xs text-[#A90E02] block font-semibold">ID: {cat.id}</span>
                            <span className="text-xs text-[#8C7358] block mt-0.5">{count} dishes linked</span>
                            <div className="mt-2 flex items-center gap-1.5">
                              <span className="text-xs text-[#735B43] font-semibold">Sort Order:</span>
                              <input
                                type="number"
                                value={cat.display_order ?? 0}
                                onChange={(e) => handleUpdateCategoryOrder(cat.id, Number(e.target.value))}
                                className="w-12 border border-[rgba(122,74,34,0.2)] rounded px-1.5 py-0.5 text-xs text-center font-bold bg-[#FDF8F1] focus:outline-none focus:border-[#A90E02]"
                              />
                            </div>
                          </div>

                          <div className="flex flex-col gap-1.5 items-end shrink-0">
                            {cat.id !== 'all' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleToggleDisableCategory(cat)}
                                  className={`text-xs font-semibold py-1 px-2.5 rounded-lg transition-colors border ${
                                    cat.active 
                                      ? 'bg-[#FDF8F1] hover:bg-[#F5EFE6] text-[#735B43] border-[rgba(122,74,34,0.18)]' 
                                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                                  }`}
                                >
                                  {cat.active ? 'Disable' : 'Enable'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCategory(cat.id, cat.label)}
                                  className="text-xs text-rose-700 hover:text-rose-900 font-semibold bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg px-2.5 py-1 transition-all"
                                >
                                  Delete
                                </button>
                              </>
                            )}
                            {cat.id === 'all' && (
                              <span className="text-xs bg-[#F5F2EB] text-[#735B43] font-bold px-2 py-0.5 rounded-full">
                                Primary
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Category Visibility Control Action Box */}
                        <div className="mt-2 pt-2 border-t border-[rgba(122,74,34,0.08)] flex flex-col gap-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-[#735B43] font-semibold">Status:</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase ${
                              cat.active !== false 
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                                : 'bg-rose-50 text-rose-800 border border-rose-200'
                            }`}>
                              {cat.active !== false ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          
                          {cat.id !== 'all' && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {cat.active !== false ? (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateCategoryActive(cat.id, false, 'hidden')}
                                  className="bg-[#FFFDF9] hover:bg-amber-50 text-amber-800 text-xs font-semibold px-2 py-0.5 rounded-md border border-amber-200 transition-all"
                                  title="Hide this category"
                                >
                                  Hide Tab
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateCategoryActive(cat.id, true, 'shown')}
                                  className="bg-[#FFFDF9] hover:bg-emerald-50 text-emerald-800 text-xs font-semibold px-2 py-0.5 rounded-md border border-emerald-200 transition-all"
                                  title="Show this category"
                                >
                                  Show Tab
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* ====================================================================
              VIEW D: RESTAURANT PROFILE & BRAND STORY STORYBOARD
              ==================================================================== */}
          {activeTab === 'restaurant' && (
            <div className="bg-[#FFFDF9] p-6 rounded-2xl border border-[rgba(122,74,34,0.14)] shadow-[0_2px_12px_rgba(61,31,0,0.04)] space-y-6">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[rgba(169,14,2,0.08)] flex items-center justify-center shrink-0">
                  <Store className="w-4 h-4 text-[#A90E02]" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#2B1A0E]">Brand Profile & Heritage Story</h3>
                  <p className="text-xs text-[#735B43] mt-0.5">Manage opening hours, location address, contact info, and culinary story.</p>
                </div>
              </div>

              <form onSubmit={handleSaveProfileSubmit} className="space-y-4 text-xs font-semibold text-[#2B1A0E]">
                
                <div>
                  <label className="block text-xs font-bold text-[#47311B] uppercase tracking-wider mb-1">Restaurant Name</label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="w-full bg-white border border-[rgba(122,74,34,0.2)] rounded-xl p-2.5 text-xs text-[#2B1A0E] focus:outline-none focus:border-[#A90E02]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#47311B] uppercase tracking-wider mb-1">Postal Address</label>
                  <input
                    type="text"
                    value={profileForm.address}
                    onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                    className="w-full bg-white border border-[rgba(122,74,34,0.2)] rounded-xl p-2.5 text-xs text-[#2B1A0E] focus:outline-none focus:border-[#A90E02]"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#47311B] uppercase tracking-wider mb-1">Business Phone Contact</label>
                    <input
                      type="text"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="w-full bg-white border border-[rgba(122,74,34,0.2)] rounded-xl p-2.5 text-xs text-[#2B1A0E] focus:outline-none focus:border-[#A90E02]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#47311B] uppercase tracking-wider mb-1">Opening Hours</label>
                    <input
                      type="text"
                      value={profileForm.openingHours}
                      onChange={(e) => setProfileForm({ ...profileForm, openingHours: e.target.value })}
                      className="w-full bg-white border border-[rgba(122,74,34,0.2)] rounded-xl p-2.5 text-xs text-[#2B1A0E] focus:outline-none focus:border-[#A90E02]"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#47311B] uppercase tracking-wider mb-1">Instagram Handle</label>
                    <input
                      type="text"
                      value={profileForm.instagram}
                      onChange={(e) => setProfileForm({ ...profileForm, instagram: e.target.value })}
                      className="w-full bg-white border border-[rgba(122,74,34,0.2)] rounded-xl p-2.5 text-xs text-[#2B1A0E] focus:outline-none focus:border-[#A90E02]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#47311B] uppercase tracking-wider mb-1">Website URL</label>
                    <input
                      type="text"
                      value={profileForm.website}
                      onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                      className="w-full bg-white border border-[rgba(122,74,34,0.2)] rounded-xl p-2.5 text-xs text-[#2B1A0E] focus:outline-none focus:border-[#A90E02]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#47311B] uppercase tracking-wider mb-1">Dining Style</label>
                    <input
                      type="text"
                      value={profileForm.diningStyle}
                      onChange={(e) => setProfileForm({ ...profileForm, diningStyle: e.target.value })}
                      className="w-full bg-white border border-[rgba(122,74,34,0.2)] rounded-xl p-2.5 text-xs text-[#2B1A0E] focus:outline-none focus:border-[#A90E02]"
                    />
                  </div>
                </div>

                <div className="border-t border-[rgba(122,74,34,0.12)] my-4 pt-4">
                  <h4 className="text-sm font-bold text-[#2B1A0E] mb-3 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-[#A90E02]" />
                    Culinary Heritage Story
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-[#47311B] uppercase tracking-wider mb-1">Story Paragraphs (One paragraph per line)</label>
                      <textarea
                        value={storyInput}
                        onChange={(e) => setStoryInput(e.target.value)}
                        className="w-full bg-white border border-[rgba(122,74,34,0.2)] rounded-xl p-3 text-xs text-[#2B1A0E] focus:outline-none focus:border-[#A90E02] leading-relaxed"
                        rows={4}
                        placeholder="Type restaurant story here..."
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#47311B] uppercase tracking-wider mb-1">
                        Brand Highlights ({aboutForm.highlights.length})
                      </label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={highlightInput}
                          onChange={(e) => setHighlightInput(e.target.value)}
                          placeholder="e.g. Sourced fresh from local growers"
                          className="flex-1 bg-white border border-[rgba(122,74,34,0.2)] rounded-xl p-2 text-xs text-[#2B1A0E] focus:outline-none focus:border-[#A90E02]"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddHighlight();
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleAddHighlight}
                          className="bg-[#2B1A0E] text-[#FFFDF9] px-4 font-bold text-xs rounded-xl hover:bg-[#3D1F00] transition-colors"
                        >
                          Add bullet
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto">
                        {aboutForm.highlights.map((tag, i) => (
                          <span
                            key={i}
                            onClick={() => handleRemoveHighlight(i)}
                            className="bg-[#FDF8F1] hover:bg-rose-50 hover:text-rose-700 text-[#2B1A0E] border border-[rgba(122,74,34,0.18)] px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                            title="Click to remove"
                          >
                            {tag} <span className="opacity-60 text-xs">✕</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="bg-[#A90E02] hover:bg-[#8A0B02] text-[#FFFDF9] font-bold py-2.5 px-6 rounded-xl text-xs transition-colors shadow-xs"
                  >
                    Save Profile Details
                  </button>
                </div>

              </form>
            </div>
          )}

          {/* ====================================================================
              VIEW E: CHAT INTEGRATION GATEWAY
              ==================================================================== */}
          {activeTab === 'chat' && (
            <div className="bg-[#FFFDF9] p-6 rounded-2xl border border-[rgba(122,74,34,0.14)] shadow-[0_2px_12px_rgba(61,31,0,0.04)] space-y-6">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[rgba(169,14,2,0.08)] flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4 h-4 text-[#A90E02]" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#2B1A0E]">WhatsApp & LINE Direct Ordering</h3>
                  <p className="text-xs text-[#735B43] mt-0.5">Configure direct reservation channels and click-to-chat coordinates.</p>
                </div>
              </div>

              <form onSubmit={handleSaveChatSubmit} className="space-y-5 text-xs font-semibold text-[#2B1A0E]">
                
                {/* CONTACT CHANNEL ACTIVE STATE CONTROLLER */}
                <div className="bg-[#FDF8F1] p-5 rounded-2xl border border-[rgba(122,74,34,0.14)] space-y-3.5">
                  <div>
                    <h4 className="text-[#2B1A0E] font-bold text-sm">Active Channels</h4>
                    <p className="text-xs text-[#735B43] font-normal mt-0.5">
                      Select which direct communication channels are displayed to website visitors.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { value: 'whatsapp', label: 'WhatsApp Only', desc: 'Activate WhatsApp only', icon: MessageSquare },
                      { value: 'line', label: 'LINE Only', desc: 'Activate LINE only', icon: MessageSquare },
                      { value: 'both', label: 'Both Channels', desc: 'Show WhatsApp & LINE', icon: CheckCircle2 },
                      { value: 'disabled', label: 'Disabled', desc: 'Deactivate chat buttons', icon: EyeOff }
                    ].map((item) => {
                      const active = chatForm.contactActiveChannel === item.value;
                      const IconComp = item.icon;
                      return (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => setChatForm({ ...chatForm, contactActiveChannel: item.value as any })}
                          className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
                            active 
                              ? 'bg-[rgba(169,14,2,0.06)] border-[#A90E02] text-[#A90E02] shadow-xs font-bold ring-1 ring-[#A90E02]' 
                              : 'bg-white border-[rgba(122,74,34,0.18)] text-[#735B43] hover:bg-[#FDF8F1] font-medium'
                          }`}
                        >
                          <IconComp className="w-5 h-5 mb-1.5 shrink-0" />
                          <span className="text-xs font-bold block">{item.label}</span>
                          <span className="text-xs text-[#8C7358] font-normal block mt-0.5 leading-tight">{item.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-emerald-50/40 p-5 rounded-2xl border border-emerald-200/60 space-y-4">
                  <h4 className="text-emerald-900 font-bold text-xs flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                    WhatsApp Configuration
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider mb-1">WhatsApp Number</label>
                      <input
                        type="text"
                        value={chatForm.whatsappNumber}
                        onChange={(e) => setChatForm({ ...chatForm, whatsappNumber: e.target.value })}
                        placeholder="+66829560609"
                        className="w-full bg-white border border-emerald-200 rounded-xl p-2.5 text-xs text-[#2B1A0E] focus:outline-none focus:border-emerald-600"
                        disabled={chatForm.contactActiveChannel === 'line' || chatForm.contactActiveChannel === 'disabled'}
                      />
                      <p className="text-xs text-[#8C7358] font-normal mt-1">Include country code without special characters (e.g., 66829560609).</p>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider mb-1">Default Pre-filled Message</label>
                      <input
                        type="text"
                        value={chatForm.whatsappMessage}
                        onChange={(e) => setChatForm({ ...chatForm, whatsappMessage: e.target.value })}
                        placeholder="Hello, I would like to book a table..."
                        className="w-full bg-white border border-emerald-200 rounded-xl p-2.5 text-xs text-[#2B1A0E] focus:outline-none focus:border-emerald-600"
                        disabled={chatForm.contactActiveChannel === 'line' || chatForm.contactActiveChannel === 'disabled'}
                      />
                      <p className="text-xs text-[#8C7358] font-normal mt-1">Pre-filled text in the customer's chat when tapping the button.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-emerald-50/20 p-5 rounded-2xl border border-emerald-200/50 space-y-4">
                  <h4 className="text-emerald-900 font-bold text-xs flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                    LINE Configuration
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider mb-1">LINE ID</label>
                      <input
                        type="text"
                        value={chatForm.lineId}
                        onChange={(e) => setChatForm({ ...chatForm, lineId: e.target.value })}
                        placeholder="namastesiam"
                        className="w-full bg-white border border-emerald-200 rounded-xl p-2.5 text-xs text-[#2B1A0E] focus:outline-none focus:border-emerald-600"
                        disabled={chatForm.contactActiveChannel === 'whatsapp' || chatForm.contactActiveChannel === 'disabled'}
                      />
                      <p className="text-xs text-[#8C7358] font-normal mt-1">Your official LINE handle or ID.</p>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider mb-1">LINE QR Code Image URL</label>
                      <input
                        type="text"
                        value={chatForm.lineQrUrl}
                        onChange={(e) => setChatForm({ ...chatForm, lineQrUrl: e.target.value })}
                        placeholder="https://..."
                        className="w-full bg-white border border-emerald-200 rounded-xl p-2.5 text-xs text-[#2B1A0E] focus:outline-none focus:border-emerald-600"
                        disabled={chatForm.contactActiveChannel === 'whatsapp' || chatForm.contactActiveChannel === 'disabled'}
                      />
                      <p className="text-xs text-[#8C7358] font-normal mt-1">Direct URL to your LINE QR code asset.</p>
                    </div>
                  </div>

                  {chatForm.lineQrUrl && (chatForm.contactActiveChannel === 'line' || chatForm.contactActiveChannel === 'both') && (
                    <div className="pt-2 flex items-center gap-3 bg-white p-3.5 rounded-xl border border-emerald-200/60 shadow-xs">
                      <div className="p-1.5 border border-emerald-100 rounded-lg bg-white shrink-0">
                        <img 
                          src={chatForm.lineQrUrl} 
                          alt="LINE QR code" 
                          className="w-20 h-20 object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://line.me/R/ti/p/~' + (chatForm.lineId || 'namastesiam');
                          }}
                        />
                      </div>
                      <span className="text-xs text-[#735B43] leading-relaxed block max-w-sm font-normal">
                        This QR code enables instant scanning and reservations. When left empty, an automatic link is created from your LINE ID.
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="bg-[#A90E02] hover:bg-[#8A0B02] text-[#FFFDF9] font-bold py-2.5 px-6 rounded-xl text-xs transition-colors shadow-xs"
                  >
                    Save Chat Settings
                  </button>
                </div>

              </form>
            </div>
          )}

          {/* ====================================================================
              VIEW F: AMBIENCE GALLERY COLLAGE SYSTEM
              ==================================================================== */}
          {activeTab === 'gallery' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              
              {/* GALLERY ITEM ADD FORM */}
              <div className="lg:col-span-5 bg-[#FFFDF9] p-5 rounded-2xl border border-[rgba(122,74,34,0.14)] shadow-[0_2px_12px_rgba(61,31,0,0.04)] space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[rgba(169,14,2,0.08)] flex items-center justify-center shrink-0">
                    <ImageIcon className="w-4 h-4 text-[#A90E02]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-[#2B1A0E]">
                      {editingGalleryIndex !== null ? `Replace Photo #${editingGalleryIndex + 1}` : 'Add Ambience Photo'}
                    </h3>
                    <p className="text-xs text-[#735B43] mt-0.5">
                      {editingGalleryIndex !== null 
                        ? 'Replace this specific photo in the ambience gallery.' 
                        : 'Upload interior dining, bar, or culinary presentation photography.'}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleAddGalleryItemSubmit} className="space-y-4 text-xs font-medium text-[#2B1A0E]">
                  <div>
                    <div className="flex flex-wrap gap-1.5 pb-1">
                      <span className="bg-[#FDF3E3] text-[#A65B0A] text-xs px-2.5 py-0.5 rounded-full font-semibold border border-[#E5A33C]/30">
                        Recommended: 1600 × 900 px
                      </span>
                      <span className="bg-[#F5F2EB] text-[#735B43] text-xs px-2.5 py-0.5 rounded-full font-semibold border border-[rgba(122,74,34,0.15)]">
                        Max: 2 MB
                      </span>
                    </div>

                    {/* Ambience source mode toggle buttons */}
                    <div className="flex rounded-xl bg-[#F5F2EB] p-1 border border-[rgba(122,74,34,0.12)] gap-1 my-2">
                      <button
                        type="button"
                        onClick={() => setGalleryImageMode('upload')}
                        className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                          galleryImageMode === 'upload'
                            ? 'bg-white text-[#A90E02] shadow-xs'
                            : 'text-[#735B43] hover:text-[#2B1A0E]'
                        }`}
                      >
                        <Upload className="w-3.5 h-3.5" />
                        From Device
                      </button>
                      <button
                        type="button"
                        onClick={() => setGalleryImageMode('link')}
                        className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                          galleryImageMode === 'link'
                            ? 'bg-white text-[#A90E02] shadow-xs'
                            : 'text-[#735B43] hover:text-[#2B1A0E]'
                        }`}
                      >
                        <Instagram className="w-3.5 h-3.5 text-[#E1306C]" />
                        Instagram / Web Link
                      </button>
                    </div>

                    {/* MODE A: Device File Upload */}
                    {galleryImageMode === 'upload' && (
                      <div className="pt-1">
                        <input
                          type="file"
                          ref={galleryFileRef}
                          accept="image/*"
                          onChange={handleGalleryFileChange}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => galleryFileRef.current?.click()}
                          className="w-full text-center border-dashed border-[rgba(122,74,34,0.3)] border bg-white text-xs text-[#8C5E2D] font-bold py-3 rounded-xl hover:bg-[#FDF8F1] transition-all flex items-center justify-center gap-2"
                          disabled={uploadProgress !== null}
                        >
                          <Upload className="w-4 h-4" />
                          {uploadProgress !== null ? 'Uploading to Supabase Storage...' : 'Browse photo from device'}
                        </button>
                      </div>
                    )}

                    {/* MODE B: Fetch from Instagram or Image Link */}
                    {galleryImageMode === 'link' && (
                      <div className="space-y-2 pt-1">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={galleryLinkInput}
                            onChange={(e) => setGalleryLinkInput(e.target.value)}
                            placeholder="Paste Instagram post URL or direct image link..."
                            className="flex-1 bg-white border border-[rgba(122,74,34,0.2)] rounded-xl p-2.5 text-xs text-[#2B1A0E] focus:outline-none focus:border-[#A90E02]"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleFetchGalleryLink();
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={handleFetchGalleryLink}
                            disabled={isFetchingGalleryLink}
                            className="bg-[#A90E02] hover:bg-[#8A0B02] text-[#FFFDF9] px-4 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50"
                          >
                            {isFetchingGalleryLink ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                Fetching...
                              </>
                            ) : (
                              <>
                                <LinkIcon className="w-3.5 h-3.5" />
                                Fetch & Load
                              </>
                            )}
                          </button>
                        </div>
                        <div className="bg-[#FDF8F1] p-2.5 rounded-xl border border-[rgba(122,74,34,0.12)] text-[11px] text-[#735B43] leading-relaxed">
                          💡 <strong>Tip:</strong> Paste an Instagram post URL (e.g. <code>instagram.com/p/...</code>) or right-click any Instagram/web image and select <em>"Copy Image Address"</em>.
                        </div>
                      </div>
                    )}

                    {/* Manual Image URL override */}
                    <div className="mt-2">
                      <span className="block text-[11px] font-semibold text-[#8C7358] mb-1">Active Ambience Asset URL:</span>
                      <input
                        type="text"
                        value={galleryForm.image}
                        onChange={(e) => setGalleryForm({ ...galleryForm, image: e.target.value })}
                        placeholder="Direct image URL or Supabase CDN link..."
                        className="w-full bg-[#FDF8F1] border border-[rgba(122,74,34,0.15)] rounded-xl p-2 text-xs text-[#735B43] focus:outline-none focus:border-[#A90E02]"
                      />
                    </div>

                    {galleryImgValidation && (
                      <div className="bg-white border border-[rgba(122,74,34,0.16)] p-3 rounded-xl space-y-1 text-xs text-[#5C3E1F] mt-2 shadow-xs">
                        <div className="flex justify-between items-center">
                          <span>Size: <strong>{galleryImgValidation.sizeMB} MB</strong></span>
                          <span>Resolution: <strong>{galleryImgValidation.width} × {galleryImgValidation.height} px</strong></span>
                        </div>
                        <div className={`font-semibold flex items-center gap-1.5 ${galleryImgValidation.isCorrectDimensions ? 'text-emerald-700' : 'text-amber-800'}`}>
                          {galleryImgValidation.isCorrectDimensions ? (
                            <span>✓ Matches 1600×900 px aspect ratio!</span>
                          ) : (
                            <span>Aspect ratio is {galleryImgValidation.width}×{galleryImgValidation.height} px (1600×900 recommended).</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#47311B] uppercase tracking-wider mb-1">Image Description (Alt Text)</label>
                    <input
                      type="text"
                      value={galleryForm.alt}
                      onChange={(e) => setGalleryForm({ ...galleryForm, alt: e.target.value })}
                      placeholder="e.g. Elegant warm dining room with traditional brass lamps"
                      className="w-full bg-white border border-[rgba(122,74,34,0.2)] rounded-xl p-2.5 text-xs text-[#2B1A0E] focus:outline-none focus:border-[#A90E02]"
                      required
                    />
                  </div>

                  <div className="bg-[#FDF8F1] border border-[rgba(122,74,34,0.14)] p-3 rounded-xl">
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-xs text-[#2B1A0E]">
                      <input
                        type="checkbox"
                        checked={galleryForm.tall}
                        onChange={(e) => setGalleryForm({ ...galleryForm, tall: e.target.checked })}
                        className="rounded border-[rgba(122,74,34,0.3)] text-[#A90E02] focus:ring-0"
                      />
                      <span>Tall vertical grid format (Bento expansion card)</span>
                    </label>
                  </div>

                  {galleryForm.image && (
                    <div className="border border-[rgba(122,74,34,0.14)] p-2.5 rounded-xl bg-white flex flex-col items-center justify-center">
                      <span className="text-xs text-[#8C7358] font-semibold uppercase tracking-wider mb-1">Preview</span>
                      <img 
                        src={galleryForm.image} 
                        alt="Ambience preview" 
                        className={`object-cover rounded-xl border border-[rgba(122,74,34,0.1)] shadow-xs ${galleryForm.tall ? 'w-24 h-36' : 'w-full max-w-[220px] h-28'}`}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1528605105345-5344ea20e269?auto=format&fit=crop&w=1200&q=80';
                        }}
                      />
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 bg-[#A90E02] hover:bg-[#8A0B02] text-[#FFFDF9] font-bold py-2.5 rounded-xl text-xs transition-colors shadow-xs"
                    >
                      {editingGalleryIndex !== null ? 'Replace Photo' : '+ Add Photo to Gallery'}
                    </button>
                    {editingGalleryIndex !== null && (
                      <button
                        type="button"
                        onClick={handleCancelEditGalleryItem}
                        className="bg-[#F5F2EB] hover:bg-[#EAE4D7] text-[#47311B] font-semibold px-4 rounded-xl text-xs transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* GALLERY IMAGES PREVIEW COLLAGE AND PURGER */}
              <div className="lg:col-span-7 bg-[#FFFDF9] p-5 rounded-2xl border border-[rgba(122,74,34,0.14)] shadow-[0_2px_12px_rgba(61,31,0,0.04)] flex flex-col min-h-[520px] h-[calc(100vh-220px)] max-h-[700px]">
                <div className="pb-3 border-b border-[rgba(122,74,34,0.12)]">
                  <h3 className="font-bold text-base text-[#2B1A0E]">Gallery Assets ({gallery.length})</h3>
                  <p className="text-xs text-[#735B43] mt-0.5">Live photos featured in the public website ambience gallery section.</p>
                </div>

                <div className="overflow-y-auto flex-1 grid grid-cols-2 gap-3.5 mt-3 pr-1 scrollbar-thin">
                  {gallery.map((g, index) => (
                    <div 
                      key={index}
                      className="group relative bg-[#FDF8F1] border border-[rgba(122,74,34,0.14)] rounded-2xl overflow-hidden shadow-xs h-40"
                    >
                      <img 
                        src={g.image} 
                        alt={g.alt} 
                        className="w-full h-full object-cover" 
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1528605105345-5344ea20e269?auto=format&fit=crop&w=1200&q=80';
                        }}
                      />
                      
                      <div className="absolute inset-0 bg-black/75 opacity-100 sm:opacity-0 group-hover:opacity-100 flex flex-col justify-between p-3 transition-opacity duration-200">
                        <div className="flex justify-between items-center">
                          <span className="text-xs bg-[#A90E02] text-white px-2.5 py-0.5 rounded-full font-bold">
                            {g.tall ? 'Tall format' : 'Landscape'}
                          </span>
                          
                          {/* Reorder control badges */}
                          <div className="flex gap-1 items-center">
                            <div className="flex gap-1 items-center mr-1">
                              <span className="text-xs text-[#E5A33C] font-semibold">Sort:</span>
                              <input
                                type="number"
                                value={g.display_order ?? 0}
                                onChange={(e) => handleUpdateGalleryOrder(index, Number(e.target.value))}
                                className="w-10 border border-white/30 rounded px-1 py-0.5 text-xs text-center font-bold bg-black/60 text-white focus:outline-none focus:border-[#E5A33C]"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => moveGalleryItem(index, 'up')}
                              disabled={index === 0}
                              className="bg-white/20 hover:bg-white text-white hover:text-[#2B1A0E] p-1 rounded-md disabled:opacity-20 disabled:pointer-events-none transition-all"
                              title="Move Up"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveGalleryItem(index, 'down')}
                              disabled={index === gallery.length - 1}
                              className="bg-white/20 hover:bg-white text-white hover:text-[#2B1A0E] p-1 rounded-md disabled:opacity-20 disabled:pointer-events-none transition-all"
                              title="Move Down"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="space-y-1.5">
                          <div className="text-xs text-white font-medium flex items-center justify-between">
                            <span className="truncate max-w-[140px]">{g.alt || 'Ambience Photo'}</span>
                            <span className={`shrink-0 ml-1.5 text-xs px-2 py-0.5 rounded-full font-bold uppercase ${
                              g.active !== false ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                            }`}>
                              {g.active !== false ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          
                          {/* Visibility controls */}
                          <div className="flex gap-1.5">
                            {g.active !== false ? (
                              <button
                                type="button"
                                onClick={() => handleUpdateGalleryActive(index, false, 'hidden')}
                                className="bg-amber-400 hover:bg-amber-500 text-amber-950 text-xs font-bold px-2 py-0.5 rounded-md transition-colors"
                                title="Hide photo"
                              >
                                Hide
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleUpdateGalleryActive(index, true, 'shown')}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-2 py-0.5 rounded-md transition-colors"
                                title="Show photo"
                              >
                                Show
                              </button>
                            )}
                          </div>

                          <div className="flex gap-1.5 pt-1">
                            <button
                              type="button"
                              onClick={() => handleEditGalleryItem(index)}
                              className="flex-1 bg-white hover:bg-[#FDF8F1] text-[#2B1A0E] text-xs font-bold py-1 rounded-lg transition-colors"
                            >
                              Replace
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteGalleryItem(index)}
                              className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-1 rounded-lg transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {gallery.length === 0 && (
                    <div className="col-span-2 py-20 text-center text-xs text-[#8C7358] italic">No gallery photos added yet.</div>
                  )}
                </div>
              </div>

            </div>
          )}

        </main>
      </div>
    </div>
  );
}
