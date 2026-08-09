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

export async function generateDeviceFingerprint(): Promise<string> {
  const nav = window.navigator;
  const screen = window.screen;
  const str = `${nav.userAgent}-${nav.language}-${screen.colorDepth}-${screen.width}x${screen.height}-${new Date().getTimezoneOffset()}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAdminMode, setAdminMode] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isDeviceApproved, setIsDeviceApproved] = useState<boolean | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const checkDevicePreAuth = async (): Promise<boolean> => {
    try {
      const fingerprint = await generateDeviceFingerprint();
      const res = await fetch('/api/admin/check-device', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fingerprint })
      });
      if (res.ok) {
        const data = await res.json();
        setIsDeviceApproved(data.approved);
        return data.approved === true;
      }
      setIsDeviceApproved(false);
      return false;
    } catch (err) {
      console.error('Device verification failed:', err);
      setIsDeviceApproved(false);
      return false;
    }
  };

  const verifyDevice = async (): Promise<boolean> => {
    return await checkDevicePreAuth();
  };

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Load active session on mount securely
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user?.email) {
        const isDeviceValid = await verifyDevice();
        if (isDeviceValid) {
          setIsAuthenticated(true);
          setAdminMode(true);
          setUserEmail(session.user.email);
        } else {
          await supabase.auth.signOut();
        }
      }
      setLoading(false);
    }).catch((err) => {
      console.error('Failed to get Supabase session:', err);
      setLoading(false);
    });

    // Listen for authentication changes automatically
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user?.email) {
        const isDeviceValid = await verifyDevice();
        if (isDeviceValid) {
          setIsAuthenticated(true);
          setAdminMode(true);
          setUserEmail(session.user.email);
        } else {
          await supabase.auth.signOut();
          setIsAuthenticated(false);
          setAdminMode(false);
          setUserEmail(null);
        }
      } else {
        setIsAuthenticated(false);
        setAdminMode(false);
        setUserEmail(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setLoginError(null);
    
    const isDeviceValid = await verifyDevice();
    if (!isDeviceValid) {
       return { success: false, error: 'Unauthorized device.' };
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      const errMessage = 'Supabase keys are missing. Please complete setup in administrative secrets.';
      setLoginError(errMessage);
      return { success: false, error: errMessage };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setLoginError(error.message);
        return { success: false, error: error.message };
      }

      if (data.session?.user?.email) {
        setIsAuthenticated(true);
        setAdminMode(true);
        setUserEmail(data.user?.email || null);
        return { success: true };
      }

      return { success: false, error: 'Session initialization failed.' };
    } catch (err: any) {
      const errMsg = err?.message || 'Unknown authentication error occurred.';
      setLoginError(errMsg);
      return { success: false, error: errMsg };
    }
  };

  const signUp = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setLoginError('Public registration is disabled.');
    return { success: false, error: 'Public registration is disabled.' };
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