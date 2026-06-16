import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getSupabaseClient } from '../services/supabaseClient';

interface AdminAuthContextType {
  isAuthenticated: boolean;
  isAdminMode: boolean;
  userEmail: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  setAdminMode: (mode: boolean) => void;
  loginError: string | null;
  loading: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAdminMode, setAdminMode] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Load active session on mount securely (Supabase handles local persistence automatically)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setIsAuthenticated(true);
        setAdminMode(true);
        setUserEmail(session.user.email || null);
      }
      setLoading(false);
    }).catch((err) => {
      console.error('Failed to get Supabase session:', err);
      setLoading(false);
    });

    // Listen for authentication changes automatically
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setIsAuthenticated(true);
        setAdminMode(true);
        setUserEmail(session.user.email || null);
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

      if (data.session) {
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
    setLoginError(null);
    const supabase = getSupabaseClient();
    if (!supabase) {
      const errMessage = 'Supabase keys are missing. Please complete setup in administrative secrets.';
      setLoginError(errMessage);
      return { success: false, error: errMessage };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setLoginError(error.message);
        return { success: false, error: error.message };
      }

      if (data.user) {
        if (data.session) {
          setIsAuthenticated(true);
          setAdminMode(true);
          setUserEmail(data.user.email || null);
          return { success: true };
        } else {
          return { 
            success: true, 
            error: 'Registration successful! Verification email sent (if enabled). Please verify and sign in.' 
          };
        }
      }

      return { success: false, error: 'Registration failed.' };
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
  };

  return (
    <AdminAuthContext.Provider
      value={{
        isAuthenticated,
        isAdminMode,
        userEmail,
        login,
        signUp,
        logout,
        setAdminMode,
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
