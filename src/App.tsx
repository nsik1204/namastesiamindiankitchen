import { useState, useMemo, useEffect, useRef } from 'react';
import { MenuService } from './services/menuService';
import { RESTAURANT_INFO, ABOUT_INFO, CATEGORIES, DISHES, GALLERY } from './data';
import { Dish, Category, RestaurantInfo, AboutInfo, GalleryItem } from './types';
import DishCard from './components/DishCard';
import { useAdminAuth } from './context/AdminAuthContext';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminLoginForm from './components/admin/AdminLoginForm';
import { getSupabaseClient } from './services/supabaseClient';

export default function App() {
  const { isAdminMode, isAuthenticated, isDeviceApproved, checkDevicePreAuth } = useAdminAuth();
  const [isCheckingDevice, setIsCheckingDevice] = useState(false);
  const [currentPath, setCurrentPath] = useState<string>(window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };
    // Intercept pushState/replaceState so routing is reactive even within SPA
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;
    
    window.history.pushState = function(...args) {
      originalPushState.apply(this, args);
      handleLocationChange();
    };
    
    window.history.replaceState = function(...args) {
      originalReplaceState.apply(this, args);
      handleLocationChange();
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  // Centralized data states
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [restaurantInfo, setRestaurantInfo] = useState<RestaurantInfo | null>(null);
  const [aboutInfo, setAboutInfo] = useState<AboutInfo | null>(null);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);

  // Navigation & filter states
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Modal states
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [selectedInfoType, setSelectedInfoType] = useState<'about' | 'contact' | 'privacy' | 'terms' | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Dynamic async initialization to mirror production backend architecture (Supabase design pattern)
  useEffect(() => {
    let active = true;
    async function loadData() {
      try {
        const fetchPromise = Promise.all([
          MenuService.getRestaurantInfo(),
          MenuService.getAboutInfo(),
          MenuService.getCategories(),
          MenuService.getDishes(),
          MenuService.getGalleryItems()
        ]);
        const timeoutPromise = new Promise<any[]>((_, reject) =>
          setTimeout(() => reject(new Error('Supabase fetch timeout')), 8000)
        );
        const [info, about, cats, allDishes, items] = await Promise.race([
          fetchPromise,
          timeoutPromise
        ]);
        if (active) {
          setRestaurantInfo(info || RESTAURANT_INFO);
          setAboutInfo(about || ABOUT_INFO);
          setCategories(cats && cats.length ? cats : CATEGORIES);
          setDishes(allDishes && allDishes.length ? allDishes : DISHES);
          setGallery(items && items.length ? items : GALLERY);
        }
      } catch (err) {
        console.error('Failed to load menu info dynamically:', err);
        if (active) {
          setRestaurantInfo(RESTAURANT_INFO);
          setAboutInfo(ABOUT_INFO);
          setCategories(CATEGORIES);
          setDishes(DISHES);
          setGallery(GALLERY);
        }
      }
    }
    loadData();
    return () => {
      active = false;
    };
  }, []);

  // Setup Supabase Realtime subscriptions to listen to updates made on other/connected devices
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'foods' },
        async (payload) => {
          console.log('Realtime update: foods table changed', payload);
          try {
            const allDishes = await MenuService.getDishes();
            setDishes(allDishes);
          } catch (err) {
            console.error('Failed to reload dishes on realtime event:', err);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories' },
        async (payload) => {
          console.log('Realtime update: categories table changed', payload);
          try {
            const cats = await MenuService.getCategories();
            setCategories(cats);
          } catch (err) {
            console.error('Failed to reload categories on realtime event:', err);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'gallery' },
        async (payload) => {
          console.log('Realtime update: gallery table changed', payload);
          try {
            const items = await MenuService.getGalleryItems();
            setGallery(items);
          } catch (err) {
            console.error('Failed to reload gallery on realtime event:', err);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'restaurant_info' },
        async (payload) => {
          console.log('Realtime update: restaurant_info table changed', payload);
          try {
            const info = await MenuService.getRestaurantInfo();
            setRestaurantInfo(info);
          } catch (err) {
            console.error('Failed to reload restaurant info on realtime event:', err);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_settings' },
        async (payload) => {
          console.log('Realtime update: chat_settings table changed', payload);
          try {
            const info = await MenuService.getRestaurantInfo();
            setRestaurantInfo(info);
          } catch (err) {
            console.error('Failed to reload chat settings on realtime event:', err);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'about_info' },
        async (payload) => {
          console.log('Realtime update: about_info table changed', payload);
          try {
            const about = await MenuService.getAboutInfo();
            setAboutInfo(about);
          } catch (err) {
            console.error('Failed to reload about info on realtime event:', err);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Keyboard shortcut listener to close any active modal with 'Escape'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedDish(null);
        setSelectedInfoType(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter food list based on category and search query
  const filteredDishes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = dishes
      .filter(f => f.active !== false)
      .filter(f => {
        const matchCategory = activeCategory === 'all' || f.category === activeCategory;
        if (!q) return matchCategory;
        const searchable = `${f.name} ${f.description} ${f.category} ${f.ingredients.join(' ')}`.toLowerCase();
        return matchCategory && searchable.includes(q);
      });
    return [...list].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  }, [dishes, activeCategory, searchQuery]);

  // Centralized computed sections extracted as derived state architectures
  const todaysSpecial = useMemo(() => {
    const specials = dishes.filter(d => d.todaySpecial && d.active !== false);
    if (specials.length === 0) return null;
    return [...specials].sort((a, b) => (a.display_order_today || 0) - (b.display_order_today || 0))[0];
  }, [dishes]);

  const chefRecommendations = useMemo(() => {
    return dishes
      .filter(d => d.chefSpecial && d.active !== false)
      .sort((a, b) => (a.display_order_chef || 0) - (b.display_order_chef || 0));
  }, [dishes]);

  const customerFavorites = useMemo(() => {
    return dishes
      .filter(d => d.customerFavorite && d.active !== false)
      .sort((a, b) => (a.display_order_favorite || 0) - (b.display_order_favorite || 0));
  }, [dishes]);

  const popularDishes = useMemo(() => {
    return dishes
      .filter(d => d.bestseller && d.active !== false)
      .sort((a, b) => (a.display_order_popular || 0) - (b.display_order_popular || 0));
  }, [dishes]);

  const sortedCategories = useMemo(() => {
    return [...categories]
      .filter(c => c.active !== false)
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  }, [categories]);

  const sortedGallery = useMemo(() => {
    return [...gallery]
      .filter(g => g.active !== false)
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  }, [gallery]);

  // Filtered popular and favorites for nested sections with dedicated display orders
  const popularFiltered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return dishes
      .filter(d => d.bestseller && d.active !== false && (activeCategory === 'all' || d.category === activeCategory))
      .filter(d => {
        if (!q) return true;
        const searchable = `${d.name} ${d.description} ${d.category} ${d.ingredients.join(' ')}`.toLowerCase();
        return searchable.includes(q);
      })
      .sort((a, b) => (a.display_order_popular || 0) - (b.display_order_popular || 0));
  }, [dishes, activeCategory, searchQuery]);

  const favoritesFiltered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return dishes
      .filter(d => d.customerFavorite && d.active !== false && (activeCategory === 'all' || d.category === activeCategory))
      .filter(d => {
        if (!q) return true;
        const searchable = `${d.name} ${d.description} ${d.category} ${d.ingredients.join(' ')}`.toLowerCase();
        return searchable.includes(q);
      })
      .sort((a, b) => (a.display_order_favorite || 0) - (b.display_order_favorite || 0));
  }, [dishes, activeCategory, searchQuery]);

  // Remove fallback that silently changes ordering
  const popularDishesToRender = popularFiltered;

  // Handler for custom search click button
  const handleLiveSearchClick = () => {
    if (searchInputRef.current) {
      setSearchQuery(searchInputRef.current.value);
      searchInputRef.current.focus();
      const menuSection = document.getElementById('menu');
      if (menuSection) {
        menuSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  // Precompiled modal content helpers for info links
  const getInfoModalContent = () => {
    if (!selectedInfoType || !restaurantInfo) return null;
    switch (selectedInfoType) {
      case 'about':
        return {
          title: `About ${restaurantInfo.name}`,
          body: 'A premium culinary destination celebrating authentic flavours, fresh ingredients, and chef-crafted experiences.'
        };
      case 'contact':
        return {
          title: 'Contact Information',
          body: `📍 ${restaurantInfo.address}\n\n📞 ${restaurantInfo.phone}\n\n🕒 ${restaurantInfo.openingHours}`
        };
      case 'privacy':
        return {
          title: 'Privacy Policy',
          body: 'We value your privacy and use information only to improve your browsing experience.'
        };
      case 'terms':
        return {
          title: 'Terms of Service',
          body: 'All menu items and prices are subject to availability and seasonal updates.'
        };
      default:
        return { title: 'Information', body: '' };
    }
  };

  const infoModalData = getInfoModalContent();

  // Dynamic persistence wrappers mapping changes back to the Supabase Cloud DB tables
  const handleUpdateDishes = async (updated: Dish[]) => {
    setDishes(updated);
    await MenuService.saveDishes(updated);
  };

  const handleUpdateRestaurantInfo = async (updated: RestaurantInfo) => {
    setRestaurantInfo(updated);
    await MenuService.saveRestaurantInfo(updated);
  };

  const handleUpdateAboutInfo = async (updated: AboutInfo) => {
    setAboutInfo(updated);
    await MenuService.saveAboutInfo(updated);
  };

  const handleUpdateCategories = async (updated: Category[]) => {
    setCategories(updated);
    await MenuService.saveCategories(updated);
  };

  const handleUpdateGallery = async (updated: GalleryItem[]) => {
    setGallery(updated);
    await MenuService.saveGalleryItems(updated);
  };

  const isAdminPath = currentPath === '/admin' || currentPath === '/admin/';

  useEffect(() => {
    if (isAdminPath && isDeviceApproved === null && !isCheckingDevice) {
      setIsCheckingDevice(true);
      checkDevicePreAuth().finally(() => setIsCheckingDevice(false));
    }
  }, [isAdminPath, isDeviceApproved, isCheckingDevice, checkDevicePreAuth]);

  // Removed old instant admin mode check. Router-based rendering handles admin area under /admin

  // Guard loading state gracefully if critical info has not resolved from services yet
  if (!restaurantInfo || !aboutInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF8F0]" style={{ color: 'var(--orange)' }}>
        <div className="text-center font-sans">
          <p className="text-xl font-bold tracking-tight mb-2">Namaste Siam Indian Kitchen</p>
          <p className="text-sm opacity-80 animate-pulse">Loading menu experience...</p>
        </div>
      </div>
    );
  }



  if (isAdminPath) {
    if (isCheckingDevice) {
      return <div className="min-h-screen bg-[#FFF8F0]" />;
    }
    
    if (isDeviceApproved) {
      if (isAdminMode && isAuthenticated) {
        return (
          <AdminDashboard
            dishes={dishes}
            categories={categories}
            restaurantInfo={restaurantInfo}
            aboutInfo={aboutInfo}
            gallery={gallery}
            onUpdateDishes={handleUpdateDishes}
            onUpdateRestaurantInfo={handleUpdateRestaurantInfo}
            onUpdateAboutInfo={handleUpdateAboutInfo}
            onUpdateCategories={handleUpdateCategories}
            onUpdateGallery={handleUpdateGallery}
            onClose={() => {
              window.history.pushState({}, '', '/');
            }}
          />
        );
      } else {
        return (
          <AdminLoginForm 
            onSuccess={() => {}} 
            onCancel={() => window.history.pushState({}, '', '/')} 
          />
        );
      }
    } else {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white text-gray-800">
          <h1 className="text-4xl font-bold mb-4">Page Not Found</h1>
          <p className="text-lg">The requested page could not be found.</p>
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen">
      {/* HEADER NAVIGATION */}
      <nav id="navbar">
        <div className="logo" id="logo-branding">
          Namaste Siam <span id="logo-accent">Indian Kitchen</span>
        </div>
        <ul className="nav-links" id="menu-links">
          <li><a href="#menu" id="link-menu">Menu</a></li>
          <li><a href="#special" id="link-specials">Specials</a></li>
          <li><a href="#about" id="link-about">About</a></li>
          <li><a href="#info" id="link-info">Info</a></li>
        </ul>
        <div className="nav-welcome" id="nav-welcome-message">
          Welcome to <span className="brand">{restaurantInfo.name}</span>
          <span className="line2">- Crafted Fresh. Served With Passion.</span>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="hero" id="top">
        <div className="hero-content" id="hero-heading-block">
          <div className="hero-badge" id="premium-badge">
            <span className="dot" id="dot-indicator"></span> Premium Dining Experience
          </div>
          <h1 id="hero-title">Experience <em>Authentic Flavours</em></h1>
          <p id="hero-description">
            Crafted Fresh. Served With Passion. Explore our signature menu curated by our chefs for a refined dining experience.
          </p>
          
          <div className="search-bar" id="search-bar-element">
            <input
              type="text"
              placeholder="Search dishes, ingredients, category..."
              ref={searchInputRef}
              onChange={(e) => setSearchQuery(e.target.value)}
              id="searchInput"
              aria-label="Search menu items"
            />
            <button 
              type="button" 
              onClick={handleLiveSearchClick} 
              id="searchBtn"
            >
              Live Menu Search
            </button>
          </div>

          <div className="hero-stats" id="hero-counters">
            <span className="hero-stat" id="stat-rating">⭐ 4.8 Customer Rating</span>
            <span className="hero-stat" id="stat-dishes">🍽️ 100+ Signature Dishes</span>
            <span className="hero-stat" id="stat-ingredients">👨‍🍳 Fresh Ingredients</span>
            <span className="hero-stat" id="stat-quality">🌿 Premium Quality</span>
            <span className="hero-stat" id="stat-chef">🏆 Chef Recommended</span>
          </div>
        </div>

        {/* HERO VISUAL (TODAY'S SPECIAL CARD) */}
        <div className="hero-visual" id="todaySpecialContainer">
          {todaysSpecial && (
            <div 
              className="feature-card" 
              id={`todays-special-${todaysSpecial.id}`}
              onClick={() => setSelectedDish(todaysSpecial)}
              style={{ cursor: 'pointer' }}
              tabIndex={0}
              role="button"
              aria-label={`Today's Special: ${todaysSpecial.name}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setSelectedDish(todaysSpecial);
                }
              }}
            >
              <img src={todaysSpecial.image} alt={todaysSpecial.name} />
              <div className="feature-card-body" id="special-card-body">
                <div className="feature-kicker" id="badge-kicker">Today's Special</div>
                <div className="feature-title" id="special-title">{todaysSpecial.name}</div>
                <div className="feature-sub" id="special-description">{todaysSpecial.description}</div>
                <div className="feature-price" id="special-price-tag">฿{todaysSpecial.priceTHB}</div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CHEF RECOMMENDATIONS SECTION */}
      <section className="section" id="special">
        <div className="section-header" id="recs-header">
          <div className="section-title" id="recs-title">
            Chef <span>Recommendations</span>
          </div>
        </div>
        <div className="cards-3" id="chefRecs">
          {chefRecommendations.slice(0, 3).map((d) => (
            <div
              key={`recs-${d.id}`}
              className="info-card"
              id={`rec-item-${d.id}`}
              onClick={() => setSelectedDish(d)}
              style={{ cursor: 'pointer' }}
              tabIndex={0}
              role="button"
              aria-label={`Chef Recommendation: ${d.name}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setSelectedDish(d);
                }
              }}
            >
              <img
                src={d.image}
                alt={d.name}
                loading="lazy"
                style={{
                  width: '100%',
                  height: '170px',
                  objectFit: 'cover',
                  borderRadius: '12px',
                  marginBottom: '12px',
                }}
              />
              <h3 id={`rec-title-${d.id}`}>{d.name}</h3>
              <p id={`rec-desc-${d.id}`}>{d.description}</p>
              <p
                id={`rec-price-${d.id}`}
                style={{
                  marginTop: '8px',
                  color: 'var(--orange)',
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 800,
                }}
              >
                ฿{d.priceTHB}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CATEGORY SELECTOR */}
      <section className="section" style={{ paddingTop: '20px' }} id="menu">
        <div className="section-header" id="categories-header">
          <div className="section-title" id="categories-title">
            Browse <span>Menu Categories</span>
          </div>
        </div>
        <div className="categories" id="categories-tabs" role="tablist" aria-label="Menu categories">
          {sortedCategories.map((c) => (
            <button
              key={`cat-${c.id}`}
              id={`cat-btn-${c.id}`}
              className={`cat-pill ${c.id === activeCategory ? 'active' : ''}`}
              onClick={() => setActiveCategory(c.id)}
              role="tab"
              aria-selected={c.id === activeCategory}
              aria-controls="menu-grids"
            >
              {c.label}
            </button>
          ))}
        </div>
      </section>

      {/* POPULAR DISHES GRID */}
      <section className="section" style={{ paddingTop: '0' }} id="popular-section">
        <div className="section-header" id="popular-header">
          <div className="section-title" id="popular-title">
            Popular <span>Dishes</span>
          </div>
        </div>
        <div className="menu-grid" id="menuGrid">
          {popularDishesToRender.length > 0 ? (
            popularDishesToRender.map((d) => (
              <DishCard
                key={`popular-dish-${d.id}`}
                dish={d}
                idPrefix="dish"
                onClick={() => setSelectedDish(d)}
              />
            ))
          ) : (
            <p className="col-span-full py-8 text-center" style={{ color: 'var(--text-muted)' }} id="no-popular-found">
              No popular dishes found matching your search.
            </p>
          )}
        </div>
      </section>

      {/* CUSTOMER FAVORITES GRID */}
      <section className="section" style={{ paddingTop: '0' }} id="favorites-section">
        <div className="section-header" id="favorites-header">
          <div className="section-title" id="favorites-title">
            Customer <span>Favorites</span>
          </div>
        </div>
        <div className="menu-grid" id="favoritesGrid">
          {favoritesFiltered.length > 0 ? (
            favoritesFiltered.map((d) => (
              <DishCard
                key={`favorite-dish-${d.id}`}
                dish={d}
                idPrefix="fav"
                onClick={() => setSelectedDish(d)}
              />
            ))
          ) : (
            <p className="col-span-full py-8 text-center" style={{ color: 'var(--text-muted)' }} id="no-favorites-found">
              No favorites found for this filter or search.
            </p>
          )}
        </div>
      </section>

      {/* ABOUT SECTION */}
      <section className="section" id="about">
        <div className="section-header" id="about-header">
          <div className="section-title" id="about-title">
            About <span>{restaurantInfo.name}</span>
          </div>
        </div>
        <div className="about-box" id="aboutBox">
          <div id="about-story-col">
            {aboutInfo.story.map((para, i) => (
              <p key={`story-para-${i}`} style={{ marginTop: i ? '12px' : '0px' }}>
                {para}
              </p>
            ))}
          </div>
          <div className="about-points" id="about-points-col">
            {aboutInfo.highlights.map((h, index) => (
              <div key={`highlight-${index}`} className="about-pill">
                {h}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RESTAURANT INFORMATION GRID */}
      <section className="section" style={{ paddingTop: '0' }} id="info">
        <div className="section-header" id="info-header">
          <div className="section-title" id="info-title">
            Restaurant <span>Information</span>
          </div>
        </div>
        <div className="cards-3" id="restaurantInfoGrid">
          <div className="info-card" id="info-card-address">
            <h3>📍 Address</h3>
            <p>{restaurantInfo.address}</p>
          </div>
          <div className="info-card" id="info-card-phone">
            <h3>📞 Phone</h3>
            <p>{restaurantInfo.phone}</p>
          </div>
          <div className="info-card" id="info-card-hours">
            <h3>🕒 Opening Hours</h3>
            <p>{restaurantInfo.openingHours}</p>
          </div>
          <div className="info-card" id="info-card-instagram">
            <h3>📷 Instagram</h3>
            <p>{restaurantInfo.instagram}</p>
          </div>
          <div className="info-card" id="info-card-website">
            <h3>🌐 Website</h3>
            <p>{restaurantInfo.website}</p>
          </div>
          <div className="info-card" id="info-card-style">
            <h3>🍽️ Dining Style</h3>
            <p>{restaurantInfo.diningStyle}</p>
          </div>
        </div>

        {/* DYNAMIC CHAT BOOKING CTA CONTAINER */}
        {restaurantInfo.contactActiveChannel !== 'disabled' && (
          <div className="mt-10 bg-white p-6 sm:p-8 rounded-3xl border border-orange-500/15 shadow-md max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6" id="bookingActionBanner">
            <div className="space-y-1.5 text-center md:text-left">
              <span className="bg-orange-50 text-orange-950 text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full border border border-orange-100">
                ⚡ Direct Chat Desk
              </span>
              <h3 className="font-bold text-lg text-gray-900 mt-2">Book a Table & Inquire Instantly</h3>
              <p className="text-xs text-gray-500 leading-relaxed max-w-lg">
                Coordinate with our reservations host instantly via your favorite messenger. Simple contact initiation with no payment and no authorization required.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3 justify-center">
              {(restaurantInfo.contactActiveChannel === 'whatsapp' || restaurantInfo.contactActiveChannel === 'both') && (
                <a
                  href={`https://wa.me/${restaurantInfo.whatsappNumber?.replace(/\+/g, '')}?text=${encodeURIComponent(restaurantInfo.whatsappMessage || '')}`}
                  target="_blank"
                  rel="noreferrer"
                  id="ctaWhatsAppBtn"
                  className="bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold py-3 px-5 rounded-xl text-xs transition-transform shadow-sm hover:-translate-y-0.5 flex items-center gap-2"
                >
                  <span className="text-sm">💬</span> WhatsApp Host
                </a>
              )}
              {(restaurantInfo.contactActiveChannel === 'line' || restaurantInfo.contactActiveChannel === 'both') && (
                <a
                  href={`https://line.me/R/ti/p/~${restaurantInfo.lineId}`}
                  target="_blank"
                  rel="noreferrer"
                  id="ctaLineBtn"
                  className="bg-[#06C755] hover:bg-[#05b04b] text-white font-bold py-3 px-5 rounded-xl text-xs transition-transform shadow-sm hover:-translate-y-0.5 flex items-center gap-2"
                >
                  <span className="text-sm">💚</span> LINE Chat Advisor
                </a>
              )}
            </div>
          </div>
        )}
      </section>

      {/* GALLERY & AMBIENCE */}
      <section className="section" style={{ paddingTop: '0' }} id="gallery-section">
        <div className="section-header" id="gallery-header">
          <div className="section-title" id="gallery-title">
            Gallery <span>& Ambience</span>
          </div>
        </div>
        <div className="gallery-grid" id="galleryGrid">
          {sortedGallery.map((g, index) => (
            <img
              key={`gallery-${index}`}
              className={g.tall ? 'tall' : ''}
              src={g.image}
              alt={g.alt}
              loading="lazy"
              id={`gallery-img-${index}`}
            />
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer id="footer">
        <div className="footer-grid" id="footer-layout">
          <div id="footer-branding-col">
            <div className="footer-logo" id="footer-logo-title">{restaurantInfo.name}</div>
            <p>
              Premium restaurant menu experience with authentic flavors, elegant ambience, and chef-crafted cuisine.
            </p>
          </div>
          <div id="footer-restaurant-col">
            <h4>Restaurant</h4>
            <ul id="footerRestaurantInfo">
              <li>📍 {restaurantInfo.address}</li>
              <li>📞 {restaurantInfo.phone}</li>
              <li>🕒 {restaurantInfo.openingHours}</li>
            </ul>
          </div>
          <div id="footer-links-col">
            <h4>Links</h4>
            <ul>
              <li>
                <button
                  type="button"
                  onClick={() => setSelectedInfoType('about')}
                  className="hover:text-[var(--orange)] transition-colors text-left"
                  style={{ background: 'none', border: 'none', padding: 0, color: 'rgba(255,255,255,0.68)', cursor: 'pointer' }}
                  id="foot-btn-about"
                >
                  About
                </button>
              </li>
              <li style={{ marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedInfoType('contact')}
                  className="hover:text-[var(--orange)] transition-colors text-left"
                  style={{ background: 'none', border: 'none', padding: 0, color: 'rgba(255,255,255,0.68)', cursor: 'pointer' }}
                  id="foot-btn-contact"
                >
                  Contact
                </button>
              </li>
              <li style={{ marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedInfoType('privacy')}
                  className="hover:text-[var(--orange)] transition-colors text-left"
                  style={{ background: 'none', border: 'none', padding: 0, color: 'rgba(255,255,255,0.68)', cursor: 'pointer' }}
                  id="foot-btn-privacy"
                >
                  Privacy Policy
                </button>
              </li>
              <li style={{ marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedInfoType('terms')}
                  className="hover:text-[var(--orange)] transition-colors text-left"
                  style={{ background: 'none', border: 'none', padding: 0, color: 'rgba(255,255,255,0.68)', cursor: 'pointer' }}
                  id="foot-btn-terms"
                >
                  Terms
                </button>
              </li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom" id="footer-copyright-note">
          © 2026 {restaurantInfo.name}. All rights reserved.
        </div>
      </footer>

      {/* DISH DETAILS MODAL */}
      <div
        id="dishModal"
        className={`modal ${selectedDish ? 'open' : ''}`}
        aria-hidden={!selectedDish}
        onClick={(e) => {
          if (e.target instanceof HTMLElement && e.target.id === 'dishModal') {
            setSelectedDish(null);
          }
        }}
      >
        <div className="relative w-full max-w-[920px] mx-auto px-3" id="dish-modal-container">
          <button
            className="modal-close"
            onClick={() => setSelectedDish(null)}
            aria-label="Close modal"
            id="close-dish-modal"
          >
            ✕
          </button>
          
          {selectedDish && (
            <div className="modal-content" id="dishModalContent">
              <img className="modal-img" src={selectedDish.image} alt={selectedDish.name} />
              <div className="modal-details" id={`modal-details-${selectedDish.id}`}>
                <h2 className="modal-title" id="modal-dish-name">{selectedDish.name}</h2>
                <p className="modal-desc" id="modal-dish-desc">{selectedDish.description}</p>
                <div className="modal-price" id="modal-dish-price">฿{selectedDish.priceTHB}</div>
                <div className="meta-row" id="modal-dish-meta">
                  <span className={`badge ${selectedDish.type === 'veg' ? 'green' : ''}`}>
                    {selectedDish.type === 'veg' ? 'Veg' : 'Non-Veg'}
                  </span>
                  {selectedDish.chefSpecial && <span className="badge">Chef Special</span>}
                  {selectedDish.bestseller && <span className="badge">Bestseller</span>}
                  <span className="badge">{selectedDish.spiceLevel}</span>
                </div>
                <h4 style={{ fontFamily: "'Syne', sans-serif", marginTop: '10px', fontWeight: 700 }} id="modal-dish-ingredients-title">Ingredients</h4>
                <div className="ingredients" style={{ marginTop: '10px' }} id="modal-dish-ingredients-tags">
                  {selectedDish.ingredients.map((ing, i) => (
                    <span key={`modal-ing-${selectedDish.id}-${i}`} className="ingredient">{ing}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* METAMODAL FOR SYSTEM / FOOTER LINKS */}
      <div
        id="infoModal"
        className={`modal ${selectedInfoType ? 'open' : ''}`}
        aria-hidden={!selectedInfoType}
        onClick={(e) => {
          if (e.target instanceof HTMLElement && e.target.id === 'infoModal') {
            setSelectedInfoType(null);
          }
        }}
      >
        <div className="relative w-full max-w-[640px] mx-auto px-3" id="info-modal-container">
          <button
            className="modal-close"
            onClick={() => setSelectedInfoType(null)}
            aria-label="Close modal"
            id="close-info-modal"
          >
            ✕
          </button>
          
          <div className="modal-content" style={{ gridTemplateColumns: '1fr' }} id="infoModalContent">
            <div className="modal-details" id="infoModalBody">
              {selectedInfoType === 'contact' ? (
                <div className="space-y-6" id="customContactModalBody">
                  <h2 className="modal-title font-bold text-gray-900 border-b pb-3 border-gray-100 flex items-center gap-2">
                    📍 Contact & Reservation Desk
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    {/* General coordinates */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-[11px] font-bold uppercase text-orange-950 tracking-wider">Restaurant Address</h4>
                        <p className="text-sm text-gray-600 mt-1 leading-relaxed">📍 {restaurantInfo.address}</p>
                      </div>
                      <div>
                        <h4 className="text-[11px] font-bold uppercase text-orange-950 tracking-wider">Opening Hours</h4>
                        <p className="text-sm text-gray-600 mt-1">🕒 {restaurantInfo.openingHours}</p>
                      </div>
                      <div>
                        <h4 className="text-[11px] font-bold uppercase text-orange-950 tracking-wider">Telephone Line</h4>
                        <p className="text-sm text-orange-900 font-bold mt-1">
                          <a href={`tel:${restaurantInfo.phone}`} className="hover:underline">📞 {restaurantInfo.phone}</a>
                        </p>
                      </div>
                    </div>

                    {/* Instant Messaging Channels */}
                    <div className="bg-orange-50/10 border border-orange-500/10 p-5 rounded-2xl space-y-4">
                      <div>
                        <h4 className="text-[11px] font-bold uppercase text-gray-800 tracking-wider">Instant Chat Booking</h4>
                        <p className="text-xs text-gray-500 mt-1">Choose any active channel to coordinate with our reservation team.</p>
                      </div>

                      {restaurantInfo.contactActiveChannel === 'disabled' ? (
                        <div className="text-xs text-gray-400 italic py-4">
                          Direct chat messengers are currently offline. Please call our landline for tables!
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {(restaurantInfo.contactActiveChannel === 'whatsapp' || restaurantInfo.contactActiveChannel === 'both') && (
                            <div className="space-y-1">
                              <a
                                href={`https://wa.me/${restaurantInfo.whatsappNumber?.replace(/\+/g, '')}?text=${encodeURIComponent(restaurantInfo.whatsappMessage || '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="w-full bg-[#25D366] hover:bg-[#1ebd53] text-white font-bold py-3 px-4 rounded-xl text-xs transition-with shadow-sm text-center block"
                                id="modalWhatsAppAction"
                              >
                                💬 WhatsApp Reservation
                              </a>
                              {restaurantInfo.whatsappNumber && (
                                <p className="text-[10px] text-gray-400 text-center">Number: {restaurantInfo.whatsappNumber}</p>
                              )}
                            </div>
                          )}

                          {(restaurantInfo.contactActiveChannel === 'line' || restaurantInfo.contactActiveChannel === 'both') && (
                            <div className="space-y-2 pt-1 border-t border-dashed border-gray-100">
                              <a
                                href={`https://line.me/R/ti/p/~${restaurantInfo.lineId}`}
                                target="_blank"
                                rel="noreferrer"
                                className="w-full bg-[#06C755] hover:bg-[#05b04b] text-white font-bold py-3 px-4 rounded-xl text-xs transition-with shadow-sm text-center block"
                                id="modalLineAction"
                              >
                                💚 LINE Chat Coordinator
                              </a>
                              
                              {restaurantInfo.lineId && (
                                <div className="flex flex-col items-center gap-1">
                                  <span className="block text-[10px] text-gray-400 font-bold">LINE ID: @{restaurantInfo.lineId}</span>
                                  <div className="p-1.5 border bg-white rounded-lg inline-block">
                                    <img 
                                      src={restaurantInfo.lineQrUrl || `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://line.me/R/ti/p/~${restaurantInfo.lineId}`} 
                                      alt="LINE scan QR code" 
                                      className="w-24 h-24 object-contain"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://line.me/R/ti/p/~${restaurantInfo.lineId}`;
                                      }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                infoModalData && (
                  <>
                    <h2 className="modal-title" id="info-modal-title">{infoModalData.title}</h2>
                    <p 
                      className="modal-desc whitespace-pre-wrap" 
                      id="info-modal-body"
                      style={{ fontSize: '1rem', lineHeight: '1.7', marginTop: '14px' }}
                    >
                      {infoModalData.body}
                    </p>
                  </>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* FLOATING ACTION MESSENGER FOR USER CONVENIENCE */}
      {restaurantInfo && restaurantInfo.contactActiveChannel !== 'disabled' && (
        <div className="fixed bottom-6 right-6 z-[95] flex flex-col items-end gap-3 pointer-events-auto" id="floatingChatEngagement">
          {/* Active Option Buttons */}
          <div className="flex flex-col gap-2 items-end">
            {(restaurantInfo.contactActiveChannel === 'whatsapp' || restaurantInfo.contactActiveChannel === 'both') && (
              <a
                href={`https://wa.me/${restaurantInfo.whatsappNumber?.replace(/\+/g, '')}?text=${encodeURIComponent(restaurantInfo.whatsappMessage || '')}`}
                target="_blank"
                rel="noreferrer"
                id="floatingWhatsAppBtn"
                className="flex items-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold py-2.5 px-4 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95 text-xs tracking-wide"
              >
                <span>💬</span> WhatsApp
              </a>
            )}
            {(restaurantInfo.contactActiveChannel === 'line' || restaurantInfo.contactActiveChannel === 'both') && (
              <a
                href={`https://line.me/R/ti/p/~${restaurantInfo.lineId}`}
                target="_blank"
                rel="noreferrer"
                id="floatingLineBtn"
                className="flex items-center gap-2 bg-[#06C755] hover:bg-[#05b04b] text-white font-bold py-2.5 px-4 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95 text-xs tracking-wide"
              >
                <span>💚</span> LINE
              </a>
            )}
          </div>
          
          {/* Main Indicator */}
          <div className="bg-[#3D1F00] text-[#FFF8F0] border border-orange-500/20 p-3.5 rounded-full shadow-xl flex items-center justify-center animate-bounce cursor-pointer hover:bg-[#1A0F00] transition-colors" title="Contact Us Instantly">
            <span className="text-xs font-bold leading-none select-none tracking-wide flex items-center gap-1">
              ⚡ Chat Book
            </span>
          </div>
        </div>
      )}
    </div>
  );
}