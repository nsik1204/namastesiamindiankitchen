import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getSupabaseClient } from '../services/supabaseClient';

interface AdminAuthContextType {
  isAuthenticated: boolean;
  isAdminMode: boolean;
  userEmail: string | null;
  isDeviceApproved: boolean | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  setAdminMode: (mode: boolean) => void;
  checkDevicePreAuth: () => Promise<boolean>;
  loginError: string | null;
  loading: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

/**
 * Deprecated compatibility shim.
 * Device fingerprinting has been removed: it was spoofable, required a
 * serverless /api/admin/check-device endpoint that no longer exists on the
 * static Vercel deployment (404), and blocked auth initialisation.
 * Kept only so legacy imports keep compiling.
 */
export async function generateDeviceFingerprint(): Promise<string> {
  return '';
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAdminMode, setAdminMode] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Compatibility: no device gate exists any more, every device is "approved"
  // and real authorisation is enforced by Supabase Auth + RLS.
  const isDeviceApproved: boolean | null = true;
  const checkDevicePreAuth = async (): Promise<boolean> => true;

  useEffect(() => {
    let cancelled = false;
    const supabase = getSupabaseClient();

    if (!supabase) {
      setLoginError('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
      setLoading(false);
      return;
    }

    const applySession = (session: { user?: { email?: string | null } | null } | null) => {
      if (cancelled) return;
      const email = session?.user?.email ?? null;
      if (email) {
        setIsAuthenticated(true);
        setAdminMode(true);
        setUserEmail(email);
      } else {
        setIsAuthenticated(false);
        setAdminMode(false);
        setUserEmail(null);
      }
    };

    // Register the listener first so no auth event is missed.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session);
      if (!cancelled) setLoading(false);
    });

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        applySession(session);
      })
      .catch((err: unknown) => {
        console.error('Failed to get Supabase session:', err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setLoginError(null);

    const supabase = getSupabaseClient();
    if (!supabase) {
      const errMessage = 'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then redeploy.';
      setLoginError(errMessage);
      return { success: false, error: errMessage };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setLoginError(error.message);
        return { success: false, error: error.message };
      }

      if (data.session?.user?.email) {
        setIsAuthenticated(true);
        setAdminMode(true);
        setUserEmail(data.user?.email ?? null);
        return { success: true };
      }

      const msg = 'Session initialization failed.';
      setLoginError(msg);
      return { success: false, error: msg };
    } catch (err: any) {
      const errMsg = err?.message || 'Unknown authentication error occurred.';
      setLoginError(errMsg);
      return { success: false, error: errMsg };
    }
  };

  const signUp = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setLoginError(null);

    const supabase = getSupabaseClient();
    if (!supabase) {
      const errMessage = 'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then redeploy.';
      setLoginError(errMessage);
      return { success: false, error: errMessage };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/` },
      });

      if (error) {
        setLoginError(error.message);
        return { success: false, error: error.message };
      }

      if (data.session?.user?.email) {
        setIsAuthenticated(true);
        setAdminMode(true);
        setUserEmail(data.user?.email ?? null);
        return { success: true };
      }

      // Email confirmation is enabled: the user is not signed in yet.
      return { success: true, error: 'Check your email to confirm the account before signing in.' };
    } catch (err: any) {
      const errMsg = err?.message || 'Unknown registration error occurred.';
      setLoginError(errMsg);
      return { success: false, error: errMsg };
    }
  };

  const logout = async () => {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error('Supabase signOut error:', err);
      }
    }
    setIsAuthenticated(false);
    setAdminMode(false);
    setUserEmail(null);
    setLoginError(null);
  };

  return (
    <AdminAuthContext.Provider
      value={{
        isAuthenticated,
        isAdminMode,
        userEmail,
        isDeviceApproved,
        login,
        signUp,
        logout,
        setAdminMode,
        checkDevicePreAuth,
        loginError,
        loading,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
