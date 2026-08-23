/**
 * src/App.tsx — Namaste Siam Indian Kitchen
 * ---------------------------------------------------------------------------
 * Single composition root.
 *
 *  - Supabase is the ONLY persistent source. No localStorage cache, no static
 *    seed fallback, no auto-seeding. If a read fails we surface an error state
 *    instead of silently restoring deleted rows.
 *  - No admin affordance of any kind is rendered on public pages.
 *  - The admin surface is reachable only at /unlock-admin?k=<secret>. The key
 *    is read from import.meta.env.VITE_ADMIN_UNLOCK_KEY (never hardcoded) and
 *    is ONLY an obscurity gate: it hides the login form from crawlers and
 *    casual visitors. It is NOT authentication and NOT device binding — the
 *    real gate is Supabase email+password auth plus an `admin` role checked
 *    server-side by RLS. A URL key cannot bind access to one device; anyone
 *    holding the link sees the same login form and still needs credentials.
 *  - All ordering features (cart, checkout, delivery/pickup, prices-as-buy)
 *    are removed. The menu is presentational only.
 *  - Visual language adopted from the supplied workspace UI (warm paper theme:
 *    ink/amber tokens, Fraunces display, reveal-on-scroll sections).
 * ---------------------------------------------------------------------------
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/* ========================================================================== */
/* Supabase client (single instance, no fallback data path)                    */
/* ========================================================================== */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as
  | string
  | undefined;

/** Unlock key comes from env only — never commit a real value. */
const UNLOCK_KEY = (import.meta.env.VITE_ADMIN_UNLOCK_KEY as string | undefined) ?? "";

let _client: SupabaseClient | null = null;
function supa(): SupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
    );
  }
  if (!_client) {
    _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storageKey: "nsik-auth",
      },
    });
  }
  return _client;
}

/* ========================================================================== */
/* Types                                                                       */
/* ========================================================================== */

export interface Dish {
  id: number;
  slug: string;
  name: string;
  description: string;
  priceTHB: number;
  category: string;
  veg: boolean;
  spiceLevel: string;
  ingredients: string[];
  chefSpecial: boolean;
  bestseller: boolean;
  customerFavorite: boolean;
  todaySpecial: boolean;
  image: string;
  active: boolean;
  displayOrder: number;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  displayOrder: number;
  active: boolean;
}

export interface RestaurantInfo {
  name: string;
  address: string;
  phone: string;
  openingHours: string;
  instagram: string;
  website: string;
  diningStyle: string;
}

export interface AboutInfo {
  story: string[];
  highlights: string[];
}

export interface GalleryItem {
  id: number;
  image: string;
  alt: string;
  tall: boolean;
  displayOrder: number;
  active: boolean;
}

type LoadState = "loading" | "ready" | "error";

/* ========================================================================== */
/* Row mappers — pure, no defaults invented from local seed data               */
/* ========================================================================== */

const mapDish = (r: any): Dish => ({
  id: Number(r.id),
  slug: r.slug ?? "",
  name: r.name ?? "",
  description: r.description ?? "",
  priceTHB: Number(r.price_thb ?? 0),
  category: r.category_id ?? "",
  veg: r.veg !== false && r.food_type !== "nonveg",
  spiceLevel: r.spice_level ?? "",
  ingredients: Array.isArray(r.ingredients) ? r.ingredients : [],
  chefSpecial: !!r.chef_special,
  bestseller: !!(r.bestseller ?? r.popular),
  customerFavorite: !!r.customer_favorite,
  todaySpecial: !!r.today_special,
  image: r.image_url ?? "",
  active: r.active !== false,
  displayOrder: Number(r.display_order ?? 0),
});

const mapCategory = (r: any): Category => ({
  id: String(r.id),
  slug: r.slug ?? String(r.id),
  name: r.name ?? r.label ?? String(r.id),
  displayOrder: Number(r.display_order ?? r.sort_order ?? 0),
  active: r.active !== false,
});

const mapGallery = (r: any): GalleryItem => ({
  id: Number(r.id),
  image: r.image_url ?? "",
  alt: r.alt_text ?? r.title ?? "",
  tall: !!r.is_tall,
  displayOrder: Number(r.display_order ?? r.sort_order ?? 0),
  active: r.active !== false,
});

/* ========================================================================== */
/* Data layer — reads Supabase and nothing else                                */
/* ========================================================================== */

async function loadSiteData() {
  const db = supa();

  const [dishesRes, catsRes, infoRes, aboutRes, galleryRes] = await Promise.all([
    db.from("foods").select("*").eq("active", true).order("display_order", { ascending: true }),
    db.from("categories").select("*").eq("active", true).order("display_order", { ascending: true }),
    db.from("restaurant_info").select("*").limit(1).maybeSingle(),
    db.from("about_info").select("*").limit(1).maybeSingle(),
    db.from("gallery").select("*").eq("active", true).order("display_order", { ascending: true }),
  ]);

  const firstError =
    dishesRes.error || catsRes.error || infoRes.error || aboutRes.error || galleryRes.error;
  if (firstError) throw firstError;

  const info = infoRes.data;
  const about = aboutRes.data;

  return {
    dishes: (dishesRes.data ?? []).map(mapDish),
    categories: (catsRes.data ?? []).map(mapCategory),
    restaurantInfo: info
      ? ({
          name: info.name ?? "",
          address: info.address ?? "",
          phone: info.phone ?? "",
          openingHours: info.opening_hours ?? "",
          instagram: info.instagram ?? "",
          website: info.website ?? "",
          diningStyle: info.dining_style ?? "",
        } as RestaurantInfo)
      : null,
    aboutInfo: about
      ? ({
          story: about.story_paragraphs ?? [],
          highlights: about.highlights ?? [],
        } as AboutInfo)
      : null,
    gallery: (galleryRes.data ?? []).map(mapGallery),
  };
}

/** Admin write helpers. Authorisation is enforced by RLS, not by this code. */
const AdminData = {
  async listAllDishes(): Promise<Dish[]> {
    const { data, error } = await supa()
      .from("foods")
      .select("*")
      .order("display_order", { ascending: true });
    if (error) throw error;
    return (data ?? []).map(mapDish);
  },

  /** Hard delete — the row is gone from the single source of truth. */
  async deleteDish(id: number): Promise<void> {
    const { error } = await supa().from("foods").delete().eq("id", id);
    if (error) throw error;
  },

  async setDishActive(id: number, active: boolean): Promise<void> {
    const { error } = await supa()
      .from("foods")
      .update({ active, is_available: active, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  },

  async upsertDish(d: Partial<Dish> & { name: string; category: string }): Promise<void> {
    const row: Record<string, unknown> = {
      slug: d.slug || slugify(d.name),
      name: d.name,
      description: d.description ?? "",
      price_thb: d.priceTHB ?? 0,
      category_id: d.category,
      veg: d.veg !== false,
      food_type: d.veg === false ? "nonveg" : "veg",
      spice_level: d.spiceLevel ?? "",
      ingredients: d.ingredients ?? [],
      chef_special: !!d.chefSpecial,
      bestseller: !!d.bestseller,
      popular: !!d.bestseller,
      customer_favorite: !!d.customerFavorite,
      today_special: !!d.todaySpecial,
      image_url: d.image ?? "",
      active: d.active !== false,
      is_available: d.active !== false,
      display_order: d.displayOrder ?? 0,
      updated_at: new Date().toISOString(),
    };
    if (d.id && d.id > 0) row.id = d.id;
    const { error } = await supa().from("foods").upsert(row, { onConflict: "id" });
    if (error) throw error;
  },
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}

const thb = (n: number) => `฿${n.toLocaleString("en-US")}`;

/* ========================================================================== */
/* Routing — minimal, hash-free, reactive to history API                       */
/* ========================================================================== */

function useLocation() {
  const [loc, setLoc] = useState(() => ({
    path: window.location.pathname,
    search: window.location.search,
  }));

  useEffect(() => {
    const sync = () =>
      setLoc({ path: window.location.pathname, search: window.location.search });
    const push = window.history.pushState;
    const replace = window.history.replaceState;
    window.history.pushState = function (...a: any) {
      push.apply(this, a as any);
      sync();
    };
    window.history.replaceState = function (...a: any) {
      replace.apply(this, a as any);
      sync();
    };
    window.addEventListener("popstate", sync);
    return () => {
      window.history.pushState = push;
      window.history.replaceState = replace;
      window.removeEventListener("popstate", sync);
    };
  }, []);

  return loc;
}

/** Constant-time-ish comparison so the key isn't trivially timing-probed. */
function keyMatches(provided: string): boolean {
  if (!UNLOCK_KEY || !provided) return false;
  if (provided.length !== UNLOCK_KEY.length) return false;
  let diff = 0;
  for (let i = 0; i < UNLOCK_KEY.length; i++) {
    diff |= UNLOCK_KEY.charCodeAt(i) ^ provided.charCodeAt(i);
  }
  return diff === 0;
}

/* ========================================================================== */
/* Auth — Supabase session + server-verified admin role                        */
/* ========================================================================== */

interface AdminSession {
  status: "checking" | "anon" | "admin" | "denied";
  email: string | null;
}

function useAdminSession(enabled: boolean) {
  const [session, setSession] = useState<AdminSession>({
    status: enabled ? "checking" : "anon",
    email: null,
  });

  const evaluate = useCallback(async () => {
    if (!enabled) return;
    try {
      const db = supa();
      const {
        data: { session: s },
      } = await db.auth.getSession();
      if (!s?.user) {
        setSession({ status: "anon", email: null });
        return;
      }
      // Role lives in a dedicated table and is verified through a
      // SECURITY DEFINER function — never in localStorage or the JWT payload.
      const { data, error } = await db.rpc("is_admin");
      if (error || data !== true) {
        setSession({ status: "denied", email: s.user.email ?? null });
        return;
      }
      setSession({ status: "admin", email: s.user.email ?? null });
    } catch {
      setSession({ status: "denied", email: null });
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    void evaluate();
    const {
      data: { subscription },
    } = supa().auth.onAuthStateChange(() => void evaluate());
    return () => subscription.unsubscribe();
  }, [enabled, evaluate]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supa().auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: error.message };
    return { ok: true as const };
  }, []);

  const signOut = useCallback(async () => {
    await supa().auth.signOut();
    setSession({ status: "anon", email: null });
  }, []);

  return { session, signIn, signOut, refresh: evaluate };
}

/* ========================================================================== */
/* Presentational primitives (workspace UI language)                           */
/* ========================================================================== */

function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => e.isIntersecting && (setShown(true), io.disconnect()),
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out ${
        shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      }`}
    >
      {children}
    </div>
  );
}

function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-line bg-ink2 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-sand">
      {children}
    </span>
  );
}

/* ========================================================================== */
/* Public site                                                                 */
/* ========================================================================== */

function PublicSite() {
  const [state, setState] = useState<LoadState>("loading");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [info, setInfo] = useState<RestaurantInfo | null>(null);
  const [about, setAbout] = useState<AboutInfo | null>(null);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [activeCat, setActiveCat] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Dish | null>(null);

  const load = useCallback(async () => {
    setState("loading");
    try {
      const data = await loadSiteData();
      setDishes(data.dishes);
      setCategories(data.categories);
      setInfo(data.restaurantInfo);
      setAbout(data.aboutInfo);
      setGallery(data.gallery);
      setState("ready");
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Unable to reach the kitchen database.");
      setState("error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return dishes
      .filter((d) => (activeCat === "all" ? true : d.category === activeCat))
      .filter(
        (d) =>
          !q ||
          d.name.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q) ||
          d.ingredients.some((i) => i.toLowerCase().includes(q))
      )
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }, [dishes, activeCat, query]);

  const todaySpecial = useMemo(
    () => visible.find((d) => d.todaySpecial) ?? null,
    [visible]
  );

  if (state === "loading") {
    return (
      <div className="min-h-screen grid place-items-center bg-ink text-sand">
        <div className="flex flex-col items-center gap-3">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-amber" />
          <p className="text-sm">Warming the tandoor…</p>
        </div>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="min-h-screen grid place-items-center bg-ink px-6 text-center">
        <div className="max-w-md">
          <h1 className="font-display text-3xl text-cream">Menu unavailable</h1>
          <p className="mt-3 text-sm text-sand">
            We could not load the live menu. Nothing is served from a local copy,
            so what you see is always what the kitchen published.
          </p>
          <p className="mt-2 text-xs text-husk">{errorMsg}</p>
          <button
            onClick={() => void load()}
            className="mt-6 rounded-full bg-amber px-6 h-11 text-sm font-semibold text-ink hover:bg-amberhi transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink text-cream">
      {/* NOTE: no admin button, no admin link, no lock icon anywhere here. */}
      <header className="sticky top-0 z-40 border-b border-line/70 bg-ink/90 backdrop-blur-md">
        <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <a href="#top" className="leading-none">
            <span className="block font-display text-xl tracking-tight text-cream">
              Namaste <span className="italic text-amber">Siam</span>
            </span>
            <span className="mt-1 hidden text-[11px] uppercase tracking-widest text-husk sm:block">
              Indian Kitchen · Bangkok
            </span>
          </a>
          <nav className="hidden items-center gap-7 text-sm text-sand md:flex">
            <a href="#menu" className="transition-colors hover:text-amber">Menu</a>
            <a href="#about" className="transition-colors hover:text-amber">About</a>
            <a href="#gallery" className="transition-colors hover:text-amber">Gallery</a>
            <a href="#contact" className="transition-colors hover:text-amber">Contact</a>
          </nav>
          {info?.phone && (
            <a
              href={`tel:${info.phone.replace(/\s/g, "")}`}
              className="rounded-full bg-amber px-5 h-10 text-sm font-semibold text-ink leading-10 transition-colors hover:bg-amberhi"
            >
              Reserve a table
            </a>
          )}
        </div>
      </header>

      {/* Hero */}
      <section id="top" className="border-b border-line/60">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 pb-12 pt-14 sm:px-6 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-7">
            <Reveal>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber">
                Authentic · wood-fired · {info?.diningStyle || "premium casual dining"}
              </p>
            </Reveal>
            <Reveal delay={90}>
              <h1 className="mt-5 font-display text-[2.7rem] leading-[1.02] tracking-[-0.02em] text-cream sm:text-6xl lg:text-[4.4rem]">
                Experience
                <br />
                <em className="font-light italic text-amber">authentic</em> flavours.
              </h1>
            </Reveal>
            <Reveal delay={170}>
              <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-sand sm:text-base">
                {about?.story?.[0] ??
                  "Indian and Thai cooking from one kitchen in the heart of Bangkok — every curry slow-simmered, every naan pulled fresh from the tandoor."}
              </p>
            </Reveal>
            <Reveal delay={250}>
              <div className="mt-8 flex flex-wrap items-center gap-3.5">
                <a
                  href="#menu"
                  className="inline-flex h-12 items-center rounded-full bg-amber px-6 text-sm font-semibold text-ink transition-all hover:bg-amberhi active:scale-95"
                >
                  Browse the menu
                </a>
                {info?.phone && (
                  <a
                    href={`tel:${info.phone.replace(/\s/g, "")}`}
                    className="inline-flex h-12 items-center rounded-full border border-line px-6 text-sm text-sand transition-colors hover:border-amber/50 hover:text-amber"
                  >
                    Call {info.phone}
                  </a>
                )}
              </div>
            </Reveal>
          </div>

          {todaySpecial && (
            <Reveal delay={200}>
              <aside className="lg:col-span-5">
                <div className="overflow-hidden rounded-3xl border border-line bg-coal shadow-sm">
                  {todaySpecial.image && (
                    <img
                      src={todaySpecial.image}
                      alt={todaySpecial.name}
                      loading="lazy"
                      className="h-56 w-full object-cover"
                    />
                  )}
                  <div className="p-6">
                    <Chip>Today&apos;s special</Chip>
                    <h2 className="mt-3 font-display text-2xl text-cream">
                      {todaySpecial.name}
                    </h2>
                    <p className="mt-2 line-clamp-3 text-sm text-sand">
                      {todaySpecial.description}
                    </p>
                    <p className="mt-4 text-sm font-semibold text-amber">
                      {thb(todaySpecial.priceTHB)}
                    </p>
                  </div>
                </div>
              </aside>
            </Reveal>
          )}
        </div>
      </section>

      {/* Menu */}
      <section id="menu" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber">
                The menu
              </p>
              <h2 className="mt-2 font-display text-3xl text-cream sm:text-4xl">
                Dishes from the fire
              </h2>
            </div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search dishes or ingredients…"
              aria-label="Search the menu"
              className="h-11 w-full max-w-xs rounded-full border border-line bg-coal px-5 text-sm text-cream outline-none placeholder:text-husk focus:border-amber/60"
            />
          </div>
        </Reveal>

        <div className="mt-7 flex flex-wrap gap-2">
          {[{ id: "all", name: "All" }, ...categories].map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCat(c.id)}
              className={`h-9 rounded-full border px-4 text-sm transition-colors ${
                activeCat === c.id
                  ? "border-amber bg-amber text-ink font-semibold"
                  : "border-line text-sand hover:border-amber/50 hover:text-amber"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {visible.length === 0 ? (
          <p className="mt-12 text-center text-sm text-husk">
            No dishes match that search.
          </p>
        ) : (
          <div className="mt-9 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((d, i) => (
              <Reveal key={d.id} delay={Math.min(i, 6) * 60}>
                <article
                  onClick={() => setSelected(d)}
                  className="group h-full cursor-pointer overflow-hidden rounded-3xl border border-line bg-coal transition-shadow hover:shadow-[0_18px_50px_rgba(0,0,0,0.10)]"
                >
                  {d.image && (
                    <img
                      src={d.image}
                      alt={d.name}
                      loading="lazy"
                      className="h-44 w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                  )}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-display text-lg leading-tight text-cream">
                        {d.name}
                      </h3>
                      <span className="shrink-0 text-sm font-semibold text-amber">
                        {thb(d.priceTHB)}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-sand">{d.description}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Chip>{d.veg ? "Veg" : "Non-veg"}</Chip>
                      {d.spiceLevel && <Chip>{d.spiceLevel}</Chip>}
                      {d.chefSpecial && <Chip>Chef&apos;s pick</Chip>}
                      {d.bestseller && <Chip>Popular</Chip>}
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        )}
        <p className="mt-10 text-center text-xs text-husk">
          Prices in Thai Baht. Dine-in and table reservations by phone — we do not
          take online orders.
        </p>
      </section>

      {/* About */}
      {about && (
        <section id="about" className="border-y border-line/60 bg-ink2">
          <div className="mx-auto max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid lg:grid-cols-12">
            <div className="lg:col-span-7">
              <Reveal>
                <h2 className="font-display text-3xl text-cream sm:text-4xl">Our story</h2>
              </Reveal>
              {about.story.map((p, i) => (
                <Reveal key={i} delay={80 + i * 70}>
                  <p className="mt-4 text-[15px] leading-relaxed text-sand">{p}</p>
                </Reveal>
              ))}
            </div>
            <div className="mt-10 lg:col-span-5 lg:mt-0">
              <ul className="space-y-3">
                {about.highlights.map((h, i) => (
                  <Reveal key={i} delay={i * 70}>
                    <li className="rounded-2xl border border-line bg-coal px-5 py-4 text-sm text-sand">
                      {h}
                    </li>
                  </Reveal>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* Gallery */}
      {gallery.length > 0 && (
        <section id="gallery" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <Reveal>
            <h2 className="font-display text-3xl text-cream sm:text-4xl">From the pass</h2>
          </Reveal>
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            {gallery
              .slice()
              .sort((a, b) => a.displayOrder - b.displayOrder)
              .map((g, i) => (
                <Reveal key={g.id} delay={Math.min(i, 6) * 50}>
                  <img
                    src={g.image}
                    alt={g.alt}
                    loading="lazy"
                    className={`w-full rounded-2xl border border-line object-cover ${
                      g.tall ? "h-80" : "h-40"
                    }`}
                  />
                </Reveal>
              ))}
          </div>
        </section>
      )}

      {/* Contact / footer */}
      <footer id="contact" className="border-t border-line/60 bg-ink2">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 md:grid-cols-3">
          <div>
            <p className="font-display text-xl text-cream">{info?.name ?? "Namaste Siam"}</p>
            <p className="mt-3 text-sm text-sand">{info?.address}</p>
          </div>
          <div className="text-sm text-sand">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-husk">Hours</p>
            <p className="mt-2 whitespace-pre-line">{info?.openingHours}</p>
          </div>
          <div className="text-sm text-sand">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-husk">Reach us</p>
            {info?.phone && (
              <p className="mt-2">
                <a href={`tel:${info.phone.replace(/\s/g, "")}`} className="hover:text-amber">
                  {info.phone}
                </a>
              </p>
            )}
            {info?.instagram && (
              <p className="mt-1">
                <a href={info.instagram} className="hover:text-amber" rel="noreferrer noopener">
                  Instagram
                </a>
              </p>
            )}
          </div>
        </div>
        <div className="border-t border-line/60 py-5 text-center text-xs text-husk">
          © {new Date().getFullYear()} {info?.name ?? "Namaste Siam Indian Kitchen"}
        </div>
      </footer>

      {/* Dish detail modal — informational only, no add-to-cart */}
      {selected && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setSelected(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] w-full max-w-lg overflow-auto rounded-3xl border border-line bg-coal"
          >
            {selected.image && (
              <img src={selected.image} alt={selected.name} className="h-56 w-full object-cover" />
            )}
            <div className="p-6">
              <div className="flex items-start justify-between gap-4">
                <h3 className="font-display text-2xl text-cream">{selected.name}</h3>
                <span className="text-base font-semibold text-amber">
                  {thb(selected.priceTHB)}
                </span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-sand">{selected.description}</p>
              {selected.ingredients.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {selected.ingredients.map((ing) => (
                    <Chip key={ing}>{ing}</Chip>
                  ))}
                </div>
              )}
              <button
                onClick={() => setSelected(null)}
                className="mt-6 h-11 w-full rounded-full border border-line text-sm text-sand hover:border-amber/50 hover:text-amber"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ========================================================================== */
/* Admin surface (only mounted behind /unlock-admin?k=…)                       */
/* ========================================================================== */

function AdminLogin({
  onSubmit,
}: {
  onSubmit: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="grid min-h-screen place-items-center bg-ink px-4">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          const res = await onSubmit(email.trim(), password);
          if (!res.ok) setError(res.error ?? "Sign-in failed.");
          setBusy(false);
        }}
        className="w-full max-w-sm rounded-3xl border border-line bg-coal p-7"
      >
        <h1 className="font-display text-2xl text-cream">Staff sign in</h1>
        <p className="mt-2 text-xs leading-relaxed text-husk">
          This link only hides the form. Access is granted by your account
          credentials and admin role, verified on the server.
        </p>

        <label className="mt-6 block text-xs font-semibold uppercase tracking-wider text-husk">
          Email
        </label>
        <input
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-2 h-11 w-full rounded-xl border border-line bg-ink px-4 text-sm text-cream outline-none focus:border-amber/60"
        />

        <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-husk">
          Password
        </label>
        <input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-2 h-11 w-full rounded-xl border border-line bg-ink px-4 text-sm text-cream outline-none focus:border-amber/60"
        />

        {error && <p className="mt-4 text-sm text-danger">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="mt-6 h-11 w-full rounded-full bg-amber text-sm font-semibold text-ink transition-colors hover:bg-amberhi disabled:opacity-60"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

function AdminDashboard({
  email,
  onSignOut,
}: {
  email: string | null;
  onSignOut: () => void;
}) {
  const [rows, setRows] = useState<Dish[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setState("loading");
    try {
      setRows(await AdminData.listAllDishes());
      setState("ready");
    } catch (e: any) {
      setError(e?.message ?? "Load failed");
      setState("error");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const remove = async (d: Dish) => {
    if (!window.confirm(`Permanently delete “${d.name}”? This cannot be undone.`)) return;
    setError(null);
    try {
      await AdminData.deleteDish(d.id);
      // Re-read from Supabase so the UI can never show a stale/optimistic list.
      await refresh();
      setMessage(`Deleted “${d.name}”.`);
    } catch (e: any) {
      setError(e?.message ?? "Delete failed — check your admin role and RLS policy.");
    }
  };

  const toggleActive = async (d: Dish) => {
    setError(null);
    try {
      await AdminData.setDishActive(d.id, !d.active);
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? "Update failed.");
    }
  };

  return (
    <div className="min-h-screen bg-ink text-cream">
      <header className="border-b border-line/70 bg-ink2">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <p className="font-display text-xl text-cream">Kitchen admin</p>
            <p className="text-xs text-husk">{email}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => void refresh()}
              className="h-10 rounded-full border border-line px-4 text-sm text-sand hover:border-amber/50 hover:text-amber"
            >
              Refresh
            </button>
            <button
              onClick={onSignOut}
              className="h-10 rounded-full bg-amber px-4 text-sm font-semibold text-ink hover:bg-amberhi"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {message && <p className="mb-4 text-sm text-ok">{message}</p>}
        {error && <p className="mb-4 text-sm text-danger">{error}</p>}

        {state === "loading" && <p className="text-sm text-sand">Loading dishes…</p>}
        {state === "error" && (
          <p className="text-sm text-danger">Could not load dishes. {error}</p>
        )}

        {state === "ready" && (
          <div className="overflow-hidden rounded-2xl border border-line">
            <table className="w-full text-left text-sm">
              <thead className="bg-ink2 text-xs uppercase tracking-wider text-husk">
                <tr>
                  <th className="px-4 py-3">Dish</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((d) => (
                  <tr key={d.id} className="border-t border-line/70">
                    <td className="px-4 py-3 text-cream">{d.name}</td>
                    <td className="px-4 py-3 text-sand">{d.category}</td>
                    <td className="px-4 py-3 text-sand">{thb(d.priceTHB)}</td>
                    <td className="px-4 py-3">
                      <span className={d.active ? "text-ok" : "text-husk"}>
                        {d.active ? "Live" : "Hidden"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => void toggleActive(d)}
                          className="h-9 rounded-full border border-line px-3 text-xs text-sand hover:border-amber/50 hover:text-amber"
                        >
                          {d.active ? "Hide" : "Show"}
                        </button>
                        <button
                          onClick={() => void remove(d)}
                          className="h-9 rounded-full border border-danger/50 px-3 text-xs text-danger hover:bg-danger/10"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-husk">
                      No dishes in the database. Nothing is auto-seeded — add dishes
                      deliberately.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

/** Rendered for a wrong/missing key: indistinguishable from a real 404. */
function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-ink px-6 text-center">
      <div>
        <p className="font-display text-5xl text-cream">404</p>
        <p className="mt-3 text-sm text-sand">This page could not be found.</p>
        <a
          href="/"
          className="mt-6 inline-flex h-11 items-center rounded-full bg-amber px-6 text-sm font-semibold text-ink hover:bg-amberhi"
        >
          Back to the restaurant
        </a>
      </div>
    </div>
  );
}

function AdminRoute() {
  const { session, signIn, signOut } = useAdminSession(true);

  if (session.status === "checking") {
    return (
      <div className="grid min-h-screen place-items-center bg-ink text-sand">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-amber" />
      </div>
    );
  }
  if (session.status === "anon") return <AdminLogin onSubmit={signIn} />;
  if (session.status === "denied") {
    return (
      <div className="grid min-h-screen place-items-center bg-ink px-6 text-center">
        <div>
          <p className="font-display text-2xl text-cream">Not authorised</p>
          <p className="mt-3 text-sm text-sand">
            This account is signed in but has no admin role.
          </p>
          <button
            onClick={() => void signOut()}
            className="mt-6 h-11 rounded-full border border-line px-6 text-sm text-sand hover:border-amber/50 hover:text-amber"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }
  return <AdminDashboard email={session.email} onSignOut={() => void signOut()} />;
}

/* ========================================================================== */
/* Root                                                                        */
/* ========================================================================== */

export default function App() {
  const { path, search } = useLocation();

  const normalized = path.replace(/\/+$/, "") || "/";

  if (normalized === "/unlock-admin") {
    const provided = new URLSearchParams(search).get("k") ?? "";
    if (!keyMatches(provided)) return <NotFound />;
    return <AdminRoute />;
  }

  // Legacy /admin path is no longer an entry point.
  if (normalized === "/admin") return <NotFound />;

  return <PublicSite />;
}
