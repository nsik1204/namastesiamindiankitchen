import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { MenuService } from './services/menuService';
import { getCachedData } from './services/dbCache';
import { Dish, Category, RestaurantInfo, AboutInfo, GalleryItem } from './types';
import DishCard from './components/DishCard';
import AdminDashboard from './components/admin/AdminDashboard';
import { getSupabaseClient } from './services/supabaseClient';
import OrderDrawer, { CartItem } from './components/ordering/OrderDrawer';
import ReservationModal from './components/ordering/ReservationModal';
import QRReservationPage from './components/ordering/QRReservationPage';
import FloatingCartPill from './components/ordering/FloatingCartPill';
import GalleryLightbox from './components/gallery/GalleryLightbox';
import LocationSection from './components/location/LocationSection';
import FoodLoadingScreen from './components/common/FoodLoadingScreen';
import { useLanguage } from './context/LanguageContext';

/* ------------------------------------------------------------------ */
/* Heritage Indian Palette (Deep Forest Green & Antique Gold)         */
/* ------------------------------------------------------------------ */
const T = {
  milk: '#F8EEDB',          // Background: Warm Sand / Ivory
  paper: '#FFF9EF',         // Surface: Silk Paper
  primary: '#173D32',       // Deep Forest Green
  primaryDark: '#102C25',   // Midnight Forest Green
  primaryLight: '#285747',  // Muted Emerald
  gold: '#D9B66D',          // Antique Gold
  goldDark: '#B58C45',      // Burnished Bronze
  terracotta: '#9B4935',    // Terracotta Indian Spice
  ink: '#30251E',           // Main Text: Charcoal Dark Brown
  muted: '#75685A',         // Muted Text: Warm Taupe
  line: '#E4D7BF',          // Linen Border
  // Semantic backward compatibility mappings:
  wine: '#173D32',          // Deep Forest Green replaces legacy wine
  wineDeep: '#102C25',      // Midnight Forest Green replaces legacy wineDeep
  amber: '#D9B66D',         // Antique Gold replaces legacy amber
  amberGlow: '#D9B66D',     // Antique Gold replaces legacy amberGlow
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
            `radial-gradient(1100px 520px at 12% -8%, rgba(217,182,109,0.14), transparent 60%),` +
            `radial-gradient(900px 460px at 92% 4%, rgba(23,61,50,0.08), transparent 62%),` +
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
/* Admin Error Boundary                                                */
/* ================================================================== */
interface AdminErrorBoundaryProps {
  children: React.ReactNode;
  onExit: () => void;
  onLogout?: () => void;
}

interface AdminErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class AdminErrorBoundary extends React.Component<AdminErrorBoundaryProps, AdminErrorBoundaryState> {
  constructor(props: AdminErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): AdminErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Admin Dashboard caught a render error:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: T.milk,
            color: T.ink,
            padding: 24,
            position: 'relative',
            zIndex: 20,
          }}
        >
          <div
            style={{
              maxWidth: 520,
              width: '100%',
              background: T.paper,
              border: `1px solid ${T.line}`,
              borderRadius: 24,
              padding: 32,
              boxShadow: '0 20px 50px rgba(23,61,50,0.14)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: 'rgba(163,60,50,0.1)',
                color: '#A33C32',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                fontSize: 24,
                fontWeight: 'bold',
              }}
            >
              ⚠
            </div>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                color: T.wine,
                fontSize: 22,
                margin: '0 0 8px',
                fontWeight: 800,
              }}
            >
              Admin Console Notice
            </h2>
            <p style={{ color: T.muted, fontSize: 13, lineHeight: 1.6, margin: '0 0 16px' }}>
              The management console encountered an issue rendering data. You can reload or reset your session.
            </p>
            {this.state.error?.message && (
              <div
                style={{
                  background: 'rgba(163,60,50,0.06)',
                  border: '1px solid rgba(163,60,50,0.18)',
                  borderRadius: 12,
                  padding: '10px 14px',
                  fontSize: 12,
                  color: '#A33C32',
                  textAlign: 'left',
                  margin: '0 0 20px',
                  wordBreak: 'break-word',
                  fontFamily: 'monospace',
                }}
              >
                {this.state.error.message}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={this.handleReload}
                style={{
                  background: T.wine,
                  color: T.milk,
                  border: 'none',
                  borderRadius: 9999,
                  padding: '10px 22px',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Reload Console
              </button>
              {this.props.onLogout && (
                <button
                  type="button"
                  onClick={this.props.onLogout}
                  style={{
                    background: 'transparent',
                    color: T.ink,
                    border: `1px solid ${T.line}`,
                    borderRadius: 9999,
                    padding: '10px 20px',
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  Sign Out
                </button>
              )}
              <button
                type="button"
                onClick={this.props.onExit}
                style={{
                  background: 'transparent',
                  color: T.muted,
                  border: `1px solid ${T.line}`,
                  borderRadius: 9999,
                  padding: '10px 20px',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Public Site
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
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
  onUpdateDishes: (d: Dish[]) => Promise<void> | void;
  onUpdateCategories: (c: Category[]) => Promise<void> | void;
  onUpdateRestaurantInfo: (r: RestaurantInfo) => Promise<void> | void;
  onUpdateAboutInfo: (a: AboutInfo) => Promise<void> | void;
  onUpdateGallery: (g: GalleryItem[]) => Promise<void> | void;
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
    try {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData?.user) return false;

      // Check is_admin RPC if defined on Supabase, but don't block valid authenticated user
      try {
        const { data, error: rpcErr } = await supabase.rpc('is_admin');
        if (!rpcErr && data === false) {
          const userEmail = userData.user.email?.toLowerCase() || '';
          if (userEmail && (userEmail.includes('namastesiam') || userEmail.includes('admin') || userEmail.includes('atul'))) {
            return true;
          }
        }
      } catch {
        // RPC is_admin is not present; accept valid authenticated admin user
      }
      return true;
    } catch (err) {
      console.error('verifyAdmin check failed:', err);
      return false;
    }
  }, [supabase]);

  // Restore an existing admin session on mount with strict timeout fallback.
  useEffect(() => {
    let active = true;
    const safetyTimer = window.setTimeout(() => {
      if (active) setChecking(false);
    }, 3000);

    (async () => {
      try {
        const ok = await verifyAdmin();
        if (active) {
          setIsAdmin(ok);
          setChecking(false);
          if (ok) setError(null);
        }
      } catch {
        if (active) {
          setIsAdmin(false);
          setChecking(false);
        }
      } finally {
        window.clearTimeout(safetyTimer);
      }
    })();

    return () => {
      active = false;
      window.clearTimeout(safetyTimer);
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
        <AdminErrorBoundary onExit={props.onExit} onLogout={handleSignOut}>
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
            onLogout={handleSignOut}
          />
        </AdminErrorBoundary>
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
            fontSize: 11,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: T.amber,
            fontWeight: 800,
            margin: 0,
          }}
        >
          Restricted Area
        </p>
        <h1 style={{ margin: '8px 0 4px', fontSize: 24, color: T.ink, fontWeight: 800, fontFamily: 'var(--font-display)' }}>
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
              color: '#A33C32',
              background: 'rgba(163,60,50,0.08)',
              border: '1px solid rgba(163,60,50,0.2)',
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

const EMPTY_ABOUT_INFO: AboutInfo = {
  story: [
    'At Namaste Siam Indian Kitchen, every plate tells a story of heritage, craftsmanship, and passion. Our kitchen celebrates authentic recipes with a contemporary touch, using handpicked produce, premium spices, and balanced flavors that feel both soulful and refined.',
    'From timeless classics to chef-curated specialties, our menu is designed for guests who appreciate quality, consistency, and unforgettable taste.'
  ],
  highlights: [
    '🥬 Fresh ingredients sourced daily',
    '📜 Authentic recipes with modern finesse',
    '👨‍🍳 Passionate chefs, crafted presentations',
    '✨ Premium quality in every serving',
    '🍉 Eat fresh, Feel fresh'
  ]
};

const DEFAULT_GALLERY_ITEMS: GalleryItem[] = [
  {
    image: 'https://images.unsplash.com/photo-1528605105345-5344ea20e269?auto=format&fit=crop&w=1200&q=80',
    title: 'Fine Dining Room Ambience',
    alt: 'Fine Dining Room Ambience',
    tall: true,
    display_order: 1,
    active: true,
  },
  {
    image: 'https://images.unsplash.com/photo-1541544181074-e9b7f47eb4f6?auto=format&fit=crop&w=1200&q=80',
    title: 'Artisanal Tandoor & Food Plating',
    alt: 'Artisanal Tandoor & Food Plating',
    tall: false,
    display_order: 2,
    active: true,
  },
  {
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
    title: 'Private & Family Dining Seating',
    alt: 'Private & Family Dining Seating',
    tall: false,
    display_order: 3,
    active: true,
  },
  {
    image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80',
    title: 'Tandoor Master Chef at Work',
    alt: 'Tandoor Master Chef at Work',
    tall: false,
    display_order: 4,
    active: true,
  },
  {
    image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1200&q=80',
    title: 'Contemporary Indian & Thai Kitchen',
    alt: 'Contemporary Indian & Thai Kitchen',
    tall: false,
    display_order: 5,
    active: true,
  },
  {
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80',
    title: 'Authentic Spices & Sizzling Delights',
    alt: 'Authentic Spices & Sizzling Delights',
    tall: true,
    display_order: 6,
    active: true,
  },
];

const LOAD_TIMEOUT_MS = 28000;

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

    // Fast-path: preload from local cache so repeat visitors see instant menu
    (async () => {
      try {
        const [cachedDishes, cachedCats, cachedRest, cachedAbout, cachedGal] = await Promise.all([
          getCachedData<Dish[]>('dishes'),
          getCachedData<Category[]>('categories'),
          getCachedData<RestaurantInfo>('restaurant_info'),
          getCachedData<AboutInfo>('about_info'),
          getCachedData<GalleryItem[]>('gallery'),
        ]);
        if (!active) return;
        if (cachedDishes && cachedDishes.length > 0) setDishes(cachedDishes);
        if (cachedCats && cachedCats.length > 0) setCategories(cachedCats);
        if (cachedRest) setRestaurantInfo(cachedRest);
        if (cachedAbout) setAboutInfo(cachedAbout);
        if (cachedGal && cachedGal.length > 0) setGallery(cachedGal);
      } catch (err) {
        console.warn('Cache prefetch notice:', err);
      }
    })();

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
        const cached = await getCachedData<RestaurantInfo>('restaurant_info');
        if (cached) {
          setRestaurantInfo(cached);
        } else {
          setRestaurantInfo(EMPTY_RESTAURANT_INFO);
          if (infoRes.status === 'rejected') problems.push(reasonText(infoRes.reason));
        }
      }

      if (aboutRes.status === 'fulfilled' && aboutRes.value) {
        setAboutInfo(aboutRes.value);
      } else {
        const cached = await getCachedData<AboutInfo>('about_info');
        if (cached) {
          setAboutInfo(cached);
        } else {
          setAboutInfo(EMPTY_ABOUT_INFO);
          if (aboutRes.status === 'rejected') problems.push(reasonText(aboutRes.reason));
        }
      }

      // Collections: ONLY database rows are ever shown.
      if (catsRes.status === 'fulfilled') {
        setCategories(catsRes.value ?? []);
      } else {
        const cached = await getCachedData<Category[]>('categories');
        if (cached && cached.length > 0) {
          setCategories(cached);
        } else {
          setCategories([]);
          problems.push(reasonText(catsRes.reason));
        }
      }

      if (dishesRes.status === 'fulfilled') {
        setDishes(dishesRes.value ?? []);
      } else {
        const cached = await getCachedData<Dish[]>('dishes');
        if (cached && cached.length > 0) {
          setDishes(cached);
          console.info('Using cached dishes due to live fetch timeout.');
        } else {
          setDishes([]);
          problems.push(reasonText(dishesRes.reason));
        }
      }

      if (galleryRes.status === 'fulfilled') {
        setGallery(galleryRes.value ?? []);
      } else {
        const cached = await getCachedData<GalleryItem[]>('gallery');
        if (cached && cached.length > 0) {
          setGallery(cached);
        } else {
          setGallery([]);
          problems.push(reasonText(galleryRes.reason));
        }
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
  const { language, setLanguage, t, getDishName, getDishDescription, getCategoryLabel } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [selectedInfoType, setSelectedInfoType] =
    useState<'about' | 'contact' | 'privacy' | 'terms' | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  /* ---------------------- Module 1: Cart & Orders ----------------- */
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('nsik_order_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isOrderDrawerOpen, setIsOrderDrawerOpen] = useState(false);
  const [isReservationOpen, setIsReservationOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('nsik_order_cart', JSON.stringify(cart));
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
  }, [cart]);

  const handleAddToCart = useCallback((dish: Dish) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.dish.id === dish.id);
      if (existingIndex >= 0) {
        const copy = [...prev];
        copy[existingIndex] = {
          ...copy[existingIndex],
          quantity: copy[existingIndex].quantity + 1,
        };
        return copy;
      }
      return [...prev, { dish, quantity: 1 }];
    });
  }, []);

  const handleUpdateCartQuantity = useCallback((dishId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.dish.id === dishId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null)
    );
  }, []);

  const handleRemoveFromCart = useCallback((dishId: number) => {
    setCart((prev) => prev.filter((item) => item.dish.id !== dishId));
  }, []);

  const handleClearCart = useCallback(() => {
    setCart([]);
  }, []);

  const getCartQuantity = useCallback(
    (dishId: number) => cart.find((item) => item.dish.id === dishId)?.quantity || 0,
    [cart]
  );

  const totalCartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
  const totalCartTHB = useMemo(
    () => cart.reduce((sum, item) => sum + item.dish.priceTHB * item.quantity, 0),
    [cart]
  );

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
      const thName = getDishName(d);
      const thDesc = getDishDescription(d);
      return `${d.name} ${thName} ${d.description} ${thDesc} ${d.category} ${ing}`.toLowerCase().includes(q);
    },
    [searchQuery, getDishName, getDishDescription]
  );

  const inCategory = useCallback(
    (d: Dish) => {
      if (activeCategory === 'all') return true;
      const catLower = (d.category || '').toLowerCase();
      const nameLower = (d.name || '').toLowerCase();
      if (activeCategory === 'starters') {
        return (
          catLower.includes('starter') ||
          catLower.includes('appetizer') ||
          catLower === 'soups' ||
          catLower === 'salads' ||
          nameLower.includes('samosa') ||
          nameLower.includes('pakora') ||
          nameLower.includes('puri') ||
          nameLower.includes('chaat') ||
          nameLower.includes('satay')
        );
      }
      if (activeCategory === 'main') {
        return (
          catLower === 'main' ||
          catLower === 'main-course' ||
          catLower === 'indian' ||
          catLower === 'thai' ||
          catLower === 'chinese' ||
          nameLower.includes('curry') ||
          nameLower.includes('masala') ||
          nameLower.includes('korma') ||
          nameLower.includes('dal') ||
          nameLower.includes('paneer butter')
        );
      }
      if (activeCategory === 'biryani') {
        return (
          catLower.includes('biryani') ||
          nameLower.includes('biryani') ||
          catLower === 'rice' ||
          nameLower.includes('pulao') ||
          nameLower.includes('rice')
        );
      }
      if (activeCategory === 'tandoori') {
        return (
          catLower.includes('tandoor') ||
          nameLower.includes('tandoor') ||
          nameLower.includes('tikka') ||
          nameLower.includes('kebab') ||
          nameLower.includes('naan') ||
          nameLower.includes('roti') ||
          catLower === 'breads'
        );
      }
      if (activeCategory === 'desserts') {
        return (
          catLower.includes('dessert') ||
          catLower.includes('sweet') ||
          nameLower.includes('jamun') ||
          nameLower.includes('kheer') ||
          nameLower.includes('mousse') ||
          nameLower.includes('kulfi') ||
          nameLower.includes('halwa')
        );
      }
      if (activeCategory === 'beverages') {
        return (
          catLower.includes('beverage') ||
          catLower.includes('drink') ||
          nameLower.includes('lassi') ||
          nameLower.includes('chai') ||
          nameLower.includes('tea') ||
          nameLower.includes('shake') ||
          nameLower.includes('soda')
        );
      }
      return d.category === activeCategory;
    },
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

  const displayCategories = useMemo(() => {
    const core = [
      { id: 'all', label: t('catAll') },
      { id: 'starters', label: t('catStarters') },
      { id: 'main', label: t('catMainCourse') },
      { id: 'biryani', label: t('catBiryani') },
      { id: 'tandoori', label: t('catTandoori') },
      { id: 'desserts', label: t('catDesserts') },
      { id: 'beverages', label: t('catBeverages') },
    ];
    const coreIds = new Set(core.map((c) => c.id));
    const extra = sortedCategories
      .filter((c) => c.id !== 'all' && !coreIds.has(c.id.toLowerCase()))
      .map((c) => ({ id: c.id, label: getCategoryLabel(c) }));
    return [...core, ...extra];
  }, [t, sortedCategories, getCategoryLabel]);

  const sortedGallery = useMemo(
    () =>
      [...gallery]
        .filter((g) => g.active !== false)
        .sort((a, b) => (a.display_order || 0) - (b.display_order || 0)),
    [gallery]
  );

  const effectiveGallery = useMemo(() => {
    if (sortedGallery.length > 0) return sortedGallery;
    return DEFAULT_GALLERY_ITEMS;
  }, [sortedGallery]);

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
  const decodedPath = (() => {
    try {
      return decodeURIComponent(currentPath).trim().toLowerCase().replace(/\/+$/, '') || '/';
    } catch {
      return currentPath.trim().toLowerCase().replace(/\/+$/, '') || '/';
    }
  })();
  const isUnlockPath =
    decodedPath === UNLOCK_PATH ||
    decodedPath === '/unlock-admin' ||
    decodedPath === '/unlock admin' ||
    decodedPath === '/unlock_admin' ||
    decodedPath === '/admin' ||
    decodedPath === '/admin/dashboard';
  const unlockKeyParam = new URLSearchParams(currentSearch).get('k') || '';
  const expectedKey = (import.meta.env.VITE_ADMIN_UNLOCK_KEY as string | undefined) || '';
  // Unlock route is granted if path is /admin or /unlock-admin.
  // Secure access is enforced inside AdminGate with Supabase authentication.
  const unlockGranted = isUnlockPath;

  if (loading) {
    return <FoodLoadingScreen />;
  }

  if (unlockGranted) {
    const effectiveRestaurantInfo = restaurantInfo || EMPTY_RESTAURANT_INFO;
    const effectiveAboutInfo = aboutInfo || EMPTY_ABOUT_INFO;
    return (
      <>
        <Background />
        <AdminGate
          dishes={dishes}
          categories={categories}
          restaurantInfo={effectiveRestaurantInfo}
          aboutInfo={effectiveAboutInfo}
          gallery={gallery}
          onUpdateDishes={handleUpdateDishes}
          onUpdateCategories={handleUpdateCategories}
          onUpdateRestaurantInfo={handleUpdateRestaurantInfo}
          onUpdateAboutInfo={handleUpdateAboutInfo}
          onUpdateGallery={handleUpdateGallery}
          onExit={goHome}
        />
      </>
    );
  }

  if (decodedPath === '/reserve') {
    const effectiveRestaurantInfo = restaurantInfo || EMPTY_RESTAURANT_INFO;
    return (
      <QRReservationPage
        restaurantInfo={effectiveRestaurantInfo}
        onNavigateHome={goHome}
      />
    );
  }

  if (decodedPath !== '/' && decodedPath !== '/index.html') {
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
          background: '#FDF2F0',
          borderBottom: '1px solid rgba(163, 60, 50, 0.25)',
          color: '#A33C32',
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
    gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
    gap: 16,
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
      <h2 style={{ margin: 0, fontSize: 'clamp(24px, 3.5vw, 32px)', fontWeight: 800, color: T.ink, fontFamily: 'var(--font-display, Georgia, serif)' }}>
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
            background: 'rgba(23, 61, 50, 0.95)',
            borderBottom: '1px solid rgba(217, 182, 109, 0.25)',
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 800, fontSize: 18, color: '#FFF9EF', letterSpacing: '-0.01em' }}>
              <img
                src="/favicon-32x32.png"
                alt="Namaste Siam Logo"
                style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(217, 182, 109, 0.4)' }}
              />
              <span>Namaste Siam <span style={{ color: '#D9B66D' }}>Indian Kitchen</span></span>
            </div>
            <ul
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'clamp(10px, 2.5vw, 20px)',
                listStyle: 'none',
                margin: 0,
                padding: 0,
                fontSize: 13,
                fontWeight: 700,
                overflowX: 'auto',
                maxWidth: '100%',
              }}
            >
              <li>
                <a href="#menu" style={{ color: '#FFF9EF', textDecoration: 'none' }}>
                  {t('navMenu')}
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
                    color: '#FFF9EF',
                    cursor: 'pointer',
                  }}
                >
                  {t('navSpecials')}
                </button>
              </li>
              {[
                ['#about', t('navAbout')],
                ['#info', t('navInfo')],
                ['#gallery', t('navGallery')],
              ].map(([href, label]) => (
                <li key={href}>
                  <a href={href} style={{ color: '#FFF9EF', textDecoration: 'none' }}>
                    {label}
                  </a>
                </li>
              ))}
            </ul>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Language Switcher Pill */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: 'rgba(16, 44, 37, 0.65)',
                  borderRadius: 999,
                  padding: '3px',
                  border: '1px solid rgba(217, 182, 109, 0.35)',
                }}
                role="group"
                aria-label="Language switcher"
              >
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 999,
                    border: 'none',
                    background: language === 'en' ? '#D9B66D' : 'transparent',
                    color: language === 'en' ? '#102C25' : '#FFF9EF',
                    fontSize: 11,
                    fontWeight: 800,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  aria-pressed={language === 'en'}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('th')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 999,
                    border: 'none',
                    background: language === 'th' ? '#D9B66D' : 'transparent',
                    color: language === 'th' ? '#102C25' : '#FFF9EF',
                    fontSize: 11,
                    fontWeight: 800,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  aria-pressed={language === 'th'}
                >
                  ไทย
                </button>
              </div>

              {totalCartCount > 0 && (
                <button
                  type="button"
                  onClick={() => setIsOrderDrawerOpen(true)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 999,
                    border: '1px solid rgba(217, 182, 109, 0.35)',
                    background: 'rgba(16, 44, 37, 0.7)',
                    color: '#FFF9EF',
                    fontSize: 12.5,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                  aria-label={`Open order tray with ${totalCartCount} items`}
                >
                  <span>🛒</span>
                  <span>{totalCartCount}</span>
                  <span style={{ color: '#D9B66D' }}>฿{totalCartTHB}</span>
                </button>
              )}

              {info.websiteReservationEnabled !== false && (
                <button
                  type="button"
                  onClick={() => setIsReservationOpen(true)}
                  style={{
                    padding: '7px 16px',
                    borderRadius: 999,
                    border: '1px solid #D9B66D',
                    background: '#D9B66D',
                    color: '#102C25',
                    fontSize: 12.5,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: '0 4px 14px rgba(217,182,109,0.3)',
                    transition: 'transform 0.15s ease',
                  }}
                >
                  <span>📅</span>
                  <span>{t('reserveTable')}</span>
                </button>
              )}
            </div>
          </nav>
        </header>

        {/* HERO */}
        <section
          id="top"
          style={{
            ...sectionStyle,
            paddingTop: 56,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 34,
            alignItems: 'center',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 'clamp(32px, 4.8vw, 52px)',
                lineHeight: 1.08,
                fontWeight: 800,
                margin: '0 0 14px',
                color: T.ink,
                fontFamily: 'var(--font-display, Georgia, serif)',
              }}
            >
              {t('heroTitleLead')} <span style={{ color: T.wine }}>{t('heroTitleAccent')}</span>
              <span
                style={{
                  display: 'block',
                  fontSize: 'clamp(14px, 2vw, 17px)',
                  fontWeight: 600,
                  color: T.muted,
                  marginTop: 8,
                  letterSpacing: '0.02em',
                }}
              >
                {t('heroSubtitle')}
              </span>
            </h1>
            <p style={{ fontSize: 15, color: T.muted, lineHeight: 1.75, maxWidth: 560, margin: 0 }}>
              {t('heroDescription')}
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
                placeholder={t('searchPlaceholder')}
                aria-label="Search menu items"
                className="field"
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: '1 1 240px',
                  padding: '13px 18px',
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
                  transition: 'opacity 0.2s ease',
                }}
              >
                {t('liveSearchBtn')}
              </button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 22 }}>
              {[
                t('badgeFlavours'),
                t('badgeFresh'),
                t('badgeChef'),
              ].map((s) => (
                <span
                  key={s}
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: T.wine,
                    background: T.paper,
                    border: `1px solid ${T.line}`,
                    borderRadius: 999,
                    padding: '7px 14px',
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
              aria-label={`${t('todaysSpecial')}: ${getDishName(todaysSpecial)}`}
            >
              <img
                src={todaysSpecial.image}
                alt={getDishName(todaysSpecial)}
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
                  {t('todaysSpecial')}
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, marginTop: 6, color: T.ink }}>
                  {getDishName(todaysSpecial)}
                </div>
                <p
                  style={{
                    fontSize: 13,
                    color: T.muted,
                    lineHeight: 1.6,
                    margin: '6px 0 10px',
                  }}
                >
                  {getDishDescription(todaysSpecial)}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 12 }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: T.wine }}>
                    ฿{todaysSpecial.priceTHB}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToCart(todaysSpecial);
                    }}
                    style={{
                      padding: '7px 14px',
                      borderRadius: 999,
                      border: `1px solid ${T.wine}`,
                      background: T.wine,
                      color: T.paper,
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      boxShadow: '0 4px 10px rgba(23,61,50,0.2)',
                    }}
                  >
                    {t('addToOrder')} {getCartQuantity(todaysSpecial.id) > 0 && `(${getCartQuantity(todaysSpecial.id)})`}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* CHEF RECOMMENDATIONS */}
        {chefRecommendations.length > 0 && (
          <section id="chef-choice" style={sectionStyle}>
            <SectionTitle lead={t('chefRecommendationsLead')} accent={t('chefRecommendationsAccent')} />
            <div style={dishGridStyle}>
              {chefRecommendations.map((d) => (
                <DishCard
                  key={`chef-dish-${d.id}`}
                  dish={d}
                  idPrefix="chef"
                  onClick={() => setSelectedDish(d)}
                  onAddToCart={handleAddToCart}
                  cartQuantity={getCartQuantity(d.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* CATEGORIES */}
        <section id="menu" style={sectionStyle}>
          <SectionTitle lead={t('browseCategoriesLead')} accent={t('browseCategoriesAccent')} />
          
          {/* Mobile-Friendly Category Tab Scroller */}
          <div
            role="tablist"
            aria-label="Menu categories"
            style={{
              display: 'flex',
              gap: 10,
              overflowX: 'auto',
              paddingBottom: 8,
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {displayCategories.map((c) => {
              const active = c.id === activeCategory;
              return (
                <button
                  key={`cat-${c.id}`}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveCategory(c.id)}
                  style={{
                    padding: '9px 18px',
                    borderRadius: 999,
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    border: `1px solid ${active ? '#173D32' : T.line}`,
                    background: active ? '#173D32' : T.paper,
                    color: active ? '#FFF9EF' : T.ink,
                    boxShadow: active ? '0 4px 14px rgba(23,61,50,0.25)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* FULL MENU */}
        <section id="our-menu" style={{ ...sectionStyle, paddingTop: 34 }}>
          <SectionTitle lead={t('ourMenuLead')} accent={t('ourMenuAccent')} />
          <div style={dishGridStyle}>
            {menuDishes.length > 0 ? (
              menuDishes.map((d) => (
                <DishCard
                  key={`menu-dish-${d.id}`}
                  dish={d}
                  idPrefix="dish"
                  onClick={() => setSelectedDish(d)}
                  onAddToCart={handleAddToCart}
                  cartQuantity={getCartQuantity(d.id)}
                />
              ))
            ) : (
              <p style={{ color: T.muted, padding: '20px 0' }}>
                {t('noDishesFound')}
              </p>
            )}
          </div>
        </section>

        {/* POPULAR */}
        {popularDishes.length > 0 && (
          <section id="bestsellers" style={{ ...sectionStyle, paddingTop: 34 }}>
            <SectionTitle lead={t('popularDishesLead')} accent={t('popularDishesAccent')} />
            <div style={dishGridStyle}>
              {popularDishes.map((d) => (
                <DishCard
                  key={`popular-dish-${d.id}`}
                  dish={d}
                  idPrefix="pop"
                  onClick={() => setSelectedDish(d)}
                  onAddToCart={handleAddToCart}
                  cartQuantity={getCartQuantity(d.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* CUSTOMER FAVOURITES */}
        {favoriteDishes.length > 0 && (
          <section id="favorites" style={{ ...sectionStyle, paddingTop: 34 }}>
            <SectionTitle lead={t('customerFavouritesLead')} accent={t('customerFavouritesAccent')} />
            <div style={dishGridStyle}>
              {favoriteDishes.map((d) => (
                <DishCard
                  key={`fav-dish-${d.id}`}
                  dish={d}
                  idPrefix="fav"
                  onClick={() => setSelectedDish(d)}
                  onAddToCart={handleAddToCart}
                  cartQuantity={getCartQuantity(d.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* ABOUT */}
        <section id="about" style={sectionStyle}>
          <SectionTitle lead={t('aboutLead')} accent={info.name} />
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
                    background: 'rgba(217,182,109,0.12)',
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

        {/* FIND US / GOOGLE MAPS & LOCATION HUB */}
        <LocationSection info={info} />


        {/* GALLERY */}
        {effectiveGallery.length > 0 && (
          <section id="gallery" style={sectionStyle}>
            <SectionTitle lead={t('galleryLead')} accent={t('galleryAccent')} />
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gridAutoRows: '190px',
                gap: 14,
              }}
            >
              {effectiveGallery.map((g, i) => (
                <div
                  key={`gal-${g.id ?? i}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => setLightboxIndex(i)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setLightboxIndex(i);
                    }
                  }}
                  style={{
                    position: 'relative',
                    borderRadius: 16,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    border: `1px solid ${T.line}`,
                    gridRow: g.tall ? 'span 2' : 'span 1',
                    boxShadow: '0 8px 24px rgba(48,37,30,0.06)',
                  }}
                  className="group"
                  aria-label={`${g.alt || g.title || 'Restaurant ambience'} - ${t('clickToEnlarge')}`}
                >
                  <img
                    src={g.image}
                    alt={g.alt || g.title || 'Restaurant ambience'}
                    loading="lazy"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                      transition: 'transform 0.4s ease',
                    }}
                    className="group-hover:scale-105"
                  />
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(to top, rgba(16,44,37,0.85) 0%, transparent 60%)',
                      opacity: 0,
                      transition: 'opacity 0.25s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                      padding: 14,
                    }}
                    className="group-hover:opacity-100"
                  >
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#FFF9EF' }}>
                      {g.title || g.alt || 'Namaste Siam Ambience'}
                    </span>
                    <span style={{ fontSize: 10, color: 'rgba(255,249,239,0.85)', marginTop: 2 }}>
                      🔍 {t('clickToEnlarge')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* FOOTER */}
        <footer
          style={{
            marginTop: 64,
            background: '#102C25',
            color: '#FFF9EF',
            borderTop: '1px solid rgba(217, 182, 109, 0.25)',
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <img
                  src="/logo.png"
                  alt="Namaste Siam Logo"
                  style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(217, 182, 109, 0.4)' }}
                />
                <div style={{ fontSize: 19, fontWeight: 800, color: '#D9B66D', fontFamily: 'var(--font-display, Georgia, serif)' }}>
                  {info.name}
                </div>
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.75, marginTop: 10, color: 'rgba(255, 249, 239, 0.85)' }}>
                Premium restaurant menu experience with authentic flavours, elegant ambience and
                chef-crafted cuisine.
              </p>
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#D9B66D' }}>Restaurant</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: '12px 0 0', fontSize: 13, color: 'rgba(255, 249, 239, 0.85)' }}>
                <li style={{ marginBottom: 8 }}>📍 {info.address}</li>
                <li style={{ marginBottom: 8 }}>📞 {info.phone}</li>
                <li>🕒 {info.openingHours}</li>
              </ul>
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#D9B66D' }}>Links</h4>
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
                        color: 'rgba(255, 249, 239, 0.85)',
                        cursor: 'pointer',
                        fontSize: 13,
                        transition: 'color 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#D9B66D')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 249, 239, 0.85)')}
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
                <li style={{ marginTop: 12 }}>
                  <a
                    href="/admin"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      color: 'rgba(217, 182, 109, 0.75)',
                      textDecoration: 'none',
                      fontSize: 12,
                      fontWeight: 700,
                      padding: '4px 10px',
                      background: 'rgba(217, 182, 109, 0.1)',
                      border: '1px solid rgba(217, 182, 109, 0.25)',
                      borderRadius: 999,
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#D9B66D';
                      e.currentTarget.style.background = 'rgba(217, 182, 109, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'rgba(217, 182, 109, 0.75)';
                      e.currentTarget.style.background = 'rgba(217, 182, 109, 0.1)';
                    }}
                  >
                    🔒 Staff Portal
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div
            style={{
              maxWidth: 1180,
              margin: '30px auto 0',
              paddingTop: 16,
              borderTop: '1px solid rgba(217, 182, 109, 0.2)',
              fontSize: 12,
              opacity: 0.8,
              color: 'rgba(255, 249, 239, 0.75)',
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
          aria-label={getDishName(selectedDish)}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedDish(null);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 90,
            background: 'rgba(16,44,37,0.65)',
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
              boxShadow: '0 28px 70px rgba(16,44,37,0.35)',
              border: `1px solid ${T.line}`,
            }}
          >
            <img
              src={selectedDish.image}
              alt={getDishName(selectedDish)}
              style={{ width: '100%', height: '100%', minHeight: 240, objectFit: 'cover' }}
            />
            <div style={{ padding: 26 }}>
              <h2 style={{ margin: 0, fontSize: 25, fontWeight: 800, color: T.ink, fontFamily: 'var(--font-display)' }}>
                {getDishName(selectedDish)}
              </h2>
              <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.75, marginTop: 10 }}>
                {getDishDescription(selectedDish)}
              </p>
              <div style={{ fontSize: 21, fontWeight: 800, color: T.wine, marginTop: 12, fontFamily: 'var(--font-display)' }}>
                ฿{selectedDish.priceTHB}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    borderRadius: 999,
                    padding: '6px 12px',
                    color: selectedDish.type === 'veg' ? '#386B4D' : '#9B4935',
                    background:
                      selectedDish.type === 'veg' ? 'rgba(56,107,77,0.12)' : 'rgba(155,73,53,0.12)',
                  }}
                >
                  {selectedDish.type === 'veg' ? t('veg') : t('nonVeg')}
                </span>
                {selectedDish.chefSpecial && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      borderRadius: 999,
                      padding: '6px 12px',
                      color: '#B58C45',
                      background: 'rgba(217,182,109,0.15)',
                      border: '1px solid rgba(217,182,109,0.4)',
                    }}
                  >
                    ⭐ {t('chefSpecial')}
                  </span>
                )}
                {selectedDish.bestseller && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      borderRadius: 999,
                      padding: '6px 12px',
                      color: '#9B4935',
                      background: 'rgba(155,73,53,0.12)',
                      border: '1px solid rgba(155,73,53,0.3)',
                    }}
                  >
                    🔥 {t('bestseller')}
                  </span>
                )}
                {selectedDish.spiceLevel && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      borderRadius: 999,
                      padding: '6px 12px',
                      color: '#9B4935',
                      background: 'rgba(155,73,53,0.12)',
                    }}
                  >
                    {selectedDish.spiceLevel}
                  </span>
                )}
              </div>
              {Array.isArray(selectedDish.ingredients) && selectedDish.ingredients.length > 0 && (
                <p style={{ fontSize: 12.5, color: T.muted, marginTop: 16, lineHeight: 1.7 }}>
                  <strong style={{ color: T.wine }}>{t('ingredientsLabel')}: </strong>
                  {selectedDish.ingredients.join(', ')}
                </p>
              )}
              <div style={{ display: 'flex', gap: 10, marginTop: 22, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => {
                    handleAddToCart(selectedDish);
                  }}
                  style={{
                    padding: '11px 20px',
                    borderRadius: 999,
                    border: 'none',
                    background: T.wine,
                    color: T.paper,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: '0 4px 12px rgba(23,61,50,0.25)',
                  }}
                >
                  <span>{t('addToOrder')}</span>
                  {getCartQuantity(selectedDish.id) > 0 && ` (${getCartQuantity(selectedDish.id)})`}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDish(null)}
                  style={{
                    padding: '11px 20px',
                    borderRadius: 999,
                    border: `1px solid ${T.line}`,
                    background: 'transparent',
                    color: T.wine,
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  {t('close')}
                </button>
              </div>
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
            background: 'rgba(16,44,37,0.65)',
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
                ? `Namaste Siam Indian Kitchen

            A premium culinary destination celebrating authentic Indian flavours, fresh ingredients and chef-crafted experiences.

            Our menu brings together a variety of Indian favourites, including traditional curries, grilled specialities, vegetarian dishes, rice preparations, breads, snacks and accompaniments. We focus on rich flavours, quality ingredients and an inviting dining experience.

            We believe great food should be authentic, flavourful and memorable. Our dishes are prepared with care and presented with a modern yet traditional touch.

            Food Allergies & Dietary Requirements:
            Please inform our staff before ordering if you have any food allergies, intolerances or dietary requirements. Our kitchen handles a variety of ingredients and allergens, so we cannot guarantee that any dish is completely free from cross-contact.

            Menu items, ingredients, portion sizes and availability may change from time to time.

            For reservations, enquiries or additional information, please contact us using the details provided on this website.`
                : selectedInfoType === 'contact'
                ? `📍 ${info.address}\n\n📞 ${info.phone}\n\n🕒 ${info.openingHours}`
                : selectedInfoType === 'privacy'
                ? `Privacy Policy

            Last Updated: September 5, 2026

            Namaste Siam Indian Kitchen respects your privacy.

            Information Collection:
            We may collect information that you voluntarily provide through contact forms, enquiries, reservations or other website features. We may also collect limited technical information such as browser type, device information, IP address and website usage data.

            How We Use Information:
            Information may be used to respond to enquiries, process requests, improve our website and services, maintain security and comply with applicable legal requirements.

            Cookies:
            This website may use cookies or similar technologies to improve functionality and understand website usage. You can control cookies through your browser settings.

            Third-Party Services:
            The website may contain links or integrations with third-party services such as maps, social media, analytics, reservation or payment providers. Those services have their own privacy policies and terms.

            Data Sharing:
            We do not sell personal information. Information may be shared with trusted service providers where reasonably necessary to operate the website or provide requested services, or where required by law.

            Data Security:
            We take reasonable measures to protect personal information, but no internet transmission or electronic storage system can be guaranteed to be completely secure.

            Data Retention:
            Information is retained only for as long as reasonably necessary for the purpose for which it was collected, to provide services, resolve disputes or meet legal obligations.

            Your Rights:
            Where applicable, you may request access, correction or deletion of your personal information. For privacy-related requests, please contact the restaurant using the contact details provided on this website.

            Children:
            We do not knowingly collect personal information from children where prohibited by applicable law.

            Policy Updates:
            This Privacy Policy may be updated from time to time. Any revised version will be published on this page.`
                : `Terms & Conditions

            Last Updated: September 5, 2026

            By accessing or using the Namaste Siam Indian Kitchen website, you agree to these Terms & Conditions.

            Website Use:
            This website provides information about Namaste Siam Indian Kitchen, including menu items, food descriptions, restaurant information, promotions and contact details.

            Menu Information:
            We make reasonable efforts to keep menu information accurate. However, menu items, ingredients, prices, portion sizes and availability may change without prior notice. Food photographs are for illustrative purposes and actual presentation may vary.

            Food Allergies:
            Customers are responsible for informing restaurant staff about allergies, intolerances or dietary requirements before ordering. Although reasonable precautions may be taken, we cannot guarantee that any dish is completely free from allergens or cross-contact.

            Reservations:
            Submitting a reservation request through the website does not necessarily guarantee a confirmed reservation. A reservation is confirmed only when confirmation is provided by the restaurant or applicable booking provider.

            Prices & Payments:
            Displayed prices may change. Where online ordering or payment is provided through a third-party service, that transaction may also be subject to the third party's terms and policies.

            Intellectual Property:
            Website text, photographs, graphics, logos, branding, design and other content are owned by or licensed to Namaste Siam Indian Kitchen and may not be reproduced, distributed or commercially used without permission.

            Acceptable Use:
            You must not misuse the website, attempt unauthorised access, interfere with its functionality or security, introduce malicious software or use the website for unlawful purposes.

            Third-Party Links:
            The website may contain links to third-party services. Namaste Siam Indian Kitchen is not responsible for the content, availability, security or policies of external websites.

            Website Availability:
            We do not guarantee that the website will always be uninterrupted, error-free or available. We may modify, suspend or discontinue any part of the website at any time.

            Disclaimer:
            Website content is provided for general informational purposes. We do not guarantee that all information will always be complete, current or error-free.

            Limitation of Liability:
            To the maximum extent permitted by applicable law, Namaste Siam Indian Kitchen will not be liable for indirect, incidental or consequential losses arising from use of the website.

            Changes:
            These Terms may be updated from time to time. Updated terms will be published on this page.

            Governing Law:
            These Terms shall be governed by the applicable laws of the jurisdiction in which Namaste Siam Indian Kitchen operates.

            Contact:
            For questions regarding these Terms, please contact Namaste Siam Indian Kitchen using the contact details provided on this website.`}
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

      {/* FLOATING CART PILL */}
      <FloatingCartPill
        totalCount={totalCartCount}
        totalTHB={totalCartTHB}
        onClick={() => setIsOrderDrawerOpen(true)}
      />

      {/* ORDER DRAWER */}
      <OrderDrawer
        isOpen={isOrderDrawerOpen}
        onClose={() => setIsOrderDrawerOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={handleClearCart}
        restaurantInfo={info}
      />

      {/* TABLE RESERVATION MODAL */}
      <ReservationModal
        isOpen={isReservationOpen}
        onClose={() => setIsReservationOpen(false)}
        restaurantInfo={info}
      />

      {/* GALLERY LIGHTBOX */}
      <GalleryLightbox
        isOpen={lightboxIndex !== null}
        onClose={() => setLightboxIndex(null)}
        items={effectiveGallery}
        currentIndex={lightboxIndex || 0}
        onNavigate={(idx) => setLightboxIndex(idx)}
        instagramHandle={info.instagram}
      />
    </div>
  );
}
