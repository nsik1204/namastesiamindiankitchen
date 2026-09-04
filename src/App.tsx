import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { MenuService } from './services/menuService';
import { Dish, Category, RestaurantInfo, AboutInfo, GalleryItem } from './types';
import DishCard from './components/DishCard';
import AdminDashboard from './components/admin/AdminDashboard';
import { getSupabaseClient } from './services/supabaseClient';

/* ------------------------------------------------------------------ */
/* Warm-paper / tandoor palette (from workspace UI reference)          */
/* ------------------------------------------------------------------ */
const T = {
  milk: '#FDF8F1',
  paper: '#FFFDF9',
  wine: '#A90E02',
  wineDeep: '#3D1F00',
  amber: '#E08A2B',
  ink: '#2B1A0E',
  muted: '#8C7358',
  line: 'rgba(122,74,34,0.16)',
};

const UNLOCK_PATH = '/unlock-admin';

/* ================================================================== */
/* Ambient ember background                                            */
/* ================================================================== */
function Background() {
  const embers = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        id: i,
        left: `${(i * 7.3 + 4) % 100}%`,
        size: 2 + ((i * 13) % 4),
        duration: 9 + ((i * 17) % 9),
        delay: -((i * 23) % 12),
        dx: (i % 2 === 0 ? 1 : -1) * (18 + ((i * 11) % 46)),
      })),
    []
  );

  return (
    <>
      <style>{`
        @keyframes nsEmberRise {
          0%   { transform: translate3d(0, 12vh, 0) scale(0.7); opacity: 0; }
          12%  { opacity: 0.75; }
          100% { transform: translate3d(var(--ns-dx, 0px), -102vh, 0) scale(1.15); opacity: 0; }
        }
        .ns-ember {
          position: absolute;
          bottom: -10px;
          border-radius: 9999px;
          background: radial-gradient(circle, ${T.amber} 0%, rgba(224,138,43,0) 70%);
          animation-name: nsEmberRise;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        @media (prefers-reduced-motion: reduce) { .ns-ember { animation: none; opacity: 0; } }
      `}</style>
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          background:
            `radial-gradient(1100px 520px at 12% -8%, rgba(224,138,43,0.18), transparent 60%),` +
            `radial-gradient(900px 460px at 92% 4%, rgba(122,74,34,0.16), transparent 62%),` +
            `linear-gradient(180deg, ${T.milk} 0%, ${T.paper} 55%, ${T.milk} 100%)`,
        }}
      />
      <div
        aria-hidden="true"
        style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}
      >
        {embers.map((e) => (
          <span
            key={e.id}
            className="ns-ember"
            style={
              {
                left: e.left,
                width: e.size,
                height: e.size,
                animationDuration: `${e.duration}s`,
                animationDelay: `${e.delay}s`,
                ['--ns-dx' as string]: `${e.dx}px`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>
    </>
  );
}

/* ================================================================== */
/* Protected admin gate — only reachable at /unlock-admin?k=<key>      */
/* ================================================================== */
interface AdminGateProps {
  dishes: Dish[];
  categories: Category[];
  restaurantInfo: RestaurantInfo;
  aboutInfo: AboutInfo;
  gallery: GalleryItem[];
  onUpdateDishes: (d: Dish[]) => void;
  onUpdateCategories: (c: Category[]) => void;
  onUpdateRestaurantInfo: (r: RestaurantInfo) => void;
  onUpdateAboutInfo: (a: AboutInfo) => void;
  onUpdateGallery: (g: GalleryItem[]) => void;
  onExit: () => void;
}

function AdminGate(props: AdminGateProps) {
  const supabase = getSupabaseClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const verifyAdmin = useCallback(async (): Promise<boolean> => {
    if (!supabase) {
      setError('Backend is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
      return false;
    }
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) return false;
    const { data, error: rpcErr } = await supabase.rpc('is_admin');
    if (rpcErr) {
      setError(`Admin verification failed: ${rpcErr.message}`);
      return false;
    }
    if (data !== true) {
      setError('This account is signed in but is not an administrator.');
      return false;
    }
    return true;
  }, [supabase]);

  // Restore an existing admin session on mount.
  useEffect(() => {
    let active = true;
    (async () => {
      const ok = await verifyAdmin();
      if (active) {
        setIsAdmin(ok);
        setChecking(false);
        if (ok) setError(null);
      }
    })();
    return () => {
      active = false;
    };
  }, [verifyAdmin]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!supabase) {
      setError('Backend is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
      return;
    }
    setBusy(true);
    try {
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInErr) {
        setError(signInErr.message);
        return;
      }
      const ok = await verifyAdmin();
      if (!ok) {
        await supabase.auth.signOut();
        setIsAdmin(false);
        setError((prev) => prev ?? 'Access denied for this account.');
        return;
      }
      setPassword('');
      setIsAdmin(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected sign-in error.');
    } finally {
      setBusy(false);
    }
  };

  const handleSignOut = async () => {
    if (supabase) await supabase.auth.signOut();
    setIsAdmin(false);
  };

  if (checking) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: T.milk,
          color: T.wine,
          position: 'relative',
          zIndex: 10,
        }}
      >
        <p style={{ fontSize: 14, opacity: 0.8 }}>Checking administrator session…</p>
      </div>
    );
  }

  if (isAdmin) {
    return (
      <div style={{ position: 'relative', zIndex: 10, minHeight: '100vh', background: T.milk }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10,
            padding: '12px 18px',
            borderBottom: `1px solid ${T.line}`,
            background: T.paper,
          }}
        >
          <button
            type="button"
            onClick={handleSignOut}
            style={{
              border: `1px solid ${T.line}`,
              background: 'transparent',
              color: T.wine,
              borderRadius: 10,
              padding: '7px 14px',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Sign out
          </button>
        </div>
        <AdminDashboard
          dishes={props.dishes}
          categories={props.categories}
          restaurantInfo={props.restaurantInfo}
          aboutInfo={props.aboutInfo}
          gallery={props.gallery}
          onUpdateDishes={props.onUpdateDishes}
          onUpdateRestaurantInfo={props.onUpdateRestaurantInfo}
          onUpdateAboutInfo={props.onUpdateAboutInfo}
          onUpdateCategories={props.onUpdateCategories}
          onUpdateGallery={props.onUpdateGallery}
          onClose={props.onExit}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'relative',
        zIndex: 10,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <form
        onSubmit={handleSignIn}
        style={{
          width: '100%',
          maxWidth: 400,
          background: T.paper,
          border: `1px solid ${T.line}`,
          borderRadius: 22,
          padding: 28,
          boxShadow: '0 22px 60px rgba(61,31,0,0.12)',
        }}
      >
        <p
          style={{
            fontSize: 10,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: T.amber,
            fontWeight: 800,
            margin: 0,
          }}
        >
          Restricted Area
        </p>
        <h1 style={{ margin: '8px 0 4px', fontSize: 24, color: T.ink, fontWeight: 800 }}>
          Administrator sign in
        </h1>
        <p style={{ margin: '0 0 20px', fontSize: 12, color: T.muted, lineHeight: 1.6 }}>
          Authorised staff only. All changes are written to the live menu database.
        </p>

        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.wine }}>
          Email
          <input
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: '100%',
              marginTop: 6,
              marginBottom: 14,
              padding: '11px 13px',
              borderRadius: 12,
              border: `1px solid ${T.line}`,
              background: T.milk,
              color: T.ink,
              fontSize: 14,
              boxSizing: 'border-box',
            }}
          />
        </label>

        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.wine }}>
          Password
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%',
              marginTop: 6,
              marginBottom: 18,
              padding: '11px 13px',
              borderRadius: 12,
              border: `1px solid ${T.line}`,
              background: T.milk,
              color: T.ink,
              fontSize: 14,
              boxSizing: 'border-box',
            }}
          />
        </label>

        {error && (
          <p
            role="alert"
            style={{
              margin: '0 0 14px',
              fontSize: 12,
              color: '#9B1C1C',
              background: 'rgba(155,28,28,0.08)',
              border: '1px solid rgba(155,28,28,0.2)',
              borderRadius: 10,
              padding: '9px 11px',
            }}
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: 12,
            border: 'none',
            background: busy ? T.muted : T.wine,
            color: T.milk,
            fontWeight: 800,
            fontSize: 14,
            cursor: busy ? 'not-allowed' : 'pointer',
          }}
        >
          {busy ? 'Signing in…' : 'Sign in'}
        </button>

        <button
          type="button"
          onClick={props.onExit}
          style={{
            width: '100%',
            marginTop: 10,
            padding: '10px 16px',
            borderRadius: 12,
            border: `1px solid ${T.line}`,
            background: 'transparent',
            color: T.wine,
            fontWeight: 700,
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          Back to site
        </button>
      </form>
    </div>
  );
}

/* ================================================================== */
/* Not found                                                           */
/* ================================================================== */
function NotFound({ onHome }: { onHome: () => void }) {
  return (
    <div
      style={{
        position: 'relative',
        zIndex: 10,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        color: T.ink,
        textAlign: 'center',
        padding: 24,
      }}
    >
      <h1 style={{ fontSize: 38, fontWeight: 800, margin: 0 }}>Page not found</h1>
      <p style={{ color: T.muted, margin: 0 }}>The page you requested does not exist.</p>
      <button
        type="button"
        onClick={onHome}
        style={{
          marginTop: 8,
          padding: '11px 20px',
          borderRadius: 999,
          border: 'none',
          background: T.wine,
          color: T.milk,
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        Back to menu
      </button>
    </div>
  );
}

/* ================================================================== */
/* Empty shells (NOT seed data) — used only so the public UI can render */
/* when the database is unreachable or genuinely empty.                */
/* ================================================================== */
const EMPTY_RESTAURANT_INFO: RestaurantInfo = {
  name: 'Namaste Siam Indian Kitchen',
  address: '',
  phone: '',
  openingHours: '',
  instagram: '',
  website: '',
  diningStyle: '',
  whatsappNumber: '',
  whatsappMessage: '',
  lineId: '',
  lineQrUrl: '',
  contactActiveChannel: 'disabled',
};

const EMPTY_ABOUT_INFO: AboutInfo = { story: [], highlights: [] };

const LOAD_TIMEOUT_MS = 12000;

function withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(
      () => reject(new Error(`${label} timed out after ${Math.round(LOAD_TIMEOUT_MS / 1000)}s`)),
      LOAD_TIMEOUT_MS
    );
    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        window.clearTimeout(timer);
        reject(err);
      }
    );
  });
}

function reasonText(reason: unknown): string {
  return reason instanceof Error ? reason.message : String(reason);
}

/* ================================================================== */
/* App                                                                 */
/* ================================================================== */
export default function App() {
  const [currentPath, setCurrentPath] = useState<string>(window.location.pathname);
  const [currentSearch, setCurrentSearch] = useState<string>(window.location.search);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
      setCurrentSearch(window.location.search);
    };
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function (...args) {
      originalPushState.apply(this, args as never);
      handleLocationChange();
    };
    window.history.replaceState = function (...args) {
      originalReplaceState.apply(this, args as never);
      handleLocationChange();
    };
    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  /* ----------------------------- data ----------------------------- */
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [restaurantInfo, setRestaurantInfo] = useState<RestaurantInfo | null>(null);
  const [aboutInfo, setAboutInfo] = useState<AboutInfo | null>(null);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    (async () => {
      const results = await Promise.allSettled([
        withTimeout(MenuService.getRestaurantInfo(), 'Restaurant info request'),
        withTimeout(MenuService.getAboutInfo(), 'About info request'),
        withTimeout(MenuService.getCategories(), 'Categories request'),
        withTimeout(MenuService.getDishes(), 'Dishes request'),
        withTimeout(MenuService.getGalleryItems(), 'Gallery request'),
      ]);
      if (!active) return;

      const [infoRes, aboutRes, catsRes, dishesRes, galleryRes] = results;
      const problems: string[] = [];

      // Restaurant info: fall back to an EMPTY shell (no seed content) so the
      // public UI still renders instead of hanging.
      if (infoRes.status === 'fulfilled' && infoRes.value) {
        setRestaurantInfo(infoRes.value);
      } else {
        setRestaurantInfo(EMPTY_RESTAURANT_INFO);
        if (infoRes.status === 'rejected') problems.push(reasonText(infoRes.reason));
      }

      if (aboutRes.status === 'fulfilled' && aboutRes.value) {
        setAboutInfo(aboutRes.value);
      } else {
        setAboutInfo(EMPTY_ABOUT_INFO);
        if (aboutRes.status === 'rejected') problems.push(reasonText(aboutRes.reason));
      }

      // Collections: ONLY database rows are ever shown. On failure we show
      // nothing rather than stale/static/deleted items.
      if (catsRes.status === 'fulfilled') setCategories(catsRes.value ?? []);
      else {
        setCategories([]);
        problems.push(reasonText(catsRes.reason));
      }

      if (dishesRes.status === 'fulfilled') setDishes(dishesRes.value ?? []);
      else {
        setDishes([]);
        problems.push(reasonText(dishesRes.reason));
      }

      if (galleryRes.status === 'fulfilled') setGallery(galleryRes.value ?? []);
      else {
        setGallery([]);
        problems.push(reasonText(galleryRes.reason));
      }

      if (problems.length) {
        console.error('Menu data load problems:', problems);
        setLoadError(Array.from(new Set(problems)).join(' | '));
      } else {
        setLoadError(null);
      }

      // Loading is ALWAYS finite: every branch above is reached after
      // Promise.allSettled, which cannot reject and cannot hang past the timeout.
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, []);

  /* ------------------------- realtime sync ------------------------ */
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const channel = supabase
      .channel('nsik-public-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'foods' }, async () => {
        try {
          setDishes(await MenuService.getDishes());
        } catch (err) {
          console.error(err);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, async () => {
        try {
          setCategories(await MenuService.getCategories());
        } catch (err) {
          console.error(err);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gallery' }, async () => {
        try {
          setGallery(await MenuService.getGalleryItems());
        } catch (err) {
          console.error(err);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'restaurant_info' }, async () => {
        try {
          setRestaurantInfo(await MenuService.getRestaurantInfo());
        } catch (err) {
          console.error(err);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'about_info' }, async () => {
        try {
          setAboutInfo(await MenuService.getAboutInfo());
        } catch (err) {
          console.error(err);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  /* ------------------------------ UI ------------------------------ */
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [selectedInfoType, setSelectedInfoType] =
    useState<'about' | 'contact' | 'privacy' | 'terms' | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedDish(null);
        setSelectedInfoType(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const activeDishes = useMemo(() => dishes.filter((d) => d.active !== false), [dishes]);

  const matchesQuery = useCallback(
    (d: Dish) => {
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      const ing = Array.isArray(d.ingredients) ? d.ingredients.join(' ') : '';
      return `${d.name} ${d.description} ${d.category} ${ing}`.toLowerCase().includes(q);
    },
    [searchQuery]
  );

  const inCategory = useCallback(
    (d: Dish) => activeCategory === 'all' || d.category === activeCategory,
    [activeCategory]
  );

  const todaysSpecial = useMemo(() => {
    const specials = activeDishes.filter((d) => d.todaySpecial);
    if (!specials.length) return null;
    return [...specials].sort(
      (a, b) => (a.display_order_today || 0) - (b.display_order_today || 0)
    )[0];
  }, [activeDishes]);

  const chefRecommendations = useMemo(
    () =>
      activeDishes
        .filter((d) => d.chefSpecial && inCategory(d) && matchesQuery(d))
        .sort((a, b) => (a.display_order_chef || 0) - (b.display_order_chef || 0)),
    [activeDishes, inCategory, matchesQuery]
  );

  const menuDishes = useMemo(
    () =>
      activeDishes
        .filter((d) => inCategory(d) && matchesQuery(d))
        .sort((a, b) => (a.display_order || 0) - (b.display_order || 0)),
    [activeDishes, inCategory, matchesQuery]
  );

  const popularDishes = useMemo(
    () =>
      activeDishes
        .filter((d) => d.bestseller && inCategory(d) && matchesQuery(d))
        .sort((a, b) => (a.display_order_popular || 0) - (b.display_order_popular || 0)),
    [activeDishes, inCategory, matchesQuery]
  );

  const favoriteDishes = useMemo(
    () =>
      activeDishes
        .filter((d) => d.customerFavorite && inCategory(d) && matchesQuery(d))
        .sort((a, b) => (a.display_order_favorite || 0) - (b.display_order_favorite || 0)),
    [activeDishes, inCategory, matchesQuery]
  );

  const sortedCategories = useMemo(
    () =>
      [...categories]
        .filter((c) => c.active !== false)
        .sort((a, b) => (a.display_order || 0) - (b.display_order || 0)),
    [categories]
  );

  const sortedGallery = useMemo(
    () =>
      [...gallery]
        .filter((g) => g.active !== false)
        .sort((a, b) => (a.display_order || 0) - (b.display_order || 0)),
    [gallery]
  );

  const handleLiveSearchClick = () => {
    if (searchInputRef.current) {
      setSearchQuery(searchInputRef.current.value);
      searchInputRef.current.focus();
    }
    document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToSpecials = useCallback(() => {
    const targets = ['todays-special', 'chef-choice', 'bestsellers', 'favorites', 'our-menu'];
    for (const id of targets) {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }
  }, []);

  /* --------------------------- persistence ------------------------ */
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

  const goHome = useCallback(() => {
    window.history.pushState({}, '', '/');
  }, []);

  /* ---------------------------- routing --------------------------- */
  const normalizedPath = currentPath.replace(/\/+$/, '') || '/';
  const isUnlockPath = normalizedPath === UNLOCK_PATH;
  const unlockKeyParam = new URLSearchParams(currentSearch).get('k') || '';
  const expectedKey = (import.meta.env.VITE_ADMIN_UNLOCK_KEY as string | undefined) || '';
  const unlockGranted = isUnlockPath && expectedKey.length > 0 && unlockKeyParam === expectedKey;

  if (isUnlockPath && !unlockGranted) {
    return (
      <>
        <Background />
        <NotFound onHome={goHome} />
      </>
    );
  }

  if (loading) {
    return (
      <>
        <Background />
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            color: T.wine,
          }}
        >
          <div>
            <p style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Namaste Siam Indian Kitchen</p>
            <p style={{ fontSize: 13, opacity: 0.75, marginTop: 6 }}>Loading menu…</p>
          </div>
        </div>
      </>
    );
  }

  if (unlockGranted) {
    return (
      <>
        <Background />
        {restaurantInfo && aboutInfo ? (
          <AdminGate
            dishes={dishes}
            categories={categories}
            restaurantInfo={restaurantInfo}
            aboutInfo={aboutInfo}
            gallery={gallery}
            onUpdateDishes={handleUpdateDishes}
            onUpdateCategories={handleUpdateCategories}
            onUpdateRestaurantInfo={handleUpdateRestaurantInfo}
            onUpdateAboutInfo={handleUpdateAboutInfo}
            onUpdateGallery={handleUpdateGallery}
            onExit={goHome}
          />
        ) : (
          <div
            style={{
              position: 'relative',
              zIndex: 10,
              minHeight: '100vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
              textAlign: 'center',
              color: T.ink,
            }}
          >
            <div style={{ maxWidth: 460 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 8px' }}>
                Admin unavailable
              </h1>
              <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.7 }}>
                Restaurant configuration could not be loaded from the database, so the dashboard
                cannot be opened.
                {loadError ? ` Details: ${loadError}` : ''}
              </p>
            </div>
          </div>
        )}
      </>
    );
  }

  if (normalizedPath !== '/' && normalizedPath !== '/index.html') {
    return (
      <>
        <Background />
        <NotFound onHome={goHome} />
      </>
    );
  }

  const info: RestaurantInfo = restaurantInfo ?? EMPTY_RESTAURANT_INFO;
  const about: AboutInfo = aboutInfo ?? EMPTY_ABOUT_INFO;

  const DataNotice = () =>
    loadError ? (
      <div
        role="alert"
        style={{
          position: 'relative',
          zIndex: 30,
          background: '#FDECEC',
          borderBottom: '1px solid #E9B4B4',
          color: '#7A1F1F',
          padding: '10px 16px',
          fontSize: 12.5,
          lineHeight: 1.6,
          textAlign: 'center',
        }}
      >
        <strong>Live menu data could not be loaded.</strong> The kitchen database is unreachable or
        not configured, so no dishes are shown. Details: {loadError}
      </div>
    ) : null;

  const sectionStyle: React.CSSProperties = {
    maxWidth: 1180,
    margin: '0 auto',
    padding: '52px 20px 0',
  };

  const dishGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: 18,
  };

  const cardStyle: React.CSSProperties = {
    background: T.paper,
    border: `1px solid ${T.line}`,
    borderRadius: 20,
    padding: 18,
    boxShadow: '0 14px 40px rgba(61,31,0,0.07)',
  };

  const SectionTitle = ({ lead, accent }: { lead: string; accent: string }) => (
    <div style={{ marginBottom: 22 }}>
      <span
        style={{
          fontSize: 10,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: T.amber,
          fontWeight: 800,
        }}
      >
        Namaste Siam
      </span>
      <h2 style={{ margin: '6px 0 0', fontSize: 30, fontWeight: 800, color: T.ink }}>
        {lead} <span style={{ color: T.wine }}>{accent}</span>
      </h2>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', position: 'relative', color: T.ink }}>
      <Background />
      <DataNotice />

      <div style={{ position: 'relative', zIndex: 10 }}>
        {/* HEADER */}
        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 40,
            backdropFilter: 'blur(10px)',
            background: 'rgba(253,248,241,0.86)',
            borderBottom: `1px solid ${T.line}`,
          }}
        >
          <nav
            style={{
              maxWidth: 1180,
              margin: '0 auto',
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ fontWeight: 800, fontSize: 18, color: T.wine, letterSpacing: '-0.01em' }}>
              Namaste Siam <span style={{ color: T.amber }}>Indian Kitchen</span>
            </div>
            <ul
              style={{
                display: 'flex',
                gap: 20,
                listStyle: 'none',
                margin: 0,
                padding: 0,
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              <li>
                <a href="#menu" style={{ color: T.wine, textDecoration: 'none' }}>
                  Menu
                </a>
              </li>
              <li>
                <button
                  type="button"
                  id="nav-specials"
                  onClick={scrollToSpecials}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    font: 'inherit',
                    color: T.wine,
                    cursor: 'pointer',
                  }}
                >
                  Specials
                </button>
              </li>
              {[
                ['#about', 'About'],
                ['#info', 'Info'],
                ['#gallery', 'Gallery'],
              ].map(([href, label]) => (
                <li key={href}>
                  <a href={href} style={{ color: T.wine, textDecoration: 'none' }}>
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </header>

        {/* HERO */}
        <section
          id="top"
          style={{
            ...sectionStyle,
            paddingTop: 56,
            display: 'grid',
            gridTemplateColumns: 'minmax(280px, 1.15fr) minmax(260px, 0.85fr)',
            gap: 34,
            alignItems: 'center',
          }}
        >
          <div>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 11,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                color: T.wine,
                background: 'rgba(224,138,43,0.12)',
                border: `1px solid ${T.line}`,
                borderRadius: 999,
                padding: '7px 14px',
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 999,
                  background: T.amber,
                  display: 'inline-block',
                }}
              />
              Premium dining experience
            </span>

            <h1
              style={{
                fontSize: 'clamp(34px, 5vw, 54px)',
                lineHeight: 1.05,
                fontWeight: 800,
                margin: '18px 0 12px',
                color: T.ink,
              }}
            >
              Experience <em style={{ color: T.wine }}>Authentic Flavours</em>
            </h1>
            <p style={{ fontSize: 15, color: T.muted, lineHeight: 1.75, maxWidth: 560, margin: 0 }}>
              Crafted fresh. Served with passion. Browse our chef-curated menu of Indian and Thai
              signatures, updated daily by our kitchen.
            </p>

            <div
              style={{
                display: 'flex',
                gap: 10,
                marginTop: 24,
                flexWrap: 'wrap',
                maxWidth: 560,
              }}
            >
              <input
                type="text"
                ref={searchInputRef}
                placeholder="Search dishes, ingredients, category…"
                aria-label="Search menu items"
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: '1 1 240px',
                  padding: '13px 16px',
                  borderRadius: 999,
                  border: `1px solid ${T.line}`,
                  background: T.paper,
                  color: T.ink,
                  fontSize: 14,
                }}
              />
              <button
                type="button"
                onClick={handleLiveSearchClick}
                style={{
                  padding: '13px 22px',
                  borderRadius: 999,
                  border: 'none',
                  background: T.wine,
                  color: T.milk,
                  fontWeight: 800,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Live menu search
              </button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 22 }}>
              {[
                '⭐ 4.8 Customer Rating',
                '🍽️ We Serve the best in taste',
                '🌿 Fresh Ingredients',
                '🏆 Chef Recommended',
              ].map((s) => (
                <span
                  key={s}
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: T.wine,
                    background: T.paper,
                    border: `1px solid ${T.line}`,
                    borderRadius: 999,
                    padding: '7px 13px',
                  }}
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          {todaysSpecial && (
            <div
              id="todays-special"
              role="button"
              tabIndex={0}
              onClick={() => setSelectedDish(todaysSpecial)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setSelectedDish(todaysSpecial);
              }}
              style={{ ...cardStyle, cursor: 'pointer', padding: 14 }}
              aria-label={`Today's special: ${todaysSpecial.name}`}
            >
              <img
                src={todaysSpecial.image}
                alt={todaysSpecial.name}
                loading="lazy"
                style={{
                  width: '100%',
                  height: 230,
                  objectFit: 'cover',
                  borderRadius: 14,
                  display: 'block',
                }}
              />
              <div style={{ padding: '14px 6px 4px' }}>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    color: T.amber,
                  }}
                >
                  Today&apos;s Special
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, marginTop: 6, color: T.ink }}>
                  {todaysSpecial.name}
                </div>
                <p
                  style={{
                    fontSize: 13,
                    color: T.muted,
                    lineHeight: 1.6,
                    margin: '6px 0 10px',
                  }}
                >
                  {todaysSpecial.description}
                </p>
                <div style={{ fontSize: 18, fontWeight: 800, color: T.wine }}>
                  ฿{todaysSpecial.priceTHB}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* CHEF RECOMMENDATIONS */}
        {chefRecommendations.length > 0 && (
          <section id="chef-choice" style={sectionStyle}>
            <SectionTitle lead="Chef" accent="Recommendations" />
            <div style={dishGridStyle}>
              {chefRecommendations.map((d) => (
                <DishCard
                  key={`chef-dish-${d.id}`}
                  dish={d}
                  idPrefix="chef"
                  onClick={() => setSelectedDish(d)}
                />
              ))}
            </div>
          </section>
        )}

        {/* CATEGORIES */}
        <section id="menu" style={sectionStyle}>
          <SectionTitle lead="Browse" accent="Menu Categories" />
          <div
            role="tablist"
            aria-label="Menu categories"
            style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}
          >
            {[{ id: 'all', label: 'All Dishes' }, ...sortedCategories.map((c) => ({ id: c.id, label: c.label || c.name }))].map(
              (c) => {
                const active = c.id === activeCategory;
                return (
                  <button
                    key={`cat-${c.id}`}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setActiveCategory(c.id)}
                    style={{
                      padding: '9px 17px',
                      borderRadius: 999,
                      fontSize: 12.5,
                      fontWeight: 800,
                      cursor: 'pointer',
                      border: `1px solid ${active ? T.wine : T.line}`,
                      background: active ? T.wine : T.paper,
                      color: active ? T.milk : T.wine,
                    }}
                  >
                    {c.label}
                  </button>
                );
              }
            )}
          </div>
        </section>

        {/* FULL MENU */}
        <section id="our-menu" style={{ ...sectionStyle, paddingTop: 34 }}>
          <SectionTitle lead="Our" accent="Menu" />
          <div style={dishGridStyle}>
            {menuDishes.length > 0 ? (
              menuDishes.map((d) => (
                <DishCard
                  key={`menu-dish-${d.id}`}
                  dish={d}
                  idPrefix="dish"
                  onClick={() => setSelectedDish(d)}
                />
              ))
            ) : (
              <p style={{ color: T.muted, padding: '20px 0' }}>
                No dishes match your search in this category.
              </p>
            )}
          </div>
        </section>

        {/* POPULAR */}
        {popularDishes.length > 0 && (
          <section id="bestsellers" style={{ ...sectionStyle, paddingTop: 34 }}>
            <SectionTitle lead="Popular" accent="Dishes" />
            <div style={dishGridStyle}>
              {popularDishes.map((d) => (
                <DishCard
                  key={`popular-dish-${d.id}`}
                  dish={d}
                  idPrefix="pop"
                  onClick={() => setSelectedDish(d)}
                />
              ))}
            </div>
          </section>
        )}

        {/* CUSTOMER FAVOURITES */}
        {favoriteDishes.length > 0 && (
          <section id="favorites" style={{ ...sectionStyle, paddingTop: 34 }}>
            <SectionTitle lead="Customer" accent="Favourites" />
            <div style={dishGridStyle}>
              {favoriteDishes.map((d) => (
                <DishCard
                  key={`fav-dish-${d.id}`}
                  dish={d}
                  idPrefix="fav"
                  onClick={() => setSelectedDish(d)}
                />
              ))}
            </div>
          </section>
        )}

        {/* ABOUT */}
        <section id="about" style={sectionStyle}>
          <SectionTitle lead="About" accent={info.name} />
          <div
            style={{
              ...cardStyle,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 24,
              padding: 26,
            }}
          >
            <div>
              {about.story.map((para, i) => (
                <p
                  key={`story-${i}`}
                  style={{
                    marginTop: i ? 12 : 0,
                    marginBottom: 0,
                    fontSize: 14,
                    lineHeight: 1.8,
                    color: T.muted,
                  }}
                >
                  {para}
                </p>
              ))}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignContent: 'flex-start' }}>
              {about.highlights.map((h, i) => (
                <span
                  key={`hl-${i}`}
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: T.wine,
                    background: 'rgba(224,138,43,0.1)',
                    border: `1px solid ${T.line}`,
                    borderRadius: 999,
                    padding: '8px 14px',
                  }}
                >
                  {h}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* RESTAURANT INFO */}
          <section id="info" style={sectionStyle}>
            <SectionTitle lead="Restaurant" accent="Information" />

            <div className="info-grid">
              {[
                ['📍 Address', info.address],
                ['📞 Phone', info.phone],
                ['🕒 Opening Hours', info.openingHours],
                ['📷 Instagram', info.instagram],
                ['🌐 Website', info.website],
                ['🍽️ Dining Style', info.diningStyle],
              ].map(([title, value]) => (
                <div key={title as string} className="info-card">
                  <h3>{title}</h3>

                  <p>
                    {value || 'Not available'}
                  </p>
                </div>
              ))}
            </div>
          </section>


        {/* GALLERY */}
        {sortedGallery.length > 0 && (
          <section id="gallery" style={sectionStyle}>
            <SectionTitle lead="Gallery" accent="& Ambience" />
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gridAutoRows: '180px',
                gap: 14,
              }}
            >
              {sortedGallery.map((g, i) => (
                <img
                  key={`gal-${g.id ?? i}`}
                  src={g.image}
                  alt={g.alt || g.title || 'Restaurant ambience'}
                  loading="lazy"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: 16,
                    border: `1px solid ${T.line}`,
                    gridRow: g.tall ? 'span 2' : 'span 1',
                  }}
                />
              ))}
            </div>
          </section>
        )}

        {/* FOOTER */}
        <footer
          style={{
            marginTop: 64,
            background: T.wineDeep,
            color: 'rgba(255,248,240,0.86)',
            padding: '46px 20px 22px',
          }}
        >
          <div
            style={{
              maxWidth: 1180,
              margin: '0 auto',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 28,
            }}
          >
            <div>
              <div style={{ fontSize: 19, fontWeight: 800, color: T.milk }}>
                {info.name}
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.75, marginTop: 10 }}>
                Premium restaurant menu experience with authentic flavours, elegant ambience and
                chef-crafted cuisine.
              </p>
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: T.milk }}>Restaurant</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: '12px 0 0', fontSize: 13 }}>
                <li style={{ marginBottom: 8 }}>📍 {info.address}</li>
                <li style={{ marginBottom: 8 }}>📞 {info.phone}</li>
                <li>🕒 {info.openingHours}</li>
              </ul>
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: T.milk }}>Links</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: '12px 0 0', fontSize: 13 }}>
                {(['about', 'contact', 'privacy', 'terms'] as const).map((t) => (
                  <li key={t} style={{ marginBottom: 8 }}>
                    <button
                      type="button"
                      onClick={() => setSelectedInfoType(t)}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        color: 'rgba(255,248,240,0.78)',
                        cursor: 'pointer',
                        fontSize: 13,
                      }}
                    >
                      {t === 'about'
                        ? 'About'
                        : t === 'contact'
                        ? 'Contact'
                        : t === 'privacy'
                        ? 'Privacy Policy'
                        : 'Terms'}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div
            style={{
              maxWidth: 1180,
              margin: '30px auto 0',
              paddingTop: 16,
              borderTop: '1px solid rgba(255,248,240,0.14)',
              fontSize: 12,
              opacity: 0.75,
            }}
          >
            © {new Date().getFullYear()} {info.name}. All rights reserved.
          </div>
        </footer>
      </div>

      {/* DISH MODAL */}
      {selectedDish && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={selectedDish.name}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedDish(null);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 90,
            background: 'rgba(43,26,14,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 18,
          }}
        >
          <div
            style={{
              background: T.paper,
              borderRadius: 22,
              maxWidth: 880,
              width: '100%',
              maxHeight: '88vh',
              overflowY: 'auto',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              boxShadow: '0 28px 70px rgba(43,26,14,0.35)',
            }}
          >
            <img
              src={selectedDish.image}
              alt={selectedDish.name}
              style={{ width: '100%', height: '100%', minHeight: 240, objectFit: 'cover' }}
            />
            <div style={{ padding: 26 }}>
              <h2 style={{ margin: 0, fontSize: 25, fontWeight: 800, color: T.ink }}>
                {selectedDish.name}
              </h2>
              <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.75, marginTop: 10 }}>
                {selectedDish.description}
              </p>
              <div style={{ fontSize: 21, fontWeight: 800, color: T.wine, marginTop: 12 }}>
                ฿{selectedDish.priceTHB}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    borderRadius: 999,
                    padding: '6px 12px',
                    color: selectedDish.type === 'veg' ? '#166534' : '#9B1C1C',
                    background:
                      selectedDish.type === 'veg' ? 'rgba(22,101,52,0.1)' : 'rgba(155,28,28,0.1)',
                  }}
                >
                  {selectedDish.type === 'veg' ? 'Veg' : 'Non-Veg'}
                </span>
                {selectedDish.spiceLevel && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      borderRadius: 999,
                      padding: '6px 12px',
                      color: T.wine,
                      background: 'rgba(224,138,43,0.12)',
                    }}
                  >
                    {selectedDish.spiceLevel}
                  </span>
                )}
              </div>
              {Array.isArray(selectedDish.ingredients) && selectedDish.ingredients.length > 0 && (
                <p style={{ fontSize: 12.5, color: T.muted, marginTop: 16, lineHeight: 1.7 }}>
                  <strong style={{ color: T.wine }}>Ingredients: </strong>
                  {selectedDish.ingredients.join(', ')}
                </p>
              )}
              <button
                type="button"
                onClick={() => setSelectedDish(null)}
                style={{
                  marginTop: 22,
                  padding: '11px 20px',
                  borderRadius: 999,
                  border: `1px solid ${T.line}`,
                  background: 'transparent',
                  color: T.wine,
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INFO MODAL */}
      {selectedInfoType && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedInfoType(null);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 90,
            background: 'rgba(43,26,14,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 18,
          }}
        >
          <div
            style={{
              background: T.paper,
              borderRadius: 22,
              maxWidth: 600,
              width: '100%',
              padding: 28,
              maxHeight: '85vh',
              overflowY: 'auto',
            }}
          >
            <h2 style={{ margin: 0, fontSize: 21, fontWeight: 800, color: T.ink }}>
              {selectedInfoType === 'about'
                ? `About ${info.name}`
                : selectedInfoType === 'contact'
                ? 'Contact Information'
                : selectedInfoType === 'privacy'
                ? 'Privacy Policy'
                : 'Terms of Service'}
            </h2>
            <p
              style={{
                whiteSpace: 'pre-wrap',
                fontSize: 14,
                lineHeight: 1.8,
                color: T.muted,
                marginTop: 14,
              }}
            >
              {selectedInfoType === 'about'
                ? 'A premium culinary destination celebrating authentic flavours, fresh ingredients and chef-crafted experiences.'
                : selectedInfoType === 'contact'
                ? `📍 ${info.address}\n\n📞 ${info.phone}\n\n🕒 ${info.openingHours}`
                : selectedInfoType === 'privacy'
                ? 'We value your privacy and use information only to improve your browsing experience. No ordering or reservation data is collected on this site.'
                : 'All menu items and prices are subject to availability and seasonal updates. This site is informational only.'}
            </p>
            <button
              type="button"
              onClick={() => setSelectedInfoType(null)}
              style={{
                marginTop: 20,
                padding: '11px 20px',
                borderRadius: 999,
                border: `1px solid ${T.line}`,
                background: 'transparent',
                color: T.wine,
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
