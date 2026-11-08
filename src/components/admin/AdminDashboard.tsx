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
  onUpdateDishes: (updatedDishes: Dish[]) => Promise<void> | void;
  onUpdateRestaurantInfo: (updatedInfo: RestaurantInfo) => Promise<void> | void;
  onUpdateAboutInfo: (updatedAbout: AboutInfo) => Promise<void> | void;
  onUpdateCategories: (updatedCategories: Category[]) => Promise<void> | void;
  onUpdateGallery: (updatedGallery: GalleryItem[]) => Promise<void> | void;
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
  const [isProfileDirty, setIsProfileDirty] = useState<boolean>(false);

  useEffect(() => {
    setProfileForm({ ...restaurantInfo });
    setAboutForm({ ...aboutInfo });
    setStoryInput(aboutInfo.story.join('\n'));
    setIsProfileDirty(false);
  }, [restaurantInfo, aboutInfo]);

  const handleSaveProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const parsedStory = storyInput
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      await onUpdateRestaurantInfo({ ...profileForm });
      await onUpdateAboutInfo({
        story: parsedStory,
        highlights: aboutForm.highlights
      });

      setIsProfileDirty(false);
      showToast('Restaurant details and story saved successfully!');
    } catch (err: any) {
      console.error('Failed to save profile details:', err);
      showToast(err?.message || 'Failed to save profile details. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
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
      setIsProfileDirty(true);
    }
  };

  const handleRemoveHighlight = (index: number) => {
    setAboutForm({
      ...aboutForm,
      highlights: aboutForm.highlights.filter((_, i) => i !== index)
    });
    setIsProfileDirty(true);
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
    try {
      await onUpdateRestaurantInfo({
        ...restaurantInfo,
        whatsappNumber: chatForm.whatsappNumber,
        whatsappMessage: chatForm.whatsappMessage,
        lineId: chatForm.lineId,
        lineQrUrl: chatForm.lineQrUrl,
        contactActiveChannel: chatForm.contactActiveChannel
      });
      showToast('WhatsApp & LINE settings saved successfully!');
    } catch (err: any) {
      console.error('Failed to save chat settings:', err);
      showToast(err?.message || 'Failed to save chat settings.', 'error');
    } finally {
      setIsSaving(false);
    }
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
    <div className="min-h-screen bg-[#F8EEDB] text-[#30251E] font-body antialiased flex flex-col">
      
      {/* Toast Alert Banner */}
      {toast && (
        <div 
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold transition-all duration-300 flex items-center gap-2.5 ${
            toast.type === 'error' ? 'bg-[#FFF2F2] border-[#F2B8B5] text-[#9B1C1C]' : 
            toast.type === 'info' ? 'bg-[#EFF6FF] border-[#BFDBFE] text-[#1E40AF]' :
            'bg-[#FFF9EF] border-[#D9B66D]/40 text-[#30251E]'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-[#9B1C1C] shrink-0" />
          ) : toast.type === 'info' ? (
            <Info className="w-4 h-4 text-[#1E40AF] shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-[#173D32] shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* FIXED HEADER NAVBAR */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-[#FFF9EF]/95 backdrop-blur-md border-b border-[#E4D7BF] z-30 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#173D32]/10 border border-[#173D32]/25 flex items-center justify-center shrink-0">
            <SlidersHorizontal className="w-4 h-4 text-[#173D32]" />
          </div>
          <div>
            <h1 className="font-display font-extrabold text-[#173D32] text-lg leading-tight tracking-tight">{restaurantInfo.name}</h1>
            <p className="text-xs font-semibold text-[#B58C45] tracking-wide">Control Console • Super Admin</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {isSaving && (
            <span className="text-xs text-[#173D32] bg-[#173D32]/10 border border-[#173D32]/25 px-3 py-1 rounded-full font-semibold flex items-center gap-1.5 animate-pulse">
              <RefreshCw className="w-3 h-3 animate-spin" />
              Saving database...
            </span>
          )}
          <button 
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 text-xs bg-[#173D32] hover:bg-[#102C25] text-[#FFF9EF] font-bold py-2 px-4 rounded-full transition-colors shadow-sm border border-[#D9B66D]/40"
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
            className="inline-flex items-center gap-1.5 text-xs text-[#75685A] hover:text-[#173D32] font-semibold transition-colors px-2.5 py-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </header>

      {/* DASHBOARD CONTENT BODY */}
      <div className="flex-1 pt-16 flex flex-col md:flex-row">
        
        {/* Left Side Tab Navigator Panel */}
        <aside className="w-full md:w-72 bg-[#FFF9EF] border-r border-b md:border-b-0 border-[#E4D7BF] p-3 md:p-4 flex md:flex-col gap-1.5 overflow-x-auto md:overflow-y-auto md:sticky md:top-16 md:h-[calc(100vh-64px)] shrink-0 font-body">
          <div className="text-xs font-bold text-[#B58C45] uppercase tracking-wider px-3 py-1 mb-1 hidden md:block">
            Consoles
          </div>
          
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`shrink-0 md:w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all whitespace-nowrap ${
              activeTab === 'overview' 
                ? 'bg-[#173D32] text-[#FFF9EF] shadow-md font-bold border border-[#D9B66D]/40' 
                : 'text-[#30251E] hover:bg-[#173D32]/10 hover:text-[#173D32]'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            <span>Command Overview</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('dishes')}
            className={`shrink-0 md:w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all whitespace-nowrap ${
              activeTab === 'dishes' 
                ? 'bg-[#173D32] text-[#FFF9EF] shadow-md font-bold border border-[#D9B66D]/40' 
                : 'text-[#30251E] hover:bg-[#173D32]/10 hover:text-[#173D32]'
            }`}
          >
            <UtensilsCrossed className="w-4 h-4 shrink-0" />
            <span>Cuisine Catalog</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('categories')}
            className={`shrink-0 md:w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all whitespace-nowrap ${
              activeTab === 'categories' 
                ? 'bg-[#173D32] text-[#FFF9EF] shadow-md font-bold border border-[#D9B66D]/40' 
                : 'text-[#30251E] hover:bg-[#173D32]/10 hover:text-[#173D32]'
            }`}
          >
            <Tag className="w-4 h-4 shrink-0" />
            <span>Menu Categories</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('restaurant')}
            className={`shrink-0 md:w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all whitespace-nowrap ${
              activeTab === 'restaurant' 
                ? 'bg-[#173D32] text-[#FFF9EF] shadow-md font-bold border border-[#D9B66D]/40' 
                : 'text-[#30251E] hover:bg-[#173D32]/10 hover:text-[#173D32]'
            }`}
          >
            <Store className="w-4 h-4 shrink-0" />
            <span>Brand Profile & Story</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`shrink-0 md:w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all whitespace-nowrap ${
              activeTab === 'chat' 
                ? 'bg-[#173D32] text-[#FFF9EF] shadow-md font-bold border border-[#D9B66D]/40' 
                : 'text-[#30251E] hover:bg-[#173D32]/10 hover:text-[#173D32]'
            }`}
          >
            <MessageSquare className="w-4 h-4 shrink-0" />
            <span>WhatsApp & LINE Setup</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('gallery')}
            className={`shrink-0 md:w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all whitespace-nowrap ${
              activeTab === 'gallery' 
                ? 'bg-[#173D32] text-[#FFF9EF] shadow-md font-bold border border-[#D9B66D]/40' 
                : 'text-[#30251E] hover:bg-[#173D32]/10 hover:text-[#173D32]'
            }`}
          >
            <ImageIcon className="w-4 h-4 shrink-0" />
            <span>Ambience Gallery</span>
          </button>

          <div className="border-t border-[#E4D7BF] my-3 pt-3 px-1 hidden md:block">
            <div className="bg-[#F8EEDB] p-3 rounded-xl border border-[#E4D7BF] space-y-1.5">
              <span className="text-xs font-bold text-[#B58C45] uppercase tracking-wider block">Live Session</span>
              <span className="block text-xs text-[#30251E] font-medium truncate">Role: Administrator</span>
              <div className="flex items-center gap-2 text-xs text-[#30251E] font-medium pt-0.5">
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
                <div className="bg-[#FFF9EF] p-5 rounded-2xl border border-[#E4D7BF] shadow-[0_4px_16px_rgba(23,61,50,0.06)] space-y-1.5">
                  <span className="text-xs text-[#75685A] font-semibold tracking-wide uppercase block">Total Cuisine Items</span>
                  <div className="text-3xl font-display font-bold text-[#173D32] tracking-tight">{stats.totalDishes}</div>
                  <span className="text-xs text-[#75685A] font-medium block">
                    {stats.subVeg} Veg • {stats.subNonVeg} Non-Veg
                  </span>
                </div>
                
                <div className="bg-[#FFF9EF] p-5 rounded-2xl border border-[#E4D7BF] shadow-[0_4px_16px_rgba(23,61,50,0.06)] space-y-1.5">
                  <span className="text-xs text-[#75685A] font-semibold tracking-wide uppercase block">Menu Categories</span>
                  <div className="text-3xl font-display font-bold text-[#173D32] tracking-tight">{stats.totalCats}</div>
                  <span className="text-xs text-[#75685A] font-medium block">Active Filter Tabs</span>
                </div>

                <div className="bg-[#FFF9EF] p-5 rounded-2xl border border-[#E4D7BF] shadow-[0_4px_16px_rgba(23,61,50,0.06)] space-y-1.5">
                  <span className="text-xs text-[#75685A] font-semibold tracking-wide uppercase block">Today's Promotion</span>
                  <div className={`text-3xl font-display font-bold tracking-tight ${stats.todaysSpecialsCount > 0 ? "text-[#386B4D]" : "text-[#75685A]"}`}>
                    {stats.todaysSpecialsCount > 0 ? 'LIVE' : 'OFF'}
                  </div>
                  <span className="text-xs text-[#75685A] font-medium block truncate">
                    {stats.todaysSpecialsCount} items featured
                  </span>
                </div>

                <div className="bg-[#FFF9EF] p-5 rounded-2xl border border-[#E4D7BF] shadow-[0_4px_16px_rgba(23,61,50,0.06)] space-y-1.5">
                  <span className="text-xs text-[#75685A] font-semibold tracking-wide uppercase block">Ambience Photo Assets</span>
                  <div className="text-3xl font-display font-bold text-[#173D32] tracking-tight">{gallery.length}</div>
                  <span className="text-xs text-[#75685A] font-medium block">High-resolution assets</span>
                </div>
              </div>

              {/* Special Promoters Board quick control switches */}
              <div className="bg-[#FFF9EF] rounded-2xl border border-[#E4D7BF] shadow-[0_4px_16px_rgba(23,61,50,0.06)] p-6 space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#173D32]/10 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-[#173D32]" />
                  </div>
                  <div>
                    <h3 className="text-base font-display font-bold text-[#173D32]">Fast Promotion Manager</h3>
                    <p className="text-xs text-[#75685A] mt-0.5">Toggle live customer spotlight segments: Today's Specials, Chef's Choices, Bestsellers, and Customer Favorites.</p>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-[#E4D7BF]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#F8EEDB] border-b border-[#E4D7BF] text-[#75685A] font-bold text-xs uppercase tracking-wider">
                        <th className="py-3 px-4">Cuisine Title</th>
                        <th className="py-3 px-4 text-center">
                          <span className="inline-flex items-center gap-1.5 justify-center">
                            <Sparkles className="w-3.5 h-3.5 text-[#D9B66D]" />
                            Today's Special
                          </span>
                        </th>
                        <th className="py-3 px-4 text-center">
                          <span className="inline-flex items-center gap-1.5 justify-center">
                            <ChefHat className="w-3.5 h-3.5 text-[#173D32]" />
                            Chef Choice
                          </span>
                        </th>
                        <th className="py-3 px-4 text-center">
                          <span className="inline-flex items-center gap-1.5 justify-center">
                            <Flame className="w-3.5 h-3.5 text-[#D9B66D]" />
                            Bestseller
                          </span>
                        </th>
                        <th className="py-3 px-4 text-center">
                          <span className="inline-flex items-center gap-1.5 justify-center">
                            <Heart className="w-3.5 h-3.5 text-[#173D32]" />
                            Favorite
                          </span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E4D7BF] bg-white">
                      {dishes.slice(0, 10).map(dish => (
                        <tr key={dish.id} className="hover:bg-[#F8EEDB]/60 transition-colors">
                          <td className="py-3 px-4 font-semibold text-[#30251E] truncate max-w-[200px]">
                            <div className="font-display font-bold text-sm text-[#30251E]">{dish.name}</div>
                            <span className="text-[11px] font-semibold text-[#B58C45] tracking-wide uppercase mt-0.5 block">
                              {dish.category}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleTogglePromoOnDish(dish.id, 'todaySpecial')}
                              className={`px-3 py-1 text-xs font-bold rounded-full transition-all border ${
                                dish.todaySpecial 
                                  ? 'bg-[#D9B66D]/20 text-[#B58C45] border-[#D9B66D]/60 shadow-xs' 
                                  : 'bg-white text-[#75685A] border-[#E4D7BF] hover:border-[#173D32]/50 hover:text-[#173D32]'
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
                                  ? 'bg-[#173D32]/10 text-[#173D32] border-[#173D32]/30 shadow-xs' 
                                  : 'bg-white text-[#75685A] border-[#E4D7BF] hover:border-[#173D32]/50 hover:text-[#173D32]'
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
                                  ? 'bg-[#9B4935]/15 text-[#9B4935] border-[#9B4935]/40 shadow-xs' 
                                  : 'bg-white text-[#75685A] border-[#E4D7BF] hover:border-[#173D32]/50 hover:text-[#173D32]'
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
                                  ? 'bg-[#D9B66D]/20 text-[#B58C45] border-[#D9B66D]/40 shadow-xs' 
                                  : 'bg-white text-[#75685A] border-[#E4D7BF] hover:border-[#173D32]/50 hover:text-[#173D32]'
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
                    <div className="text-center py-3 text-xs text-[#75685A] bg-[#F8EEDB] border-t border-[#E4D7BF]">
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
              <div className="lg:col-span-5 bg-[#FFF9EF] p-5 rounded-2xl border border-[#E4D7BF] shadow-[0_4px_16px_rgba(23,61,50,0.06)] space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#173D32]/10 flex items-center justify-center shrink-0">
                    {editingDish ? <Edit3 className="w-4 h-4 text-[#173D32]" /> : <Plus className="w-4 h-4 text-[#173D32]" />}
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base text-[#173D32]">
                      {editingDish ? 'Edit Dish Details' : 'Add New Dish'}
                    </h3>
                    <p className="text-xs text-[#75685A] mt-0.5">Configure dish information, pricing, tags, and cover image.</p>
                  </div>
                </div>

                <form onSubmit={handleSaveDishSubmit} className="space-y-4 text-xs font-medium text-[#30251E]">
                  <div>
                    <label className="block text-xs font-bold text-[#30251E] uppercase tracking-wider mb-1">Cuisine Name</label>
                    <input
                      type="text"
                      value={dishForm.name}
                      onChange={(e) => setDishForm({ ...dishForm, name: e.target.value })}
                      placeholder="e.g. Butter Chicken"
                      className="w-full bg-white border border-[#E4D7BF] rounded-xl p-2.5 text-xs text-[#30251E] focus:outline-none focus:border-[#173D32] focus:ring-1 focus:ring-[#173D32]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#30251E] uppercase tracking-wider mb-1">Description</label>
                    <textarea
                      value={dishForm.description}
                      onChange={(e) => setDishForm({ ...dishForm, description: e.target.value })}
                      placeholder="Rich, creamy tomato curry sauce cooked with aromatic spices..."
                      className="w-full bg-white border border-[#E4D7BF] rounded-xl p-2.5 text-xs text-[#30251E] focus:outline-none focus:border-[#173D32] focus:ring-1 focus:ring-[#173D32]"
                      rows={2}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#30251E] uppercase tracking-wider mb-1">Price (THB)</label>
                      <input
                        type="number"
                        value={dishForm.priceTHB}
                        onChange={(e) => setDishForm({ ...dishForm, priceTHB: Number(e.target.value) })}
                        placeholder="290"
                        className="w-full bg-white border border-[#E4D7BF] rounded-xl p-2.5 text-xs text-[#30251E] focus:outline-none focus:border-[#173D32] focus:ring-1 focus:ring-[#173D32]"
                        min={0}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#30251E] uppercase tracking-wider mb-1">Menu Category</label>
                      <select
                        value={dishForm.category}
                        onChange={(e) => setDishForm({ ...dishForm, category: e.target.value })}
                        className="w-full bg-white border border-[#E4D7BF] rounded-xl p-2.5 text-xs text-[#30251E] focus:outline-none focus:border-[#173D32] focus:ring-1 focus:ring-[#173D32]"
                      >
                        {categories.filter(c => c.id !== 'all').map(c => (
                          <option key={c.id} value={c.id}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#30251E] uppercase tracking-wider mb-1">Diet Type</label>
                      <select
                        value={dishForm.type}
                        onChange={(e) => setDishForm({ ...dishForm, type: e.target.value as 'veg' | 'nonveg' })}
                        className="w-full bg-white border border-[#E4D7BF] rounded-xl p-2.5 text-xs text-[#30251E] focus:outline-none focus:border-[#173D32] focus:ring-1 focus:ring-[#173D32]"
                      >
                        <option value="veg">🌱 Veg</option>
                        <option value="nonveg">🍗 Non-Veg</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#30251E] uppercase tracking-wider mb-1">Spice Index</label>
                      <input
                        type="text"
                        value={dishForm.spiceLevel}
                        onChange={(e) => setDishForm({ ...dishForm, spiceLevel: e.target.value })}
                        placeholder="e.g. Mild / Medium / Spicy"
                        className="w-full bg-white border border-[#E4D7BF] rounded-xl p-2.5 text-xs text-[#30251E] focus:outline-none focus:border-[#173D32] focus:ring-1 focus:ring-[#173D32]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#30251E] uppercase tracking-wider mb-1">Menu Sort Order</label>
                    <input
                      type="number"
                      value={dishForm.display_order ?? 0}
                      onChange={(e) => setDishForm({ ...dishForm, display_order: Number(e.target.value) })}
                      placeholder="0"
                      className="w-full bg-white border border-[#E4D7BF] rounded-xl p-2.5 text-xs text-[#30251E] focus:outline-none focus:border-[#173D32] focus:ring-1 focus:ring-[#173D32]"
                    />
                  </div>

                  {/* Food image upload controls */}
                  <div>
                    <label className="block text-xs font-bold text-[#30251E] uppercase tracking-wider mb-1">Dish Picture Cover</label>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1.5 pb-1">
                        <span className="bg-[#D9B66D]/20 text-[#B58C45] text-xs px-2.5 py-0.5 rounded-full font-semibold border border-[#D9B66D]/30">
                          Recommended: 1200 × 1200 px
                        </span>
                        <span className="bg-[#F8EEDB] text-[#75685A] text-xs px-2.5 py-0.5 rounded-full font-semibold border border-[#E4D7BF]">
                          Max: 2 MB
                        </span>
                      </div>

                      {/* Source mode toggle buttons */}
                      <div className="flex rounded-xl bg-[#F8EEDB] p-1 border border-[#E4D7BF] gap-1">
                        <button
                          type="button"
                          onClick={() => setDishImageMode('upload')}
                          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                            dishImageMode === 'upload'
                              ? 'bg-white text-[#173D32] shadow-xs'
                              : 'text-[#75685A] hover:text-[#30251E]'
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
                              ? 'bg-white text-[#173D32] shadow-xs'
                              : 'text-[#75685A] hover:text-[#30251E]'
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
                            className="w-full text-center border-dashed border-[#B58C45]/40 border bg-[#FFF9EF] text-xs text-[#B58C45] font-bold py-3 rounded-xl hover:bg-[#F8EEDB] transition-all flex items-center justify-center gap-2"
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
                              placeholder="Paste Instagram image address (Copy Image Address) or post link..."
                              className="flex-1 bg-white border border-[#E4D7BF] rounded-xl p-2.5 text-xs text-[#30251E] focus:outline-none focus:border-[#173D32]"
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
                              className="bg-[#173D32] hover:bg-[#102C25] text-[#FFF9EF] px-4 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50"
                            >
                              {isFetchingLink ? (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  Loading...
                                </>
                              ) : (
                                <>
                                  <LinkIcon className="w-3.5 h-3.5" />
                                  Fetch & Load
                                </>
                              )}
                            </button>
                          </div>
                          <div className="bg-[#F8EEDB] p-3 rounded-xl border border-[#E4D7BF] text-xs text-[#75685A] leading-relaxed">
                            💡 <strong>Instagram Photo Trick:</strong> Instagram par apni photo open karein, photo par <strong>Right-click (ya phone me Long Press / Share)</strong> karke <strong>"Copy Image Address"</strong> select karein aur yahan paste karein. Photo turant Supabase Storage par load ho jayegi!
                          </div>
                        </div>
                      )}

                      {/* Manual Image URL override */}
                      <div>
                        <span className="block text-[11px] font-semibold text-[#75685A] mb-1">Active Image Asset URL:</span>
                        <input
                          type="text"
                          value={dishForm.image || ''}
                          onChange={(e) => setDishForm({ ...dishForm, image: e.target.value })}
                          placeholder="Direct image URL or Supabase CDN link..."
                          className="w-full bg-[#F8EEDB] border border-[#E4D7BF] rounded-xl p-2 text-xs text-[#75685A] focus:outline-none focus:border-[#173D32]"
                        />
                      </div>

                      {foodImgValidation && (
                        <div className="bg-[#FFF9EF] border border-[#E4D7BF] p-3 rounded-xl space-y-1 text-xs text-[#5C3E1F]">
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
                        <div className="border border-[#E4D7BF] p-2.5 rounded-xl bg-white space-y-1.5 flex flex-col items-center">
                          <span className="text-xs text-[#75685A] font-semibold uppercase tracking-wider">Preview</span>
                          <div className="overflow-hidden rounded-xl bg-gray-50 aspect-square w-28 border border-[#E4D7BF] shadow-xs">
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
                  <div className="bg-[#F8EEDB] border border-[#E4D7BF] p-3.5 rounded-xl space-y-2.5">
                    <span className="block text-xs font-bold text-[#B58C45] uppercase tracking-wider">Promotional Placements</span>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {[
                        { key: 'todaySpecial', label: "Today's Special", icon: Sparkles },
                        { key: 'chefSpecial', label: "Chef's Choice", icon: ChefHat },
                        { key: 'bestseller', label: "Bestseller", icon: Flame },
                        { key: 'customerFavorite', label: "Customer Favorite", icon: Heart },
                      ].map((item) => {
                        const isChecked = !!dishForm[item.key as keyof typeof dishForm];
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => setDishForm({ ...dishForm, [item.key]: !isChecked })}
                            className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all text-left cursor-pointer ${
                              isChecked
                                ? 'bg-[#173D32] text-[#FFF9EF] border-[#173D32] shadow-xs'
                                : 'bg-white text-[#75685A] border-[#E4D7BF] hover:bg-[#F8EEDB]'
                            }`}
                          >
                            <Icon className={`w-3.5 h-3.5 shrink-0 ${isChecked ? 'text-[#D9B66D]' : 'text-[#75685A]'}`} />
                            <span className="truncate">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Interactive Ingredients builder */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#30251E] uppercase tracking-wider">
                      Ingredients ({dishForm.ingredients?.length || 0})
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={ingredientInput}
                        onChange={(e) => setIngredientInput(e.target.value)}
                        placeholder="e.g. Cardamom, Ginger, Garlic..."
                        className="flex-1 bg-white border border-[#E4D7BF] rounded-xl p-2.5 text-xs text-[#30251E] focus:outline-none focus:border-[#173D32]"
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
                        className="bg-[#173D32] text-[#FFF9EF] px-3.5 font-bold rounded-xl hover:bg-[#102C25] transition-colors"
                      >
                        Add
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 max-h-[85px] overflow-y-auto pt-1">
                      {dishForm.ingredients?.map((ing, idx) => (
                        <span 
                          key={idx}
                          onClick={() => handleRemoveIngredient(idx)}
                          className="text-xs bg-[#F8EEDB] border border-[#E4D7BF] text-[#30251E] px-2.5 py-1 rounded-full cursor-pointer hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 flex items-center gap-1.5 transition-colors"
                          title="Click to remove"
                        >
                          {ing} <span className="opacity-60 text-xs">✕</span>
                        </span>
                      ))}
                      {(!dishForm.ingredients || dishForm.ingredients.length === 0) && (
                        <div className="text-xs text-[#75685A] italic py-1">No ingredients added yet.</div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      className="flex-1 bg-[#173D32] hover:bg-[#102C25] text-[#FFF9EF] font-bold py-2.5 rounded-xl text-xs transition-colors shadow-xs"
                    >
                      {editingDish ? 'Save Changes' : 'Create Dish'}
                    </button>
                    {editingDish && (
                      <button
                        type="button"
                        onClick={handleCancelEditDish}
                        className="bg-[#F8EEDB] hover:bg-[#E4D7BF] text-[#30251E] font-semibold px-4 rounded-xl text-xs transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* CUISINE DISHES GRID LISTING PANEL (RIGHT SIDE 7 COLS) */}
              <div className="lg:col-span-7 bg-[#FFF9EF] p-5 rounded-2xl border border-[#E4D7BF] shadow-[0_4px_16px_rgba(23,61,50,0.06)] flex flex-col min-h-[520px] h-[calc(100vh-220px)] max-h-[700px]">
                <div className="flex items-center justify-between pb-3 border-b border-[#E4D7BF]">
                  <div>
                    <h3 className="font-display font-bold text-base text-[#173D32]">Menu Items ({dishes.length})</h3>
                    <p className="text-xs text-[#75685A] mt-0.5">Manage live dish items, ordering, status, and promotions.</p>
                  </div>
                </div>

                <div className="overflow-y-auto flex-1 space-y-3.5 pr-1.5 scrollbar-thin pt-3">
                  {dishes.map(dish => (
                    <div 
                      key={dish.id} 
                      className={`bg-white rounded-2xl border transition-all p-4 space-y-3 shadow-xs hover:shadow-md ${
                        editingDish?.id === dish.id 
                          ? 'border-[#173D32] ring-1 ring-[#173D32] bg-[#FFF9EF]' 
                          : 'border-[#E4D7BF] hover:border-[#173D32]/40'
                      }`}
                    >
                      {/* Top Header Row: Thumbnail + Title + Price + Actions Toolbar */}
                      <div className="flex items-start gap-3.5">
                        <img 
                          src={dish.image} 
                          alt={dish.name} 
                          className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl flex-shrink-0 border border-[#E4D7BF] bg-[#F8EEDB] shadow-2xs"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1000&q=80';
                          }}
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h4 className="font-display font-bold text-base text-[#173D32] truncate leading-snug">{dish.name}</h4>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="font-display font-bold text-[#B58C45] text-sm">฿{dish.priceTHB}</span>
                                <span className="text-[#E4D7BF]">•</span>
                                <span className="text-[11px] font-bold uppercase tracking-wider text-[#75685A]">{dish.category}</span>
                              </div>
                            </div>

                            {/* Toolbar actions */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleEditDish(dish)}
                                className="h-8 px-3 rounded-lg text-xs font-bold text-[#173D32] bg-[#F8EEDB] hover:bg-[#E4D7BF] border border-[#E4D7BF] transition-all flex items-center gap-1.5 cursor-pointer"
                                title="Edit dish details"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleDisableDish(dish)}
                                className={`h-8 px-2.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                                  dish.active !== false
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                    : 'bg-[#F8EEDB] text-[#75685A] border-[#E4D7BF] hover:bg-[#E4D7BF]'
                                }`}
                                title={dish.active !== false ? 'Click to hide dish' : 'Click to show dish'}
                              >
                                <span className={`w-2 h-2 rounded-full ${dish.active !== false ? 'bg-emerald-600' : 'bg-[#75685A]'}`} />
                                <span>{dish.active !== false ? 'Active' : 'Hidden'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteDish(dish.id, dish.name)}
                                className="h-8 px-2.5 rounded-lg text-xs font-bold text-[#A33C32] hover:bg-[#A33C32]/10 border border-[#A33C32]/25 transition-all flex items-center gap-1 cursor-pointer"
                                title="Delete dish"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Description */}
                          <p className="text-xs text-[#75685A] line-clamp-2 mt-1.5 leading-relaxed">{dish.description}</p>
                        </div>
                      </div>

                      {/* Badges Row */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <span className={`text-[11px] px-2 py-0.5 rounded-md font-bold uppercase ${
                          dish.type === 'veg' 
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}>
                          {dish.type === 'veg' ? '🌱 Veg' : '🍗 Non-Veg'}
                        </span>
                        {dish.todaySpecial && (
                          <span className="text-[11px] bg-[#D9B66D]/20 text-[#B58C45] border border-[#D9B66D]/40 px-2 py-0.5 rounded-md font-bold inline-flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> Special
                          </span>
                        )}
                        {dish.chefSpecial && (
                          <span className="text-[11px] bg-[#173D32]/10 text-[#173D32] border border-[#173D32]/30 px-2 py-0.5 rounded-md font-bold inline-flex items-center gap-1">
                            <ChefHat className="w-3 h-3" /> Chef
                          </span>
                        )}
                        {dish.bestseller && (
                          <span className="text-[11px] bg-[#9B4935]/15 text-[#9B4935] border border-[#9B4935]/30 px-2 py-0.5 rounded-md font-bold inline-flex items-center gap-1">
                            <Flame className="w-3 h-3" /> Bestseller
                          </span>
                        )}
                        {dish.customerFavorite && (
                          <span className="text-[11px] bg-[#D9B66D]/20 text-[#B58C45] border border-[#D9B66D]/30 px-2 py-0.5 rounded-md font-bold inline-flex items-center gap-1">
                            <Heart className="w-3 h-3" /> Favorite
                          </span>
                        )}
                        {dish.spiceLevel && (
                          <span className="text-[11px] bg-[#F8EEDB] text-[#75685A] border border-[#E4D7BF] px-2 py-0.5 rounded-md font-medium">
                            🌶️ {dish.spiceLevel}
                          </span>
                        )}
                      </div>

                      {/* Steppers & Metadata Row */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-[#E4D7BF]/70 text-xs text-[#75685A]">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-xs">Menu Order:</span>
                            <input
                              type="number"
                              value={dish.display_order ?? 0}
                              onChange={(e) => handleUpdateDishOrderField(dish.id, 'display_order', Number(e.target.value))}
                              className="w-12 h-6.5 border border-[#E4D7BF] rounded-md text-xs text-center font-bold bg-[#F8EEDB] text-[#30251E] focus:outline-none focus:border-[#173D32]"
                            />
                          </div>

                          {dish.todaySpecial && (
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-xs text-[#B58C45]">Spec:</span>
                              <input
                                type="number"
                                value={dish.display_order_today ?? 0}
                                onChange={(e) => handleUpdateDishOrderField(dish.id, 'display_order_today', Number(e.target.value))}
                                className="w-12 h-6.5 border border-[#D9B66D]/50 rounded-md text-xs text-center font-bold bg-[#D9B66D]/10 text-[#B58C45] focus:outline-none focus:border-[#173D32]"
                              />
                            </div>
                          )}

                          {dish.chefSpecial && (
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-xs text-[#173D32]">Chef:</span>
                              <input
                                type="number"
                                value={dish.display_order_chef ?? 0}
                                onChange={(e) => handleUpdateDishOrderField(dish.id, 'display_order_chef', Number(e.target.value))}
                                className="w-12 h-6.5 border border-[#173D32]/40 rounded-md text-xs text-center font-bold bg-[#173D32]/10 text-[#173D32] focus:outline-none focus:border-[#173D32]"
                              />
                            </div>
                          )}
                        </div>

                        <span className="text-[11px] font-mono text-[#75685A]/80">ID: {dish.id}</span>
                      </div>
                    </div>
                  ))}
                  {dishes.length === 0 && (
                    <div className="py-20 text-center text-xs text-[#75685A] italic">No cuisines available. Create menu items above.</div>
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
              
              <div className="bg-[#FFF9EF] p-5 md:p-6 rounded-2xl border border-[#E4D7BF] shadow-[0_4px_16px_rgba(23,61,50,0.06)] space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#173D32]/10 flex items-center justify-center shrink-0">
                    <Tag className="w-4 h-4 text-[#173D32]" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base text-[#173D32]">Add Menu Category</h3>
                    <p className="text-xs text-[#75685A] mt-0.5">Define category tabs for sorting and filtering menu items on the public site.</p>
                  </div>
                </div>

                <form onSubmit={handleAddCategory} className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end">
                  <div className="md:col-span-5">
                    <label className="block text-xs font-bold text-[#30251E] uppercase tracking-wider mb-1.5">Unique Code ID (Slug)</label>
                    <input
                      type="text"
                      value={newCatId}
                      onChange={(e) => setNewCatId(e.target.value)}
                      placeholder="e.g. punjabi-special"
                      className="w-full h-10 bg-white border border-[#E4D7BF] rounded-xl px-3.5 text-xs text-[#30251E] focus:outline-none focus:border-[#173D32] focus:ring-1 focus:ring-[#173D32]"
                      required
                    />
                  </div>
                  <div className="md:col-span-5">
                    <label className="block text-xs font-bold text-[#30251E] uppercase tracking-wider mb-1.5">Display Label</label>
                    <input
                      type="text"
                      value={newCatLabel}
                      onChange={(e) => setNewCatLabel(e.target.value)}
                      placeholder="e.g. Punjabi Specials"
                      className="w-full h-10 bg-white border border-[#E4D7BF] rounded-xl px-3.5 text-xs text-[#30251E] focus:outline-none focus:border-[#173D32] focus:ring-1 focus:ring-[#173D32]"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <button
                      type="submit"
                      className="w-full h-10 bg-[#173D32] hover:bg-[#102C25] text-[#FFF9EF] font-bold py-2 px-3 rounded-xl text-xs transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      Create
                    </button>
                  </div>
                </form>
              </div>

              <div className="bg-[#FFF9EF] p-5 md:p-6 rounded-2xl border border-[#E4D7BF] shadow-[0_4px_16px_rgba(23,61,50,0.06)] space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display font-bold text-base text-[#173D32]">Active Category Tabs ({categories.length})</h3>
                    <p className="text-xs text-[#75685A] mt-0.5">Manage, sort, and reorder categories displayed on the public navigation bar.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                  {categories.map(cat => {
                    const count = dishes.filter(d => d.category === cat.id).length;
                    const isPrimary = cat.id === 'all';
                    return (
                      <div 
                        key={cat.id} 
                        className="bg-white p-4 rounded-2xl border border-[#E4D7BF] flex flex-col justify-between gap-3 hover:border-[#173D32]/40 transition-all shadow-xs h-full min-h-[175px]"
                      >
                        {/* Top title and status badge */}
                        <div>
                          <div className="flex justify-between items-start gap-2">
                            <div className="min-w-0">
                              <h4 className="font-display font-bold text-base text-[#173D32] leading-snug truncate">{cat.label}</h4>
                              <span className="text-[11px] font-mono text-[#75685A] block mt-0.5">ID: {cat.id}</span>
                            </div>
                            {isPrimary ? (
                              <span className="text-[11px] bg-[#D9B66D]/20 text-[#B58C45] border border-[#D9B66D]/40 font-bold px-2.5 py-0.5 rounded-full shrink-0">
                                Primary Tab
                              </span>
                            ) : (
                              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 border ${
                                cat.active !== false
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : 'bg-[#F8EEDB] text-[#75685A] border-[#E4D7BF]'
                              }`}>
                                {cat.active !== false ? 'Active' : 'Hidden'}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 text-xs text-[#75685A] mt-2 font-medium">
                            <UtensilsCrossed className="w-3.5 h-3.5 text-[#B58C45]" />
                            <span>{count} dishes linked</span>
                          </div>
                        </div>

                        {/* Middle sort order stepper */}
                        <div className="flex items-center justify-between text-xs pt-2.5 border-t border-[#E4D7BF]/70">
                          <span className="text-[#75685A] font-semibold">Sort Order:</span>
                          <input
                            type="number"
                            value={cat.display_order ?? 0}
                            onChange={(e) => handleUpdateCategoryOrder(cat.id, Number(e.target.value))}
                            className="w-14 h-7 border border-[#E4D7BF] rounded-lg text-xs text-center font-bold bg-[#F8EEDB] text-[#30251E] focus:outline-none focus:border-[#173D32]"
                          />
                        </div>

                        {/* Bottom Actions */}
                        <div className="pt-2 border-t border-[#E4D7BF]/70">
                          {isPrimary ? (
                            <div className="text-[11px] text-[#75685A] italic py-1 text-center font-medium">
                              ⭐ Core default category (Always shown)
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleToggleDisableCategory(cat)}
                                className={`flex-1 h-8 rounded-lg text-xs font-bold transition-all border flex items-center justify-center gap-1.5 cursor-pointer ${
                                  cat.active !== false
                                    ? 'bg-[#FFF9EF] hover:bg-[#F8EEDB] text-[#75685A] border-[#E4D7BF]'
                                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                                }`}
                              >
                                {cat.active !== false ? 'Hide Tab' : 'Show Tab'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCategory(cat.id, cat.label)}
                                className="h-8 px-3 text-xs font-bold text-[#A33C32] hover:bg-[#A33C32]/10 border border-[#A33C32]/25 rounded-lg transition-all cursor-pointer"
                                title="Delete this custom category"
                              >
                                Delete
                              </button>
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
            <div className="bg-[#FFF9EF] p-5 md:p-6 rounded-2xl border border-[#E4D7BF] shadow-[0_4px_16px_rgba(23,61,50,0.06)] space-y-6">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#173D32]/10 flex items-center justify-center shrink-0">
                  <Store className="w-4 h-4 text-[#173D32]" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-[#173D32]">Brand Profile & Heritage Story</h3>
                  <p className="text-xs text-[#75685A] mt-0.5">Manage opening hours, location address, contact info, and culinary story.</p>
                </div>
              </div>

              <form onSubmit={handleSaveProfileSubmit} className="space-y-4 text-xs font-semibold text-[#30251E]">
                
                <div>
                  <label className="block text-xs font-bold text-[#30251E] uppercase tracking-wider mb-1.5">Restaurant Name</label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => {
                      setProfileForm({ ...profileForm, name: e.target.value });
                      setIsProfileDirty(true);
                    }}
                    className="w-full h-10 bg-white border border-[#E4D7BF] rounded-xl px-3.5 text-xs text-[#30251E] focus:outline-none focus:border-[#173D32] focus:ring-1 focus:ring-[#173D32]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#30251E] uppercase tracking-wider mb-1.5">Postal Address</label>
                  <input
                    type="text"
                    value={profileForm.address}
                    onChange={(e) => {
                      setProfileForm({ ...profileForm, address: e.target.value });
                      setIsProfileDirty(true);
                    }}
                    className="w-full h-10 bg-white border border-[#E4D7BF] rounded-xl px-3.5 text-xs text-[#30251E] focus:outline-none focus:border-[#173D32] focus:ring-1 focus:ring-[#173D32]"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#30251E] uppercase tracking-wider mb-1.5">Business Phone Contact</label>
                    <input
                      type="text"
                      value={profileForm.phone}
                      onChange={(e) => {
                        setProfileForm({ ...profileForm, phone: e.target.value });
                        setIsProfileDirty(true);
                      }}
                      className="w-full h-10 bg-white border border-[#E4D7BF] rounded-xl px-3.5 text-xs text-[#30251E] focus:outline-none focus:border-[#173D32] focus:ring-1 focus:ring-[#173D32]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#30251E] uppercase tracking-wider mb-1.5">Opening Hours</label>
                    <input
                      type="text"
                      value={profileForm.openingHours}
                      onChange={(e) => {
                        setProfileForm({ ...profileForm, openingHours: e.target.value });
                        setIsProfileDirty(true);
                      }}
                      className="w-full h-10 bg-white border border-[#E4D7BF] rounded-xl px-3.5 text-xs text-[#30251E] focus:outline-none focus:border-[#173D32] focus:ring-1 focus:ring-[#173D32]"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#30251E] uppercase tracking-wider mb-1.5">Instagram Handle</label>
                    <input
                      type="text"
                      value={profileForm.instagram}
                      onChange={(e) => {
                        setProfileForm({ ...profileForm, instagram: e.target.value });
                        setIsProfileDirty(true);
                      }}
                      className="w-full h-10 bg-white border border-[#E4D7BF] rounded-xl px-3.5 text-xs text-[#30251E] focus:outline-none focus:border-[#173D32] focus:ring-1 focus:ring-[#173D32]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#30251E] uppercase tracking-wider mb-1.5">Website URL</label>
                    <input
                      type="text"
                      value={profileForm.website}
                      onChange={(e) => {
                        setProfileForm({ ...profileForm, website: e.target.value });
                        setIsProfileDirty(true);
                      }}
                      className="w-full h-10 bg-white border border-[#E4D7BF] rounded-xl px-3.5 text-xs text-[#30251E] focus:outline-none focus:border-[#173D32] focus:ring-1 focus:ring-[#173D32]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#30251E] uppercase tracking-wider mb-1.5">Dining Style</label>
                    <input
                      type="text"
                      value={profileForm.diningStyle}
                      onChange={(e) => {
                        setProfileForm({ ...profileForm, diningStyle: e.target.value });
                        setIsProfileDirty(true);
                      }}
                      className="w-full h-10 bg-white border border-[#E4D7BF] rounded-xl px-3.5 text-xs text-[#30251E] focus:outline-none focus:border-[#173D32] focus:ring-1 focus:ring-[#173D32]"
                    />
                  </div>
                </div>

                <div className="border-t border-[#E4D7BF] my-4 pt-4">
                  <h4 className="font-display text-sm font-bold text-[#173D32] mb-3 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-[#173D32]" />
                    Culinary Heritage Story
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-[#30251E] uppercase tracking-wider mb-1.5">Story Paragraphs (One paragraph per line)</label>
                      <textarea
                        value={storyInput}
                        onChange={(e) => {
                          setStoryInput(e.target.value);
                          setIsProfileDirty(true);
                        }}
                        className="w-full bg-white border border-[#E4D7BF] rounded-xl p-3.5 text-xs text-[#30251E] focus:outline-none focus:border-[#173D32] focus:ring-1 focus:ring-[#173D32] leading-relaxed"
                        rows={4}
                        placeholder="Type restaurant story here..."
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#30251E] uppercase tracking-wider mb-1.5">
                        Brand Highlights ({aboutForm.highlights.length})
                      </label>
                      <div className="flex gap-2 mb-2.5">
                        <input
                          type="text"
                          value={highlightInput}
                          onChange={(e) => setHighlightInput(e.target.value)}
                          placeholder="e.g. Sourced fresh from local growers"
                          className="flex-1 h-10 bg-white border border-[#E4D7BF] rounded-xl px-3.5 text-xs text-[#30251E] focus:outline-none focus:border-[#173D32] focus:ring-1 focus:ring-[#173D32]"
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
                          className="h-10 px-4 bg-[#173D32] text-[#FFF9EF] font-bold text-xs rounded-xl hover:bg-[#102C25] transition-colors shrink-0 cursor-pointer"
                        >
                          Add bullet
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto">
                        {aboutForm.highlights.map((tag, i) => (
                          <span
                            key={i}
                            onClick={() => handleRemoveHighlight(i)}
                            className="bg-[#F8EEDB] hover:bg-rose-50 hover:text-rose-700 text-[#30251E] border border-[#E4D7BF] px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                            title="Click to remove"
                          >
                            {tag} <span className="opacity-60 text-xs">✕</span>
                          </span>
                        ))}
                      </div>

                      {isProfileDirty && (
                        <div className="flex items-center gap-2 text-xs text-[#8A5200] bg-[#FFF3D6] border border-[#E4D7BF] px-3.5 py-2 rounded-xl font-medium mt-3">
                          <span>⚠️ <strong>Unsaved Changes:</strong> Please click <strong>"Save Profile Details"</strong> below to publish updates live to the website.</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className={`h-11 px-6 font-bold rounded-xl text-xs transition-all shadow-xs cursor-pointer flex items-center gap-2 ${
                      isProfileDirty
                        ? 'bg-[#173D32] hover:bg-[#102C25] text-[#D9B66D] ring-2 ring-[#D9B66D]'
                        : 'bg-[#173D32] hover:bg-[#102C25] text-[#FFF9EF]'
                    }`}
                  >
                    {isSaving ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-[#D9B66D] border-t-transparent rounded-full animate-spin" />
                        Saving Profile...
                      </>
                    ) : (
                      'Save Profile Details'
                    )}
                  </button>
                  {isProfileDirty && (
                    <span className="text-xs text-[#B26A00] font-semibold animate-pulse">● Unsaved edits</span>
                  )}
                </div>

              </form>
            </div>
          )}

          {/* ====================================================================
              VIEW E: CHAT INTEGRATION GATEWAY
              ==================================================================== */}
          {activeTab === 'chat' && (
            <div className="bg-[#FFF9EF] p-5 md:p-6 rounded-2xl border border-[#E4D7BF] shadow-[0_4px_16px_rgba(23,61,50,0.06)] space-y-6">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#173D32]/10 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4 h-4 text-[#173D32]" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-[#173D32]">WhatsApp & LINE Direct Ordering</h3>
                  <p className="text-xs text-[#75685A] mt-0.5">Configure direct reservation channels and click-to-chat coordinates.</p>
                </div>
              </div>

              <form onSubmit={handleSaveChatSubmit} className="space-y-5 text-xs font-semibold text-[#30251E]">
                
                {/* CONTACT CHANNEL ACTIVE STATE CONTROLLER */}
                <div className="bg-[#F8EEDB] p-5 rounded-2xl border border-[#E4D7BF] space-y-3.5">
                  <div>
                    <h4 className="font-display text-[#173D32] font-bold text-sm">Active Channels</h4>
                    <p className="text-xs text-[#75685A] font-normal mt-0.5">
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
                          className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-center transition-all cursor-pointer min-h-[95px] ${
                            active 
                              ? 'bg-[#173D32] border-[#173D32] text-[#FFF9EF] shadow-md font-bold ring-2 ring-[#D9B66D]/50' 
                              : 'bg-white border-[#E4D7BF] text-[#75685A] hover:bg-[#F8EEDB] font-medium'
                          }`}
                        >
                          <IconComp className={`w-5 h-5 mb-1.5 shrink-0 ${active ? 'text-[#D9B66D]' : 'text-[#75685A]'}`} />
                          <span className={`text-xs font-bold block ${active ? 'text-[#FFF9EF]' : 'text-[#30251E]'}`}>{item.label}</span>
                          <span className={`text-[11px] block mt-0.5 leading-tight ${active ? 'text-[#FFF9EF]/80' : 'text-[#75685A]'}`}>{item.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-[#FFF9EF] p-5 rounded-2xl border border-[#E4D7BF] space-y-4 shadow-xs">
                  <h4 className="text-[#173D32] font-display font-bold text-sm flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#25D366]"></span>
                    WhatsApp Configuration
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#30251E] uppercase tracking-wider mb-1.5">WhatsApp Number</label>
                      <input
                        type="text"
                        value={chatForm.whatsappNumber}
                        onChange={(e) => setChatForm({ ...chatForm, whatsappNumber: e.target.value })}
                        placeholder="+66829560609"
                        className="w-full h-10 bg-white border border-[#E4D7BF] rounded-xl px-3.5 text-xs text-[#30251E] focus:outline-none focus:border-[#173D32] focus:ring-1 focus:ring-[#173D32]"
                        disabled={chatForm.contactActiveChannel === 'line' || chatForm.contactActiveChannel === 'disabled'}
                      />
                      <p className="text-[11px] text-[#75685A] font-normal mt-1">Include country code without special characters (e.g., 66829560609).</p>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#30251E] uppercase tracking-wider mb-1.5">Default Pre-filled Message</label>
                      <input
                        type="text"
                        value={chatForm.whatsappMessage}
                        onChange={(e) => setChatForm({ ...chatForm, whatsappMessage: e.target.value })}
                        placeholder="Hello, I would like to book a table..."
                        className="w-full h-10 bg-white border border-[#E4D7BF] rounded-xl px-3.5 text-xs text-[#30251E] focus:outline-none focus:border-[#173D32] focus:ring-1 focus:ring-[#173D32]"
                        disabled={chatForm.contactActiveChannel === 'line' || chatForm.contactActiveChannel === 'disabled'}
                      />
                      <p className="text-[11px] text-[#75685A] font-normal mt-1">Pre-filled text in the customer's chat when tapping the button.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-[#FFF9EF] p-5 rounded-2xl border border-[#E4D7BF] space-y-4 shadow-xs">
                  <h4 className="text-[#173D32] font-display font-bold text-sm flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#00B900]"></span>
                    LINE Configuration
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#30251E] uppercase tracking-wider mb-1.5">LINE ID</label>
                      <input
                        type="text"
                        value={chatForm.lineId}
                        onChange={(e) => setChatForm({ ...chatForm, lineId: e.target.value })}
                        placeholder="namastesiam"
                        className="w-full h-10 bg-white border border-[#E4D7BF] rounded-xl px-3.5 text-xs text-[#30251E] focus:outline-none focus:border-[#173D32] focus:ring-1 focus:ring-[#173D32]"
                        disabled={chatForm.contactActiveChannel === 'whatsapp' || chatForm.contactActiveChannel === 'disabled'}
                      />
                      <p className="text-[11px] text-[#75685A] font-normal mt-1">Your official LINE handle or ID.</p>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#30251E] uppercase tracking-wider mb-1.5">LINE QR Code Image URL</label>
                      <input
                        type="text"
                        value={chatForm.lineQrUrl}
                        onChange={(e) => setChatForm({ ...chatForm, lineQrUrl: e.target.value })}
                        placeholder="https://..."
                        className="w-full h-10 bg-white border border-[#E4D7BF] rounded-xl px-3.5 text-xs text-[#30251E] focus:outline-none focus:border-[#173D32] focus:ring-1 focus:ring-[#173D32]"
                        disabled={chatForm.contactActiveChannel === 'whatsapp' || chatForm.contactActiveChannel === 'disabled'}
                      />
                      <p className="text-[11px] text-[#75685A] font-normal mt-1">Direct URL to your LINE QR code asset.</p>
                    </div>
                  </div>

                  {chatForm.lineQrUrl && (chatForm.contactActiveChannel === 'line' || chatForm.contactActiveChannel === 'both') && (
                    <div className="pt-2 flex items-center gap-3.5 bg-[#F8EEDB]/60 p-3.5 rounded-xl border border-[#E4D7BF] shadow-xs">
                      <div className="p-1.5 border border-[#E4D7BF] rounded-lg bg-white shrink-0">
                        <img 
                          src={chatForm.lineQrUrl} 
                          alt="LINE QR code" 
                          className="w-20 h-20 object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://line.me/R/ti/p/~' + (chatForm.lineId || 'namastesiam');
                          }}
                        />
                      </div>
                      <span className="text-xs text-[#75685A] leading-relaxed block max-w-sm font-normal">
                        This QR code enables instant scanning and reservations. When left empty, an automatic link is created from your LINE ID.
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="h-11 px-6 bg-[#173D32] hover:bg-[#102C25] text-[#FFF9EF] font-bold rounded-xl text-xs transition-colors shadow-xs cursor-pointer"
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
              <div className="lg:col-span-5 bg-[#FFF9EF] p-5 rounded-2xl border border-[#E4D7BF] shadow-[0_4px_16px_rgba(23,61,50,0.06)] space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#173D32]/10 flex items-center justify-center shrink-0">
                    <ImageIcon className="w-4 h-4 text-[#173D32]" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base text-[#173D32]">
                      {editingGalleryIndex !== null ? `Replace Photo #${editingGalleryIndex + 1}` : 'Add Ambience Photo'}
                    </h3>
                    <p className="text-xs text-[#75685A] mt-0.5">
                      {editingGalleryIndex !== null 
                        ? 'Replace this specific photo in the ambience gallery.' 
                        : 'Upload interior dining, bar, or culinary presentation photography.'}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleAddGalleryItemSubmit} className="space-y-4 text-xs font-medium text-[#30251E]">
                  <div>
                    <div className="flex flex-wrap gap-1.5 pb-1">
                      <span className="bg-[#D9B66D]/20 text-[#B58C45] text-xs px-2.5 py-0.5 rounded-full font-semibold border border-[#D9B66D]/30">
                        Recommended: 1600 × 900 px
                      </span>
                      <span className="bg-[#F8EEDB] text-[#75685A] text-xs px-2.5 py-0.5 rounded-full font-semibold border border-[#E4D7BF]">
                        Max: 2 MB
                      </span>
                    </div>

                    {/* Ambience source mode toggle buttons */}
                    <div className="flex rounded-xl bg-[#F8EEDB] p-1 border border-[#E4D7BF] gap-1 my-2">
                      <button
                        type="button"
                        onClick={() => setGalleryImageMode('upload')}
                        className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                          galleryImageMode === 'upload'
                            ? 'bg-white text-[#173D32] shadow-xs'
                            : 'text-[#75685A] hover:text-[#30251E]'
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
                            ? 'bg-white text-[#173D32] shadow-xs'
                            : 'text-[#75685A] hover:text-[#30251E]'
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
                          className="w-full text-center border-dashed border-[#B58C45]/40 border bg-white text-xs text-[#B58C45] font-bold py-3 rounded-xl hover:bg-[#F8EEDB] transition-all flex items-center justify-center gap-2"
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
                            placeholder="Paste Instagram image address (Copy Image Address) or web link..."
                            className="flex-1 bg-white border border-[#E4D7BF] rounded-xl p-2.5 text-xs text-[#30251E] focus:outline-none focus:border-[#173D32]"
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
                            className="bg-[#173D32] hover:bg-[#102C25] text-[#FFF9EF] px-4 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50"
                          >
                            {isFetchingGalleryLink ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                Loading...
                              </>
                            ) : (
                              <>
                                <LinkIcon className="w-3.5 h-3.5" />
                                Fetch & Load
                              </>
                            )}
                          </button>
                        </div>
                        <div className="bg-[#F8EEDB] p-3 rounded-xl border border-[#E4D7BF] text-xs text-[#75685A] leading-relaxed">
                          💡 <strong>Instagram Photo Trick:</strong> Instagram par photo par <strong>Right-click / Long press</strong> karke <strong>"Copy Image Address"</strong> copy karein aur yahan paste karein. Photo turant Supabase Storage par load ho jayegi!
                        </div>
                      </div>
                    )}

                    {/* Manual Image URL override */}
                    <div className="mt-2">
                      <span className="block text-[11px] font-semibold text-[#75685A] mb-1">Active Ambience Asset URL:</span>
                      <input
                        type="text"
                        value={galleryForm.image}
                        onChange={(e) => setGalleryForm({ ...galleryForm, image: e.target.value })}
                        placeholder="Direct image URL or Supabase CDN link..."
                        className="w-full bg-[#F8EEDB] border border-[#E4D7BF] rounded-xl p-2 text-xs text-[#75685A] focus:outline-none focus:border-[#173D32]"
                      />
                    </div>

                    {galleryImgValidation && (
                      <div className="bg-white border border-[#E4D7BF] p-3 rounded-xl space-y-1 text-xs text-[#5C3E1F] mt-2 shadow-xs">
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
                    <label className="block text-xs font-bold text-[#30251E] uppercase tracking-wider mb-1">Image Description (Alt Text)</label>
                    <input
                      type="text"
                      value={galleryForm.alt}
                      onChange={(e) => setGalleryForm({ ...galleryForm, alt: e.target.value })}
                      placeholder="e.g. Elegant warm dining room with traditional brass lamps"
                      className="w-full bg-white border border-[#E4D7BF] rounded-xl p-2.5 text-xs text-[#30251E] focus:outline-none focus:border-[#173D32]"
                      required
                    />
                  </div>

                  <div className="bg-[#F8EEDB] border border-[#E4D7BF] p-3 rounded-xl">
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-xs text-[#30251E]">
                      <input
                        type="checkbox"
                        checked={galleryForm.tall}
                        onChange={(e) => setGalleryForm({ ...galleryForm, tall: e.target.checked })}
                        className="rounded border-[#B58C45]/40 text-[#173D32] focus:ring-0"
                      />
                      <span>Tall vertical grid format (Bento expansion card)</span>
                    </label>
                  </div>

                  {galleryForm.image && (
                    <div className="border border-[#E4D7BF] p-2 rounded-xl bg-white flex flex-col items-center justify-center">
                      <span className="text-[11px] text-[#75685A] font-semibold uppercase tracking-wider mb-1">Preview</span>
                      <img 
                        src={galleryForm.image} 
                        alt="Ambience preview" 
                        className={`object-cover rounded-xl border border-[#E4D7BF] shadow-xs ${galleryForm.tall ? 'w-20 h-28' : 'w-full max-w-[180px] h-24'}`}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1528605105345-5344ea20e269?auto=format&fit=crop&w=1200&q=80';
                        }}
                      />
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 bg-[#173D32] hover:bg-[#102C25] text-[#FFF9EF] font-bold py-2.5 rounded-xl text-xs transition-colors shadow-xs cursor-pointer"
                    >
                      {editingGalleryIndex !== null ? 'Replace Photo' : '+ Add Photo to Gallery'}
                    </button>
                    {editingGalleryIndex !== null && (
                      <button
                        type="button"
                        onClick={handleCancelEditGalleryItem}
                        className="bg-[#F8EEDB] hover:bg-[#E4D7BF] text-[#30251E] font-semibold px-4 rounded-xl text-xs transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* GALLERY IMAGES PREVIEW COLLAGE AND PURGER */}
              <div className="lg:col-span-7 bg-[#FFF9EF] p-5 md:p-6 rounded-2xl border border-[#E4D7BF] shadow-[0_4px_16px_rgba(23,61,50,0.06)] flex flex-col min-h-[520px] h-[calc(100vh-220px)] max-h-[700px]">
                <div className="pb-3 border-b border-[#E4D7BF]">
                  <h3 className="font-display font-bold text-base text-[#173D32]">Gallery Assets ({gallery.length})</h3>
                  <p className="text-xs text-[#75685A] mt-0.5">Live photos featured in the public website ambience gallery section.</p>
                </div>

                <div className="overflow-y-auto flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 pr-1.5 scrollbar-thin content-start items-start">
                  {gallery.map((g, index) => (
                    <div 
                      key={index}
                      className="bg-white border border-[#E4D7BF] rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col"
                    >
                      <div className="relative aspect-[16/10] bg-[#F8EEDB] overflow-hidden">
                        <img 
                          src={g.image} 
                          alt={g.alt} 
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105" 
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1528605105345-5344ea20e269?auto=format&fit=crop&w=1200&q=80';
                          }}
                        />
                        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                          <span className="text-[11px] bg-[#173D32]/90 backdrop-blur-xs text-[#FFF9EF] px-2.5 py-0.5 rounded-full font-bold shadow-xs">
                            {g.tall ? 'Tall Bento' : 'Landscape (16:9)'}
                          </span>
                        </div>
                        <div className="absolute top-2.5 right-2.5">
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border shadow-xs ${
                            g.active !== false 
                              ? 'bg-emerald-600 text-white border-emerald-700' 
                              : 'bg-[#75685A] text-white border-[#30251E]'
                          }`}>
                            {g.active !== false ? 'Active' : 'Hidden'}
                          </span>
                        </div>
                      </div>

                      <div className="p-3 bg-white space-y-2 border-t border-[#E4D7BF]">
                        <div className="flex items-center justify-between gap-1.5">
                          <p className="text-xs font-bold text-[#30251E] truncate flex-1" title={g.alt}>
                            {g.alt || 'Ambience Photo'}
                          </p>
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-[11px] font-semibold text-[#75685A]">Sort:</span>
                            <input
                              type="number"
                              value={g.display_order ?? index}
                              onChange={(e) => handleUpdateGalleryOrder(index, Number(e.target.value))}
                              className="w-9 h-6 border border-[#E4D7BF] rounded text-xs text-center font-bold bg-[#F8EEDB] text-[#30251E] focus:outline-none focus:border-[#173D32]"
                            />
                            <button
                              type="button"
                              onClick={() => moveGalleryItem(index, 'up')}
                              disabled={index === 0}
                              className="p-0.5 rounded text-[#75685A] hover:text-[#173D32] disabled:opacity-20 disabled:pointer-events-none cursor-pointer"
                              title="Move Left"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveGalleryItem(index, 'down')}
                              disabled={index === gallery.length - 1}
                              className="p-0.5 rounded text-[#75685A] hover:text-[#173D32] disabled:opacity-20 disabled:pointer-events-none cursor-pointer"
                              title="Move Right"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Actions Row */}
                        <div className="flex items-center gap-1.5 pt-2 border-t border-[#E4D7BF]/60 text-xs">
                          <button
                            type="button"
                            onClick={() => handleUpdateGalleryActive(index, g.active === false, g.active === false ? 'shown' : 'hidden')}
                            className={`flex-1 h-7 px-2 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                              g.active !== false
                                ? 'bg-[#FFF9EF] hover:bg-[#F8EEDB] text-[#75685A] border-[#E4D7BF]'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                            }`}
                            title={g.active !== false ? 'Hide from public site' : 'Show on public site'}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${g.active !== false ? 'bg-emerald-600' : 'bg-[#75685A]'}`} />
                            <span>{g.active !== false ? 'Hide' : 'Show'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEditGalleryItem(index)}
                            className="flex-1 h-7 px-2 bg-[#FFF9EF] hover:bg-[#F8EEDB] text-[#173D32] border border-[#E4D7BF] rounded-lg text-xs font-bold transition-all cursor-pointer text-center"
                            title="Replace photo"
                          >
                            Replace
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteGalleryItem(index)}
                            className="h-7 w-7 text-[#A33C32] hover:bg-[#A33C32]/10 border border-[#A33C32]/25 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center shrink-0"
                            title="Delete photo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {gallery.length < 2 && (
                    <div className="border-2 border-dashed border-[#E4D7BF] rounded-2xl p-5 flex flex-col items-center justify-center text-center bg-[#F8EEDB]/30 h-full min-h-[220px]">
                      <div className="w-9 h-9 rounded-full bg-[#173D32]/10 flex items-center justify-center text-[#173D32] mb-2">
                        <ImageIcon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-[#30251E] block">Add More Ambience Photos</span>
                      <span className="text-[11px] text-[#75685A] max-w-[170px] mt-1 block leading-relaxed">
                        Upload dining room, bar, and outdoor terrace photos.
                      </span>
                    </div>
                  )}
                  {gallery.length === 0 && (
                    <div className="col-span-2 py-20 text-center text-xs text-[#75685A] italic">No gallery photos added yet.</div>
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
