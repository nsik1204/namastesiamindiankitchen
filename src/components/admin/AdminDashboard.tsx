import React, { useState, useMemo } from 'react';
import { Dish, Category, RestaurantInfo, AboutInfo, GalleryItem } from '../../types';
import { useAdminAuth } from '../../context/AdminAuthContext';

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
  onClose
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
      showToast('Name and Description are required parameters.', 'error');
      return;
    }
    if ((dishForm.priceTHB ?? 0) < 0) {
      showToast('Price cannot be a negative value.', 'error');
      return;
    }

    setIsSaving(true);
    await new Promise(r => setTimeout(r, 600));

    if (editingDish) {
      let updated = dishes.map(d => d.id === editingDish.id ? { ...d, ...dishForm } as Dish : d);
      if (dishForm.todaySpecial) {
        updated = updated.map(d => d.id === editingDish.id ? d : { ...d, todaySpecial: false });
      }
      onUpdateDishes(updated);
      showToast(`Dish "${dishForm.name}" updated successfully!`);
      setEditingDish(null);
    } else {
      const nextId = dishes.length > 0 ? Math.max(...dishes.map(d => d.id)) + 1 : 1;
      const nextOrder = dishes.length > 0 ? Math.max(...dishes.map(d => d.display_order || 0)) + 1 : 1;
      const newDish = {
        ...dishForm,
        id: nextId,
        display_order: dishForm.display_order || nextOrder,
        display_order_today: dishForm.display_order_today || nextOrder,
        display_order_chef: dishForm.display_order_chef || nextOrder,
        display_order_popular: dishForm.display_order_popular || nextOrder,
        display_order_favorite: dishForm.display_order_favorite || nextOrder
      } as Dish;
      let updated = [newDish, ...dishes];
      if (dishForm.todaySpecial) {
        updated = updated.map(d => d.id === nextId ? d : { ...d, todaySpecial: false });
      }
      onUpdateDishes(updated);
      showToast(`Dish "${dishForm.name}" added to menu successfully!`);
    }

    setIsSaving(false);
    handleCancelEditDish();
  };

  const handleDeleteDish = async (id: number, name: string) => {
    if (window.confirm(`WARNING: You are about to PERMANENTLY delete and purge "${name}" from the database.\n\nThis action is completely IRREVERSIBLE and cannot be undone.\n\n-> If you just want to take this item off the public website temporarily, click CANCEL and use "Soft Delete", "Hide", or "Disable" instead.\n\nAre you absolutely sure you want to PERMANENTLY purge this item?`)) {
      setIsSaving(true);
      await new Promise(r => setTimeout(r, 450));
      onUpdateDishes(dishes.filter(d => d.id !== id));
      setIsSaving(false);
      showToast(`Permanently deleted and purged "${name}".`, 'info');
    }
  };

  const handleAddIngredient = () => {
    if (ingredientInput.trim()) {
      const currentList = dishForm.ingredients || [];
      if (currentList.includes(ingredientInput.trim())) {
        showToast('Ingredient already listed.', 'info');
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

  // Live base64 image loaders & validator engines
  const handleFoodFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Maximum file size limit validation: 2 MB
    const maxSizeBytes = 2 * 1024 * 1024;
    const sizeInMB = file.size / (1024 * 1024);

    if (file.size > maxSizeBytes) {
      showToast(`Selected file is too large (${sizeInMB.toFixed(2)} MB). Maximum allowed size is 2 MB.`, 'error');
      return;
    }

    setUploadProgress(20);
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target?.result as string;
      setUploadProgress(60);

      // Inspect details & parameters in real time in background image object
      const tempImg = new Image();
      tempImg.onload = () => {
        // Recommended resolution check: 1200x1200 px
        const isDimOk = tempImg.width === 1200 && tempImg.height === 1200;
        setFoodImgValidation({
          width: tempImg.width,
          height: tempImg.height,
          sizeMB: sizeInMB.toFixed(2),
          isCorrectSize: true,
          isCorrectDimensions: isDimOk
        });

        setDishForm(curr => ({ ...curr, image: base64Data }));
        setUploadProgress(100);
        setTimeout(() => setUploadProgress(null), 300);
        
        if (isDimOk) {
          showToast('Cover photo loaded. Meets recommended 1200x1200px specs!');
        } else {
          showToast(`Cover photo loaded. (Recommended is 1200x1200px. Yours is ${tempImg.width}x${tempImg.height}px)`, 'info');
        }
      };
      tempImg.onerror = () => {
        showToast('Standard image verification failed. Unrecognized format.', 'error');
        setUploadProgress(null);
      };
      tempImg.src = base64Data;
    };
    reader.readAsDataURL(file);
  };

  const handleGalleryFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Maximum file size limit validation: 2 MB
    const maxSizeBytes = 2 * 1024 * 1024;
    const sizeInMB = file.size / (1024 * 1024);

    if (file.size > maxSizeBytes) {
      showToast(`Selected file is too large (${sizeInMB.toFixed(2)} MB). Maximum allowed size is 2 MB.`, 'error');
      return;
    }

    setUploadProgress(20);
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target?.result as string;
      setUploadProgress(60);

      const tempImg = new Image();
      tempImg.onload = () => {
        // Recommended resolution check: 1600x900 px
        const isDimOk = tempImg.width === 1600 && tempImg.height === 900;
        setGalleryImgValidation({
          width: tempImg.width,
          height: tempImg.height,
          sizeMB: sizeInMB.toFixed(2),
          isCorrectSize: true,
          isCorrectDimensions: isDimOk
        });

        setGalleryForm(curr => ({ ...curr, image: base64Data }));
        setUploadProgress(100);
        setTimeout(() => setUploadProgress(null), 300);

        if (isDimOk) {
          showToast('Gallery photo loaded. Meets recommended 1600x900px aspect ratio!');
        } else {
          showToast(`Gallery photo loaded. (Recommended is 1600x900px. Yours is ${tempImg.width}x${tempImg.height}px)`, 'info');
        }
      };
      tempImg.onerror = () => {
        showToast('Failed to check image file properties.', 'error');
        setUploadProgress(null);
      };
      tempImg.src = base64Data;
    };
    reader.readAsDataURL(file);
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
    showToast('Gallery item sort order updated successfully!');
  };

  const handleUpdateDishActive = (dishId: number, active: boolean, actionType: string) => {
    const updated = dishes.map(d => {
      if (d.id === dishId) {
        return { ...d, active };
      }
      return d;
    });
    onUpdateDishes(updated);
    
    let label = 'updated';
    if (actionType === 'hidden') label = 'hidden from public view';
    if (actionType === 'disabled') label = 'disabled successfully';
    if (actionType === 'soft_deleted') label = 'soft deleted (marked inactive)';
    if (actionType === 'shown') label = 'revealed to public website';
    if (actionType === 'enabled') label = 'enabled and active';
    if (actionType === 'restored') label = 'restored back to active status';

    showToast(`Dish was successfully ${label}!`);
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
    if (actionType === 'hidden') label = 'hidden from public view';
    if (actionType === 'disabled') label = 'disabled successfully';
    if (actionType === 'soft_deleted') label = 'soft deleted (marked inactive)';
    if (actionType === 'shown') label = 'revealed to public website';
    if (actionType === 'enabled') label = 'enabled and active';
    if (actionType === 'restored') label = 'restored back to active status';

    showToast(`Category tab was successfully ${label}!`);
  };

  const handleUpdateGalleryActive = (index: number, active: boolean, actionType: string) => {
    const updated = [...gallery];
    updated[index] = { ...updated[index], active };
    onUpdateGallery(updated);

    let label = 'updated';
    if (actionType === 'hidden') label = 'hidden from public view';
    if (actionType === 'disabled') label = 'disabled successfully';
    if (actionType === 'soft_deleted') label = 'soft deleted';
    if (actionType === 'shown') label = 'restored to carousel';
    if (actionType === 'enabled') label = 'enabled successfully';
    if (actionType === 'restored') label = 'restored back to active status';

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
      showToast('Please provide both singular Category Code ID and Name.', 'error');
      return;
    }

    if (categories.some(c => c.id === cleanId)) {
      showToast('Category Code ID already exists.', 'error');
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
    showToast(`Added system category tab: "${label}"`);
  };

  const handleDeleteCategory = (id: string, label: string) => {
    if (id === 'all') {
      showToast('Standard primary "All" filters category cannot be deleted.', 'error');
      return;
    }

    const attachedDishesCount = dishes.filter(d => d.category === id).length;
    let warningMsg = '';
    if (attachedDishesCount > 0) {
      warningMsg = `WARNING: Category "${label}" has ${attachedDishesCount} linked cuisines. Deleting this key will leave those catalog items category-orphaned.\n\n`;
    }

    if (!window.confirm(`${warningMsg}WARNING: You are about to PERMANENTLY delete and purge the Category "${label}".\n\nThis action is completely IRREVERSIBLE and cannot be undone.\n\n-> If you just want to temporarily hide this category from the website tabs, click CANCEL and use "Soft Delete", "Hide", or "Disable" instead.\n\nAre you absolutely sure you want to PERMANENTLY purge this category?`)) {
      return;
    }

    onUpdateCategories(categories.filter(c => c.id !== id));
    showToast(`Permanently deleted and purged category "${label}".`, 'info');
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
    await new Promise(r => setTimeout(r, 800));

    // Dynamic processing of about story from lines
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
    showToast('Restaurant information story details saved!');
  };

  const handleAddHighlight = () => {
    if (highlightInput.trim()) {
      if (aboutForm.highlights.includes(highlightInput.trim())) {
        showToast('Highlight bullet already registered.', 'info');
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
    await new Promise(r => setTimeout(r, 600));

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
      showToast('Image link URL and alternate description are required.', 'error');
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
      showToast('New Ambience picture added to gallery!');
    }

    setGalleryForm({
      image: 'https://images.unsplash.com/photo-1528605105345-5344ea20e269?auto=format&fit=crop&w=1200&q=80',
      alt: '',
      tall: false
    });
    setGalleryImgValidation(null);
  };

  const handleDeleteGalleryItem = (index: number) => {
    if (window.confirm('WARNING: You are about to PERMANENTLY delete and purge this photo from the public collection.\n\nThis action is completely IRREVERSIBLE and cannot be undone.\n\n-> If you just want to temporarily hide this photo from the gallery, click CANCEL and use the "Hide", "Disable", or "Soft Delete" buttons instead.\n\nAre you absolutely sure you want to PERMANENTLY purge this image?')) {
      const updated = gallery.filter((_, i) => i !== index);
      onUpdateGallery(updated);
      showToast('Permanently deleted and purged gallery image.', 'info');
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
    showToast('Promotion state toggled instantly.');
  };

  return (
    <div className="min-h-screen bg-[#FFFDFB] text-[#1A0F00] font-sans antialiased flex flex-col">
      
      {/* Toast Alert Banner */}
      {toast && (
        <div 
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
            toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 
            toast.type === 'info' ? 'bg-blue-50 border-blue-200 text-blue-700' :
            'bg-orange-50 border-orange-200 text-orange-800'
          }`}
        >
          <span>{toast.type === 'error' ? '⚠️' : toast.type === 'info' ? 'ℹ️' : '✨'}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* FIXED HEADER NAVBAR */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-orange-500/10 z-30 px-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-xl">🛠️</span>
          <div>
            <h1 className="font-bold text-gray-900 text-sm md:text-base tracking-tight">{restaurantInfo.name}</h1>
            <p className="text-[10px] font-semibold text-orange-600 uppercase font-mono tracking-wider">Control Console • Super Admin Mode</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {isSaving && (
            <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded font-mono animate-pulse">
              ⏱ Saving database state...
            </span>
          )}
          <button 
            type="button"
            onClick={onClose}
            className="text-xs bg-orange-600 hover:bg-orange-700 text-white font-bold py-1.5 px-3 rounded-lg transition-colors shadow-sm"
          >
            ← Public Site
          </button>
          <button 
            type="button"
            onClick={logout}
            className="text-xs text-gray-500 hover:text-red-600 font-semibold transition-colors px-2 py-1.5"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* DASHBOARD CONTENT BODY */}
      <div className="flex-1 pt-16 flex flex-col md:flex-row">
        
        {/* Left Side Tab Navigator Panel */}
        <aside className="w-full md:w-64 bg-white border-r border-orange-500/5 p-4 space-y-1 block md:sticky md:top-16 md:h-[calc(100vh-64px)] overflow-y-auto">
          <div className="text-[11px] font-bold text-[#7A5C3E] uppercase tracking-widest px-3 py-2 mb-1 font-mono">Consoles</div>
          
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${activeTab === 'overview' ? 'bg-orange-600 text-white shadow-sm' : 'hover:bg-orange-50/40 text-gray-700'}`}
          >
            📊 Command Overview
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('dishes')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${activeTab === 'dishes' ? 'bg-orange-600 text-white shadow-sm' : 'hover:bg-orange-50/40 text-gray-700'}`}
          >
            🍽️ Cuisine Catalog
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('categories')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${activeTab === 'categories' ? 'bg-orange-600 text-white shadow-sm' : 'hover:bg-orange-50/40 text-gray-700'}`}
          >
            🏷️ Menu Categories
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('restaurant')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${activeTab === 'restaurant' ? 'bg-orange-600 text-white shadow-sm' : 'hover:bg-orange-50/40 text-gray-700'}`}
          >
            📢 Brand Profile & Story
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${activeTab === 'chat' ? 'bg-orange-600 text-white shadow-sm' : 'hover:bg-orange-50/40 text-gray-700'}`}
          >
            💬 WhatsApp & LINE Setup
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('gallery')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${activeTab === 'gallery' ? 'bg-orange-600 text-white shadow-sm' : 'hover:bg-orange-50/40 text-gray-700'}`}
          >
            🖼️ Ambience Gallery
          </button>

          <div className="border-t border-gray-100 my-4 pt-4 px-3">
            <div className="bg-[#FFF8F0] p-3 rounded-lg border border-orange-500/10 space-y-1">
              <span className="text-[10px] font-bold text-orange-800 uppercase tracking-widest font-mono">Live Session</span>
              <span className="block text-[11px] text-[#7A5C3E] truncate">Role: Administrator</span>
              <span className="block text-[11px] text-[#7A5C3E]">Status: Active 🟢</span>
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
                <div className="bg-white p-5 rounded-2xl border border-orange-500/10 shadow-sm space-y-1">
                  <span className="text-xs text-[#7A5C3E] font-medium block">Total Cuisine Items</span>
                  <div className="text-3xl font-extrabold text-gray-900 font-mono">{stats.totalDishes}</div>
                  <span className="text-[10px] text-gray-500 block uppercase tracking-wider font-mono">{stats.subVeg} Veg • {stats.subNonVeg} NonVeg</span>
                </div>
                
                <div className="bg-white p-5 rounded-2xl border border-orange-500/10 shadow-sm space-y-1">
                  <span className="text-xs text-[#7A5C3E] font-medium block">Menu Category Columns</span>
                  <div className="text-3xl font-extrabold text-gray-900 font-mono">{stats.totalCats}</div>
                  <span className="text-[10px] text-gray-500 block uppercase tracking-wider font-mono">Active Filter Tabs</span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-orange-500/10 shadow-sm space-y-1">
                  <span className="text-xs text-[#7A5C3E] font-medium block">Today's Promotion</span>
                  <div className="text-3xl font-extrabold text-orange-600 font-mono">
                    {stats.todaysSpecialsCount > 0 ? 'LIVE' : 'OFF'}
                  </div>
                  <span className="text-[10px] text-gray-600 block truncate">{stats.todaysSpecialsCount} items featured</span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-orange-500/10 shadow-sm space-y-1">
                  <span className="text-xs text-[#7A5C3E] font-medium block">Ambience Photo Assets</span>
                  <div className="text-3xl font-extrabold text-gray-900 font-mono">{gallery.length}</div>
                  <span className="text-[10px] text-gray-500 block">High-res CDN images</span>
                </div>
              </div>

              {/* Special Promoters Board quick control switches */}
              <div className="bg-white rounded-2xl border border-orange-500/10 shadow-sm p-6 space-y-4">
                <div>
                  <h3 className="text-lg font-bold">📢 Fast Promotion Manager</h3>
                  <p className="text-xs text-gray-500 mt-1">Manage active listings inside customer's target highlights segments (Today's Specials, Chef's choices, Bestsellers, customer favorites).</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#FFF8F0] border-b border-orange-500/10 text-orange-800 font-bold uppercase tracking-wider font-mono">
                        <th className="py-2.5 px-3">Cuisine Title</th>
                        <th className="py-2.5 px-3 text-center">⭐ Today's Special</th>
                        <th className="py-2.5 px-3 text-center">👨‍🍳 Chef Choice</th>
                        <th className="py-2.5 px-3 text-center">🔥 Bestseller</th>
                        <th className="py-2.5 px-3 text-center">💖 Favorite</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {dishes.slice(0, 10).map(dish => (
                        <tr key={dish.id} className="hover:bg-[#FFFDFB]">
                          <td className="py-2.5 px-3 font-semibold text-gray-800 truncate max-w-[170px]">
                            {dish.name}
                            <span className="block text-[10px] text-orange-600/70 font-bold uppercase">{dish.category}</span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleTogglePromoOnDish(dish.id, 'todaySpecial')}
                              className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-transform ${dish.todaySpecial ? 'bg-amber-400 text-amber-950 font-black' : 'bg-gray-100 text-gray-400'}`}
                            >
                              {dish.todaySpecial ? 'Active' : 'Enable'}
                            </button>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleTogglePromoOnDish(dish.id, 'chefSpecial')}
                              className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-transform ${dish.chefSpecial ? 'bg-rose-500 text-white font-black' : 'bg-gray-100 text-gray-400'}`}
                            >
                              {dish.chefSpecial ? 'Active' : 'Enable'}
                            </button>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleTogglePromoOnDish(dish.id, 'bestseller')}
                              className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-transform ${dish.bestseller ? 'bg-orange-600 text-white font-black' : 'bg-gray-100 text-gray-400'}`}
                            >
                              {dish.bestseller ? 'Active' : 'Enable'}
                            </button>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleTogglePromoOnDish(dish.id, 'customerFavorite')}
                              className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-transform ${dish.customerFavorite ? 'bg-purple-600 text-white font-black' : 'bg-gray-100 text-gray-400'}`}
                            >
                              {dish.customerFavorite ? 'Active' : 'Enable'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {dishes.length > 10 && (
                    <div className="text-center pt-3 text-[11px] text-gray-400 font-mono italic">
                      Listing first 10 cuisines for performance efficiency. Manage complete catalog lists under the "Cuisine Catalog" console.
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
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* CUISINE DISH FORM COMPILER PANEL (LEFT/TOP SIDE 5 COLS) */}
              <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-orange-500/10 shadow-sm space-y-4">
                <div>
                  <h3 className="font-bold text-base text-[#1A0F00]">
                    {editingDish ? '📝 Edit Cuisine specs' : '✨ Cook New Entry'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">Configure full nutritional variables, promoters, price, and cover image metadata.</p>
                </div>

                <form onSubmit={handleSaveDishSubmit} className="space-y-4 text-xs font-medium text-[#3D1F00]">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Cuisine Name</label>
                    <input
                      type="text"
                      value={dishForm.name}
                      onChange={(e) => setDishForm({ ...dishForm, name: e.target.value })}
                      placeholder="Butter Chicken..."
                      className="w-full border border-gray-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-orange-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Description</label>
                    <textarea
                      value={dishForm.description}
                      onChange={(e) => setDishForm({ ...dishForm, description: e.target.value })}
                      placeholder="Rich, creamy tomato curry sauce with butter..."
                      className="w-full border border-gray-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-orange-500"
                      rows={2}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Price (THB)</label>
                      <input
                        type="number"
                        value={dishForm.priceTHB}
                        onChange={(e) => setDishForm({ ...dishForm, priceTHB: Number(e.target.value) })}
                        placeholder="299"
                        className="w-full border border-gray-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-orange-500 font-mono"
                        min={0}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Menu Category</label>
                      <select
                        value={dishForm.category}
                        onChange={(e) => setDishForm({ ...dishForm, category: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg p-2.5 text-xs bg-white focus:outline-none focus:border-orange-500"
                      >
                        {categories.filter(c => c.id !== 'all').map(c => (
                          <option key={c.id} value={c.id}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Diet Classification</label>
                      <select
                        value={dishForm.type}
                        onChange={(e) => setDishForm({ ...dishForm, type: e.target.value as 'veg' | 'nonveg' })}
                        className="w-full border border-gray-200 rounded-lg p-2.5 text-xs bg-white focus:outline-none focus:border-orange-500"
                      >
                        <option value="veg">🟢 Veg</option>
                        <option value="nonveg">🔴 Non-Veg</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Spice Index</label>
                      <input
                        type="text"
                        value={dishForm.spiceLevel}
                        onChange={(e) => setDishForm({ ...dishForm, spiceLevel: e.target.value })}
                        placeholder="🌶🌶 Spicy"
                        className="w-full border border-gray-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Base Order</label>
                      <input
                        type="number"
                        value={dishForm.display_order ?? 0}
                        onChange={(e) => setDishForm({ ...dishForm, display_order: Number(e.target.value) })}
                        placeholder="0"
                        className="w-full border border-gray-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-orange-500 font-mono"
                      />
                    </div>
                  </div>

                  {/* Real food image upload controls with size and recommended resolution checkers */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Cuisine Picture Cover</label>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1.5 pb-1">
                        <span className="bg-orange-50 text-orange-950 text-[10px] px-2.5 py-1 rounded-full font-bold border border-orange-200/40">
                          Recommended: 1200 × 1200 px
                        </span>
                        <span className="bg-gray-50 text-gray-600 text-[10px] px-2.5 py-1 rounded-full font-bold border border-gray-200/40">
                          Maximum: 2 MB
                        </span>
                      </div>

                      <input
                        type="text"
                        value={dishForm.image || ''}
                        onChange={(e) => setDishForm({ ...dishForm, image: e.target.value })}
                        placeholder="Or hand-paste direct picture URL link..."
                        className="w-full border border-gray-200 rounded-lg p-2.5 text-[11px] focus:outline-none focus:border-orange-500 font-mono"
                      />

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
                        className="w-full text-center border-dashed border-orange-500/30 border bg-[#FFFDFB] text-xs text-orange-900 font-extrabold py-3 rounded-lg hover:bg-orange-50/50 transition-all flex items-center justify-center gap-2"
                        disabled={uploadProgress !== null}
                      >
                        📂 {uploadProgress !== null ? 'Loading & verifying...' : 'Browse photo from device'}
                      </button>

                      {/* Real-time dimension and specs visual feedback */}
                      {foodImgValidation && (
                        <div className="bg-amber-50/20 border border-amber-500/10 p-2.5 rounded-xl space-y-1 text-[11px] text-[#5C3E1F]">
                          <div className="flex justify-between items-center">
                            <span>File details: <strong>{foodImgValidation.sizeMB} MB</strong></span>
                            <span>Resolution: <strong>{foodImgValidation.width} × {foodImgValidation.height} px</strong></span>
                          </div>
                          <div className={`font-bold flex items-center gap-1 ${foodImgValidation.isCorrectDimensions ? 'text-green-700' : 'text-amber-700'}`}>
                            {foodImgValidation.isCorrectDimensions ? (
                              <span>✓ Matches the 1200×1200 px recommendation exactly!</span>
                            ) : (
                              <span>⚠️ Note: recommended is 1200×1200 px. Yours is {foodImgValidation.width}×{foodImgValidation.height} px.</span>
                            )}
                          </div>
                        </div>
                      )}

                      {dishForm.image && (
                        <div className="border border-orange-500/10 p-2 rounded-xl bg-[#FFFDFB] space-y-1.5 flex flex-col items-center">
                          <span className="block text-[10px] text-gray-400 font-mono uppercase tracking-wider font-bold">Preview selection</span>
                          <div className="overflow-hidden rounded-lg bg-gray-50 aspect-square w-32 border shadow-sm">
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
                  <div className="bg-[#FFF8F0] border border-orange-500/10 p-3 rounded-xl space-y-2">
                    <span className="block text-[10px] font-bold text-[#7A5C3E] uppercase tracking-widest font-mono">Promotional Placements</span>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <label className="flex items-center gap-2 cursor-pointer outline-none">
                        <input
                          type="checkbox"
                          checked={dishForm.todaySpecial}
                          onChange={(e) => setDishForm({ ...dishForm, todaySpecial: e.target.checked })}
                          className="rounded border-orange-500/25 text-orange-500 focus:ring-0"
                        />
                        <span>⭐ Special</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer outline-none">
                        <input
                          type="checkbox"
                          checked={dishForm.chefSpecial}
                          onChange={(e) => setDishForm({ ...dishForm, chefSpecial: e.target.checked })}
                          className="rounded border-orange-500/25 text-orange-500 focus:ring-0"
                        />
                        <span>👨‍🍳 Chef's Choice</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer outline-none">
                        <input
                          type="checkbox"
                          checked={dishForm.bestseller}
                          onChange={(e) => setDishForm({ ...dishForm, bestseller: e.target.checked })}
                          className="rounded border-orange-500/25 text-orange-500 focus:ring-0"
                        />
                        <span>🔥 Bestseller</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer outline-none">
                        <input
                          type="checkbox"
                          checked={dishForm.customerFavorite}
                          onChange={(e) => setDishForm({ ...dishForm, customerFavorite: e.target.checked })}
                          className="rounded border-orange-500/25 text-orange-500 focus:ring-0"
                        />
                        <span>💖 Favorite</span>
                      </label>
                    </div>
                  </div>

                  {/* Interactive Ingredients builder */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-gray-700 uppercase">Ingredients Components ({dishForm.ingredients?.length || 0})</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={ingredientInput}
                        onChange={(e) => setIngredientInput(e.target.value)}
                        placeholder="Add tag (e.g. Garlic)..."
                        className="flex-1 border border-gray-200 rounded-lg p-2 text-xs focus:outline-none focus:border-orange-500"
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
                        className="bg-[#3D1F00] text-white px-3 font-semibold rounded-lg hover:bg-black transition-colors"
                      >
                        Add
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1 max-h-[85px] overflow-y-auto pt-1">
                      {dishForm.ingredients?.map((ing, idx) => (
                        <span 
                          key={idx}
                          onClick={() => handleRemoveIngredient(idx)}
                          className="text-[10px] bg-orange-50 border border-orange-2550/10 text-orange-900 px-2 py-0.5 rounded-full cursor-pointer hover:bg-red-50 hover:text-red-700 hover:border-red-200 flex items-center gap-1 transition-colors"
                          title="Click to remove"
                        >
                          {ing} <span className="opacity-60">✕</span>
                        </span>
                      ))}
                      {(!dishForm.ingredients || dishForm.ingredients.length === 0) && (
                        <div className="text-[10px] text-gray-400 font-mono italic">No ingredients listed yet.</div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors shadow-sm"
                    >
                      {editingDish ? '🔒 Save Cuisines changes' : '✨ Post Cuisine'}
                    </button>
                    {editingDish && (
                      <button
                        type="button"
                        onClick={handleCancelEditDish}
                        className="bg-gray-150 hover:bg-gray-200 text-gray-700 px-4 rounded-xl text-xs"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* CUISINE DISHS GRID LISTING PANEL (RIGHT SIDE 7 COLS) */}
              <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-orange-500/10 shadow-sm flex flex-col h-[700px]">
                <div className="flex items-center justify-between pb-4">
                  <div>
                    <h3 className="font-bold text-base">Menu Grid ({dishes.length})</h3>
                    <p className="text-xs text-gray-500">List of all active dishes and culinary items.</p>
                  </div>
                </div>

                <div className="overflow-y-auto flex-1 space-y-3 pr-2 scrollbar-thin">
                  {dishes.map(dish => (
                    <div 
                      key={dish.id} 
                      className={`flex gap-3 bg-gray-50/40 p-3 rounded-xl border transition-all ${editingDish?.id === dish.id ? 'border-orange-500 bg-orange-50/10' : 'border-gray-100 hover:border-orange-500/15'}`}
                    >
                      <img 
                        src={dish.image} 
                        alt={dish.name} 
                        className="w-16 h-16 object-cover rounded-lg flex-shrink-0 border bg-white"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1000&q=80';
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1.5">
                          <h4 className="font-extrabold text-xs text-gray-900 truncate">{dish.name}</h4>
                          <span className="font-bold text-orange-600 text-xs font-mono shrink-0">฿{dish.priceTHB}</span>
                        </div>
                        <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5">{dish.description}</p>
                        
                        <div className="flex flex-wrap gap-1 mt-2">
                          <span className="text-[9px] bg-[#FFF8F0] border border-orange-500/10 text-[#7A5C3E] px-1.5 py-0.5 rounded uppercase font-bold">
                            {dish.category}
                          </span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${dish.type==='veg' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                            {dish.type==='veg' ? 'Veg' : 'Non-Veg'}
                          </span>
                          {dish.todaySpecial && <span className="text-[9px] bg-amber-105 text-amber-800 px-1 py-0.5 rounded">⭐ Spec</span>}
                          {dish.chefSpecial && <span className="text-[9px] bg-red-105 text-red-800 px-1 py-0.5 rounded">👨‍🍳 Chef</span>}
                          {dish.bestseller && <span className="text-[9px] bg-orange-105 text-orange-900 px-1 py-0.5 rounded font-bold">🔥 Best</span>}
                          {dish.customerFavorite && <span className="text-[9px] bg-purple-105 text-purple-800 px-1 py-0.5 rounded">💖 Fav</span>}
                        </div>

                        {/* Direct Display Order Numeric Control Inputs Panel */}
                        <div className="flex flex-wrap gap-x-2 gap-y-1 items-center mt-2.5 pt-2 border-t border-gray-100">
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] text-[#7A5C3E] font-bold font-mono">Order:</span>
                            <input
                              type="number"
                              value={dish.display_order ?? 0}
                              onChange={(e) => handleUpdateDishOrderField(dish.id, 'display_order', Number(e.target.value))}
                              className="w-10 border border-gray-200 rounded px-1 py-0.5 text-[9px] text-center font-mono font-bold bg-white focus:outline-none focus:border-orange-500"
                            />
                          </div>

                          {dish.todaySpecial && (
                            <div className="flex items-center gap-1">
                              <span className="text-[9px] text-amber-700 font-bold font-mono">Spec:</span>
                              <input
                                type="number"
                                value={dish.display_order_today ?? 0}
                                onChange={(e) => handleUpdateDishOrderField(dish.id, 'display_order_today', Number(e.target.value))}
                                className="w-10 border border-gray-200 rounded px-1 py-0.5 text-[9px] text-center font-mono font-bold bg-white focus:outline-none focus:border-orange-500"
                              />
                            </div>
                          )}

                          {dish.chefSpecial && (
                            <div className="flex items-center gap-1">
                              <span className="text-[9px] text-red-700 font-bold font-mono">Chef:</span>
                              <input
                                type="number"
                                value={dish.display_order_chef ?? 0}
                                onChange={(e) => handleUpdateDishOrderField(dish.id, 'display_order_chef', Number(e.target.value))}
                                className="w-10 border border-gray-200 rounded px-1 py-0.5 text-[9px] text-center font-mono font-bold bg-white focus:outline-none focus:border-orange-500"
                              />
                            </div>
                          )}

                          {dish.bestseller && (
                            <div className="flex items-center gap-1">
                              <span className="text-[9px] text-orange-700 font-bold font-mono">Best:</span>
                              <input
                                type="number"
                                value={dish.display_order_popular ?? 0}
                                onChange={(e) => handleUpdateDishOrderField(dish.id, 'display_order_popular', Number(e.target.value))}
                                className="w-10 border border-gray-200 rounded px-1 py-0.5 text-[9px] text-center font-mono font-bold bg-white focus:outline-none focus:border-orange-500"
                              />
                            </div>
                          )}

                          {dish.customerFavorite && (
                            <div className="flex items-center gap-1">
                              <span className="text-[9px] text-purple-700 font-bold font-mono">Fav:</span>
                              <input
                                type="number"
                                value={dish.display_order_favorite ?? 0}
                                onChange={(e) => handleUpdateDishOrderField(dish.id, 'display_order_favorite', Number(e.target.value))}
                                className="w-10 border border-gray-200 rounded px-1 py-0.5 text-[9px] text-center font-mono font-bold bg-white focus:outline-none focus:border-orange-500"
                              />
                            </div>
                          )}
                        </div>

                        {/* Status & Visibility Control Action Panel */}
                        <div className="flex flex-wrap gap-1.5 items-center mt-2 pt-2 border-t border-gray-100">
                          <span className="text-[9px] text-[#7A5C3E] font-bold">Status:</span>
                          <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase font-mono ${dish.active !== false ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                            {dish.active !== false ? 'Active & Visible' : 'Inactive'}
                          </span>
                          
                          {dish.active !== false ? (
                            <div className="flex gap-1 flex-wrap">
                              <button
                                type="button"
                                onClick={() => handleUpdateDishActive(dish.id, false, 'hidden')}
                                className="bg-yellow-50 hover:bg-yellow-100 text-yellow-800 text-[8px] font-bold px-1.5 py-0.5 rounded border border-yellow-200 transition-all font-mono"
                                title="Hide this dish"
                              >
                                Hide
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateDishActive(dish.id, false, 'disabled')}
                                className="bg-orange-50 hover:bg-orange-100 text-orange-850 text-[8px] font-bold px-1.5 py-0.5 rounded border border-orange-200 transition-all font-mono"
                                title="Disable this dish"
                              >
                                Disable
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateDishActive(dish.id, false, 'soft_deleted')}
                                className="bg-red-50 hover:bg-red-100 text-red-700 text-[8px] font-bold px-1.5 py-0.5 rounded border border-red-200 transition-all font-mono"
                                title="Soft Delete this dish"
                              >
                                Soft Delete
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-1 flex-wrap">
                              <button
                                type="button"
                                onClick={() => handleUpdateDishActive(dish.id, true, 'shown')}
                                className="bg-blue-50 hover:bg-blue-100 text-blue-700 text-[8px] font-bold px-1.5 py-0.5 rounded border border-blue-200 transition-all font-mono"
                                title="Show this dish"
                              >
                                Show
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateDishActive(dish.id, true, 'enabled')}
                                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[8px] font-bold px-1.5 py-0.5 rounded border border-emerald-200 transition-all font-mono"
                                title="Enable this dish"
                              >
                                Enable
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateDishActive(dish.id, true, 'restored')}
                                className="bg-purple-50 hover:bg-purple-100 text-purple-700 text-[8px] font-bold px-1.5 py-0.5 rounded border border-purple-200 transition-all font-mono"
                                title="Restore this dish"
                              >
                                Restore
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-1.5 justify-center shrink-0 pl-1">
                        <button
                          type="button"
                          onClick={() => handleEditDish(dish)}
                          className="bg-orange-50 hover:bg-orange-100 text-orange-700 text-[10px] font-bold py-1 px-2.5 rounded-lg transition-colors border border-orange-100"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDish(dish.id, dish.name)}
                          className="bg-red-50 hover:bg-red-100 text-red-700 text-[10px] font-bold py-1 px-2.5 rounded-lg transition-colors border border-red-100"
                        >
                          Purge
                        </button>
                      </div>
                    </div>
                  ))}
                  {dishes.length === 0 && (
                    <div className="py-20 text-center text-xs text-gray-400 font-mono italic">No cuisines available. Create some menu items first!</div>
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
              
              <div className="bg-white p-6 rounded-2xl border border-orange-500/10 shadow-sm space-y-4">
                <div>
                  <h3 className="font-bold text-base">Create Menu Category Tab</h3>
                  <p className="text-xs text-gray-500 mt-1">Configure active filter categories columns. Uniquely tag cuisine filters accurately.</p>
                </div>

                <form onSubmit={handleAddCategory} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Unique Code ID (Slug)</label>
                    <input
                      type="text"
                      value={newCatId}
                      onChange={(e) => setNewCatId(e.target.value)}
                      placeholder="e.g. punjabi-special"
                      className="w-full border border-gray-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-orange-500 font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Display Label</label>
                    <input
                      type="text"
                      value={newCatLabel}
                      onChange={(e) => setNewCatLabel(e.target.value)}
                      placeholder="e.g. Punjabi Specials"
                      className="w-full border border-gray-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-orange-500"
                      required
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full bg-[#3D1F00] hover:bg-black text-white font-bold py-2.5 rounded-lg text-xs transition-colors shadow-sm"
                    >
                      + Create Category
                    </button>
                  </div>
                </form>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-orange-500/10 shadow-sm space-y-4">
                <div>
                  <h3 className="font-bold text-base">Active Categories Tabs Register</h3>
                  <p className="text-xs text-gray-500 mt-1">Manage, sort, and clean categories registry records.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {categories.map(cat => {
                    const count = dishes.filter(d => d.category === cat.id).length;
                    return (
                      <div 
                        key={cat.id} 
                        className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 flex flex-col justify-between gap-3 hover:border-orange-500/10 transition-all"
                      >
                        <div className="flex justify-between items-start w-full">
                          <div>
                            <h4 className="font-bold text-xs text-gray-900">{cat.label}</h4>
                            <span className="text-[10px] text-orange-600 block font-mono">ID: {cat.id}</span>
                            <span className="text-[10px] text-gray-400 block font-mono font-medium">{count} cuisines linked</span>
                            <div className="mt-1 flex items-center gap-1.5">
                              <span className="text-[10px] text-[#7A5C3E] font-bold font-mono">Order:</span>
                              <input
                                type="number"
                                value={cat.display_order ?? 0}
                                onChange={(e) => handleUpdateCategoryOrder(cat.id, Number(e.target.value))}
                                className="w-12 border border-orange-500/15 rounded px-1.5 py-0.5 text-[10px] text-center font-mono font-bold bg-white focus:outline-none focus:border-orange-500/50"
                              />
                            </div>
                          </div>

                          <div className="flex flex-col gap-1 items-end shrink-0">
                            {cat.id !== 'all' && (
                              <button
                                type="button"
                                onClick={() => handleDeleteCategory(cat.id, cat.label)}
                                className="text-[10px] text-red-600 hover:text-red-800 font-bold bg-red-50 hover:bg-red-100 border border-red-200/50 rounded-lg px-2.5 py-1 transition-all"
                              >
                                Purge
                              </button>
                            )}
                            {cat.id === 'all' && (
                              <span className="text-[9px] bg-gray-100 text-gray-400 font-mono font-bold px-2 py-1 rounded">Primary</span>
                            )}
                          </div>
                        </div>

                        {/* Category Visibility Control Action Box */}
                        <div className="mt-2 pt-2 border-t border-gray-200/50 flex flex-col gap-1.5">
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] text-gray-500 font-bold font-mono">Status:</span>
                            <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase font-mono ${cat.active !== false ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                              {cat.active !== false ? 'Active & Visible' : 'Inactive'}
                            </span>
                          </div>
                          
                          {cat.id !== 'all' && (
                            <div className="flex flex-wrap gap-1">
                              {cat.active !== false ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateCategoryActive(cat.id, false, 'hidden')}
                                    className="bg-yellow-50 hover:bg-yellow-101 text-yellow-805 text-[8px] font-bold px-1.5 py-0.5 rounded border border-yellow-250 transition-all font-mono"
                                    title="Hide this category"
                                  >
                                    Hide
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateCategoryActive(cat.id, false, 'disabled')}
                                    className="bg-orange-50 hover:bg-orange-101 text-orange-855 text-[8px] font-bold px-1.5 py-0.5 rounded border border-orange-255 transition-all font-mono"
                                    title="Disable this category"
                                  >
                                    Disable
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateCategoryActive(cat.id, false, 'soft_deleted')}
                                    className="bg-red-50 hover:bg-red-101 text-red-705 text-[8px] font-bold px-1.5 py-0.5 rounded border border-red-255 transition-all font-mono"
                                    title="Soft Delete this category"
                                  >
                                    Soft Delete
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateCategoryActive(cat.id, true, 'shown')}
                                    className="bg-blue-50 hover:bg-blue-101 text-blue-705 text-[8px] font-bold px-1.5 py-0.5 rounded border border-blue-255 transition-all font-mono"
                                    title="Show this category"
                                  >
                                    Show
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateCategoryActive(cat.id, true, 'enabled')}
                                    className="bg-emerald-50 hover:bg-emerald-101 text-emerald-805 text-[8px] font-bold px-1.5 py-0.5 rounded border border-emerald-255 transition-all font-mono"
                                    title="Enable this category"
                                  >
                                    Enable
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateCategoryActive(cat.id, true, 'restored')}
                                    className="bg-purple-50 hover:bg-purple-101 text-purple-705 text-[8px] font-bold px-1.5 py-0.5 rounded border border-purple-255 transition-all font-mono"
                                    title="Restore this category"
                                  >
                                    Restore
                                  </button>
                                </>
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
            <div className="bg-white p-6 rounded-2xl border border-orange-500/10 shadow-sm space-y-6">
              <div>
                <h3 className="font-bold text-base">📢 Brand Profile and Heritage story editor</h3>
                <p className="text-xs text-gray-500 mt-1">Modify hours, physical coordinates, and general social linkages visible to public customers.</p>
              </div>

              <form onSubmit={handleSaveProfileSubmit} className="space-y-4 text-xs font-semibold text-[#3D1F00]">
                
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Restaurant Name</label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-orange-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Postal Address</label>
                  <input
                    type="text"
                    value={profileForm.address}
                    onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-orange-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Business Phone Contact</label>
                    <input
                      type="text"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-orange-500 font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Opening Hours Calendar</label>
                    <input
                      type="text"
                      value={profileForm.openingHours}
                      onChange={(e) => setProfileForm({ ...profileForm, openingHours: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-orange-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Instagram Account Handle</label>
                    <input
                      type="text"
                      value={profileForm.instagram}
                      onChange={(e) => setProfileForm({ ...profileForm, instagram: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Website URL link</label>
                    <input
                      type="text"
                      value={profileForm.website}
                      onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Dining Style Code</label>
                    <input
                      type="text"
                      value={profileForm.diningStyle}
                      onChange={(e) => setProfileForm({ ...profileForm, diningStyle: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="border-t border-gray-100 my-4 pt-4">
                  <h4 className="text-sm font-bold text-gray-900 mb-2">📖 Culinary Story</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Story Paragraphs (One paragraph per line)</label>
                      <textarea
                        value={storyInput}
                        onChange={(e) => setStoryInput(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg p-3 text-xs focus:outline-none focus:border-orange-500 leading-relaxed"
                        rows={4}
                        placeholder="Type heritage brand story here..."
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Brand Highlights Bullets ({aboutForm.highlights.length})</label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={highlightInput}
                          onChange={(e) => setHighlightInput(e.target.value)}
                          placeholder="e.g. 🥬 Sourced fresh from local growers"
                          className="flex-1 border border-gray-200 rounded-lg p-2 text-xs focus:outline-none focus:border-orange-500"
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
                          className="bg-[#3D1F00] text-white px-4 font-semibold text-xs rounded-lg hover:bg-black transition-colors"
                        >
                          Add bullet
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto">
                        {aboutForm.highlights.map((tag, i) => (
                          <span
                            key={i}
                            onClick={() => handleRemoveHighlight(i)}
                            className="bg-amber-50 hover:bg-red-50 hover:text-red-700 text-amber-900 border border-amber-200 px-2.5 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                            title="Click to remove"
                          >
                            {tag} <span className="opacity-60">✕</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 px-6 rounded-xl text-xs transition-colors shadow-sm"
                  >
                    💾 Save Brand profile details
                  </button>
                </div>

              </form>
            </div>
          )}

          {/* ====================================================================
              VIEW E: CHAT INTEGRATION GATEWAY
              ==================================================================== */}
          {activeTab === 'chat' && (
            <div className="bg-white p-6 rounded-2xl border border-orange-500/10 shadow-sm space-y-6">
              <div>
                <h3 className="font-bold text-base">💬 WhatsApp & LINE Setup API configurations</h3>
                <p className="text-xs text-gray-500 mt-1">Configure click-to-chat coordinates links for instant bookings and queries messengers.</p>
              </div>

              <form onSubmit={handleSaveChatSubmit} className="space-y-5 text-xs font-semibold text-[#3D1F00]">
                
                {/* CONTACT CHANNEL ACTIVE STATE CONTROLLER */}
                <div className="bg-orange-50/30 p-5 rounded-2xl border border-orange-500/15 space-y-4">
                  <div>
                    <h4 className="text-orange-950 font-bold block text-sm">🛠️ Contact Channel Enablement</h4>
                    <p className="text-[11px] text-gray-500 font-normal mt-1">
                      Choose which direct communication links are visible to users visiting the public restaurant website.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { value: 'whatsapp', label: 'WhatsApp Only', desc: 'Activate WhatsApp only', icon: '💬' },
                      { value: 'line', label: 'LINE Only', desc: 'Activate LINE only', icon: '💚' },
                      { value: 'both', label: 'Both Channels', desc: 'Show both WhatsApp & LINE', icon: '✨' },
                      { value: 'disabled', label: 'Disabled', desc: 'Deactivate all chat channels', icon: '❌' }
                    ].map((item) => {
                      const active = chatForm.contactActiveChannel === item.value;
                      return (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => setChatForm({ ...chatForm, contactActiveChannel: item.value as any })}
                          className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
                            active 
                              ? 'bg-orange-500/10 border-orange-500 text-orange-950 shadow-sm font-bold scale-[1.02]' 
                              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 font-medium'
                          }`}
                        >
                          <span className="text-lg mb-1">{item.icon}</span>
                          <span className="text-[11px] block">{item.label}</span>
                          <span className="text-[9px] text-gray-400 font-normal block mt-1 leading-tight">{item.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-green-50/40 p-5 rounded-2xl border border-green-500/10 space-y-4">
                  <h4 className="text-green-800 font-bold block text-xs flex items-center gap-1.5">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500"></span>
                    WhatsApp Configuration
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-green-900 uppercase mb-1">WhatsApp Number</label>
                      <input
                        type="text"
                        value={chatForm.whatsappNumber}
                        onChange={(e) => setChatForm({ ...chatForm, whatsappNumber: e.target.value })}
                        placeholder="+6621234567"
                        className="w-full border border-gray-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-green-600 font-mono"
                        disabled={chatForm.contactActiveChannel === 'line' || chatForm.contactActiveChannel === 'disabled'}
                      />
                      <p className="text-[10px] text-gray-400 font-normal mt-1">Include country code without special characters (e.g., 66812345678).</p>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-green-900 uppercase mb-1">Default Message</label>
                      <input
                        type="text"
                        value={chatForm.whatsappMessage}
                        onChange={(e) => setChatForm({ ...chatForm, whatsappMessage: e.target.value })}
                        placeholder="Hello, I would like to book a table..."
                        className="w-full border border-gray-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-green-600"
                        disabled={chatForm.contactActiveChannel === 'line' || chatForm.contactActiveChannel === 'disabled'}
                      />
                      <p className="text-[10px] text-gray-400 font-normal mt-1">The pre-filled text in the customer's chat when they tap the button.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-emerald-50/20 p-5 rounded-2xl border border-emerald-500/10 space-y-4">
                  <h4 className="text-emerald-800 font-bold block text-xs flex items-center gap-1.5">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    LINE Configuration
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-emerald-900 uppercase mb-1">LINE ID</label>
                      <input
                        type="text"
                        value={chatForm.lineId}
                        onChange={(e) => setChatForm({ ...chatForm, lineId: e.target.value })}
                        placeholder="namastesiam_line"
                        className="w-full border border-gray-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-emerald-600 font-mono"
                        disabled={chatForm.contactActiveChannel === 'whatsapp' || chatForm.contactActiveChannel === 'disabled'}
                      />
                      <p className="text-[10px] text-gray-400 font-normal mt-1">Your official LINE ID or personal username.</p>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-emerald-900 uppercase mb-1">LINE QR Code asset link (JPG/PNG)</label>
                      <input
                        type="text"
                        value={chatForm.lineQrUrl}
                        onChange={(e) => setChatForm({ ...chatForm, lineQrUrl: e.target.value })}
                        placeholder="https://api.qrserver.com/..."
                        className="w-full border border-gray-200 rounded-lg p-2.5 text-[11px] focus:outline-none focus:border-emerald-600 font-mono"
                        disabled={chatForm.contactActiveChannel === 'whatsapp' || chatForm.contactActiveChannel === 'disabled'}
                      />
                      <p className="text-[10px] text-gray-400 font-normal mt-1">Image URL of your contact QR code.</p>
                    </div>
                  </div>

                  {chatForm.lineQrUrl && (chatForm.contactActiveChannel === 'line' || chatForm.contactActiveChannel === 'both') && (
                    <div className="pt-2 flex items-center gap-3 bg-white/40 p-3 rounded-xl border border-emerald-500/5">
                      <div className="p-2 border rounded-xl bg-white shadow-xs">
                        <img 
                          src={chatForm.lineQrUrl} 
                          alt="LINE QR code" 
                          className="w-20 h-20 object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://line.me/R/ti/p/~' + (chatForm.lineId || 'namastesiam');
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-500 leading-relaxed block max-w-sm font-normal">
                        This QR code enables customers to scan and chat immediately. If left empty, a live, scanable QR link is auto-generated based on the LINE ID provided.
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="bg-[#3D1F00] hover:bg-black text-white font-bold py-2.5 px-6 rounded-xl text-xs transition-all shadow-sm"
                  >
                    💾 Save Chat properties setup
                  </button>
                </div>

              </form>
            </div>
          )}

          {/* ====================================================================
              VIEW F: AMBIENCE GALLERY COLLAGE SYSTEM
              ==================================================================== */}
          {activeTab === 'gallery' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* GALLERY ITEM ADD FORM */}
              <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-orange-500/10 shadow-sm space-y-4">
                <div>
                  <h3 className="font-bold text-base text-[#1A0F00]">
                    {editingGalleryIndex !== null ? `📝 Replace Ambience #${editingGalleryIndex + 1}` : '📷 Post Ambience picture'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {editingGalleryIndex !== null 
                      ? 'Replace this specific item in the gallery collection below.' 
                      : 'Add beautiful visuals showing off dining space, plating, or chef details.'}
                  </p>
                </div>

                <form onSubmit={handleAddGalleryItemSubmit} className="space-y-4 text-xs font-medium text-[#3D1F00]">
                  <div>
                    <div className="flex flex-wrap gap-1.5 pb-1">
                      <span className="bg-orange-50 text-orange-950 text-[10px] px-2.5 py-1 rounded-full font-bold border border-orange-200/40">
                        Recommended: 1600 × 900 px
                      </span>
                      <span className="bg-gray-50 text-gray-600 text-[10px] px-2.5 py-1 rounded-full font-bold border border-gray-200/40">
                        Maximum: 2 MB
                      </span>
                    </div>

                    <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1 mt-2">Image Link URL</label>
                    <input
                      type="text"
                      value={galleryForm.image}
                      onChange={(e) => setGalleryForm({ ...galleryForm, image: e.target.value })}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full border border-gray-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-orange-500 font-mono"
                    />
                    
                    <input
                      type="file"
                      ref={galleryFileRef}
                      accept="image/*"
                      onChange={handleGalleryFileChange}
                      className="hidden"
                    />

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => galleryFileRef.current?.click()}
                        className="w-full text-center border-dashed border-orange-500/30 border bg-[#FFFDFB] text-xs text-orange-900 font-extrabold py-3 rounded-lg hover:bg-orange-50/50 transition-all flex items-center justify-center gap-2"
                        disabled={uploadProgress !== null}
                      >
                        📂 {uploadProgress !== null ? 'Loading...' : 'Browse gallery photo from device'}
                      </button>
                    </div>

                    {galleryImgValidation && (
                      <div className="bg-amber-50/20 border border-amber-500/10 p-2.5 rounded-xl space-y-1 text-[11px] text-[#5C3E1F] mt-2">
                        <div className="flex justify-between items-center font-mono">
                          <span>Size: <strong>{galleryImgValidation.sizeMB} MB</strong></span>
                          <span>Resolution: <strong>{galleryImgValidation.width} × {galleryImgValidation.height} px</strong></span>
                        </div>
                        <div className={`font-bold flex items-center gap-1 ${galleryImgValidation.isCorrectDimensions ? 'text-green-700' : 'text-amber-700'}`}>
                          {galleryImgValidation.isCorrectDimensions ? (
                            <span>✓ Meets recommended 1600×900 px aspect ratio!</span>
                          ) : (
                            <span>⚠️ Note: recommended is 1600×900 px. Yours is {galleryImgValidation.width}×{galleryImgValidation.height} px.</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Alternate Description (Seo & Screenreaders)</label>
                    <input
                      type="text"
                      value={galleryForm.alt}
                      onChange={(e) => setGalleryForm({ ...galleryForm, alt: e.target.value })}
                      placeholder="e.g. Elegant restaurant seating arrangement"
                      className="w-full border border-gray-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-orange-500"
                      required
                    />
                  </div>

                  <div className="bg-[#FFF8F0] border border-orange-500/10 p-3 rounded-xl">
                    <label className="flex items-center gap-2 cursor-pointer font-semibold">
                      <input
                        type="checkbox"
                        checked={galleryForm.tall}
                        onChange={(e) => setGalleryForm({ ...galleryForm, tall: e.target.checked })}
                        className="rounded border-orange-500/25 text-orange-500 focus:ring-0"
                      />
                      <span>📐 Tall vertical grid layout format (Bento expansion card)</span>
                    </label>
                  </div>

                  {galleryForm.image && (
                    <div className="border border-orange-500/10 p-2 rounded-xl bg-[#FFFDFB] flex flex-col items-center justify-center">
                      <span className="block text-[10px] text-gray-400 font-mono uppercase tracking-wider font-bold mb-1">Live preview</span>
                      <img 
                        src={galleryForm.image} 
                        alt="Ambience preview" 
                        className={`object-cover rounded-lg border shadow-sm ${galleryForm.tall ? 'w-20 h-32' : 'w-full max-w-[200px] h-24'}`}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1528605105345-5344ea20e269?auto=format&fit=crop&w=1200&q=80';
                        }}
                      />
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors shadow-sm"
                    >
                      {editingGalleryIndex !== null ? '🔒 Replace Photo Asset' : '+ Append Photo Asset'}
                    </button>
                    {editingGalleryIndex !== null && (
                      <button
                        type="button"
                        onClick={handleCancelEditGalleryItem}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 rounded-xl text-xs transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* GALLERY IMAGES PREVIEW COLLAGE AND PURGER */}
              <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-orange-500/10 shadow-sm flex flex-col h-[700px]">
                <div>
                  <h3 className="font-bold text-base">Active Collage assets ({gallery.length})</h3>
                  <p className="text-xs text-gray-500">Preview collage elements currently being viewed in restaurant landing scene.</p>
                </div>

                <div className="overflow-y-auto flex-1 grid grid-cols-2 gap-3 mt-4 pr-1 scrollbar-thin">
                  {gallery.map((g, index) => (
                    <div 
                      key={index}
                      className="group relative bg-[#FFF8F0] border rounded-2xl overflow-hidden shadow-sm h-36 border-orange-500/10"
                    >
                      <img 
                        src={g.image} 
                        alt={g.alt} 
                        className="w-full h-full object-cover" 
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1528605105345-5344ea20e269?auto=format&fit=crop&w=1200&q=80';
                        }}
                      />
                      
                      <div className="absolute inset-0 bg-black/75 opacity-100 sm:opacity-0 group-hover:opacity-100 flex flex-col justify-between p-3 transition-opacity duration-300">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] bg-orange-600 text-white font-mono px-2 py-0.5 rounded-full font-bold">
                            {g.tall ? '📐 Tall layout' : '📐 Landscape'}
                          </span>
                          
                          {/* Reorder control badges */}
                          <div className="flex gap-1 items-center">
                            <div className="flex gap-0.5 items-center mr-1">
                              <span className="text-[9px] text-[#FF9E3D] font-mono leading-none font-bold">Sort:</span>
                              <input
                                type="number"
                                value={g.display_order ?? 0}
                                onChange={(e) => handleUpdateGalleryOrder(index, Number(e.target.value))}
                                className="w-8 border border-white/20 rounded px-1 py-0.5 text-[9px] text-center font-mono font-bold bg-black text-white focus:outline-none focus:border-orange-500"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => moveGalleryItem(index, 'up')}
                              disabled={index === 0}
                              className="bg-white/20 hover:bg-white text-white hover:text-black px-1.5 py-0.5 rounded font-black disabled:opacity-20 disabled:pointer-events-none text-[10px] transition-all"
                              title="Move Up"
                            >
                              ◀
                            </button>
                            <button
                              type="button"
                              onClick={() => moveGalleryItem(index, 'down')}
                              disabled={index === gallery.length - 1}
                              className="bg-white/20 hover:bg-white text-white hover:text-black px-1.5 py-0.5 rounded font-black disabled:opacity-20 disabled:pointer-events-none text-[10px] transition-all"
                              title="Move Down"
                            >
                              ▶
                            </button>
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-[10px] text-white truncate font-bold flex items-center justify-between">
                            <span className="truncate">{g.alt || 'No details provided'}</span>
                            <span className={`shrink-0 ml-1.5 text-[8px] px-1 rounded font-black uppercase ${g.active !== false ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                              {g.active !== false ? 'Active' : 'Inactive'}
                            </span>
                          </p>
                          
                          {/* Compact active/inactive controls */}
                          <div className="flex flex-wrap gap-1 justify-center">
                            {g.active !== false ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateGalleryActive(index, false, 'hidden')}
                                  className="bg-yellow-400 hover:bg-yellow-500 text-yellow-950 text-[8px] font-bold px-1 rounded transition-colors"
                                  title="Hide photo"
                                >
                                  Hide
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateGalleryActive(index, false, 'disabled')}
                                  className="bg-orange-500 hover:bg-orange-600 text-white text-[8px] font-bold px-1 rounded transition-colors"
                                  title="Disable photo"
                                >
                                  Disable
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateGalleryActive(index, index === 0 ? false : false, 'soft_deleted')}
                                  className="bg-red-50 hover:bg-red-600 text-red-100 text-[8px] font-bold px-1 rounded transition-colors"
                                  title="Soft Delete photo"
                                >
                                  Soft Delete
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateGalleryActive(index, true, 'shown')}
                                  className="bg-blue-400 hover:bg-blue-500 text-blue-950 text-[8px] font-bold px-1 rounded transition-colors"
                                  title="Show photo"
                                >
                                  Show
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateGalleryActive(index, true, 'enabled')}
                                  className="bg-emerald-400 hover:bg-emerald-500 text-emerald-950 text-[8px] font-bold px-1 rounded transition-colors"
                                  title="Enable photo"
                                >
                                  Enable
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateGalleryActive(index, true, 'restored')}
                                  className="bg-purple-400 hover:bg-purple-500 text-purple-950 text-[8px] font-bold px-1 rounded transition-colors"
                                  title="Restore photo"
                                >
                                  Restore
                                </button>
                              </>
                            )}
                          </div>

                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => handleEditGalleryItem(index)}
                              className="flex-1 bg-amber-400 hover:bg-amber-500 text-amber-950 text-[9px] font-black py-0.5 rounded transition-colors uppercase tracking-wider"
                            >
                              Replace
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteGalleryItem(index)}
                              className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-[9px] font-bold py-0.5 rounded transition-colors uppercase tracking-wider"
                            >
                              Purge
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {gallery.length === 0 && (
                    <div className="col-span-2 py-24 text-center text-xs text-gray-400 font-mono italic">Gallery has no visuals registered.</div>
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