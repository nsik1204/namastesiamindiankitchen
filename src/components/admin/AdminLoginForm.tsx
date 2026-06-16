import React, { useState } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';

interface AdminLoginFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function AdminLoginForm({ onSuccess, onCancel }: AdminLoginFormProps) {
  const { login, loginError } = useAdminAuth();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setInfoMessage(null);

    const result = await login(email, password);
    setLoading(false);
    if (result.success) {
      onSuccess();
    }
  };

  return (
    <div id="admin-login-card" className="w-full max-w-[420px] bg-white p-8 rounded-2xl border border-orange-500/20 shadow-xl space-y-6">
      <div className="text-center space-y-2">
        <div className="text-3xl">🔓</div>
        <h2 className="text-2xl font-bold font-sans tracking-tight text-[#1A0F00]">
          Staff Authentication
        </h2>
        <p className="text-xs text-[#7A5C3E]">
          Secure Administrator portal access for Namaste Siam Indian Kitchen.
        </p>
      </div>

      <div className="flex bg-gray-50 p-2 rounded-xl border border-gray-150 justify-center">
        <span className="text-xs font-semibold text-[#3D1F00] flex items-center gap-1.5 py-1">
          🔑 Secure Admin Sign In
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-[#3D1F00] uppercase tracking-wider mb-1.5">
            Admin Email Address
          </label>
          <input
            id="admin-email-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@namastesiam.com"
            className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-orange-500 transition-all font-mono placeholder-gray-300"
            required
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#3D1F00] uppercase tracking-wider mb-1.5">
            Password (Min. 6 Characters)
          </label>
          <input
            id="admin-password-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-orange-500 transition-all font-mono placeholder-gray-300"
            required
            disabled={loading}
            minLength={6}
          />
        </div>

        {loginError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-medium leading-relaxed">
            ⚠️ {loginError}
          </div>
        )}

        {infoMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg font-medium leading-relaxed">
            🌿 {infoMessage}
          </div>
        )}

        <div className="space-y-2.5 pt-2">
          <button
            id="admin-submit-button"
            type="submit"
            className="w-full bg-[#3D1F00] hover:bg-black text-white font-semibold py-3 px-4 rounded-lg text-sm transition-all shadow-md flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing transaction...
              </>
            ) : (
              'Verify & Access'
            )}
          </button>
          
          <button
            id="admin-cancel-button"
            type="button"
            onClick={onCancel}
            className="w-full text-center text-xs text-gray-500 hover:text-gray-900 transition-colors py-1"
            disabled={loading}
          >
            Cancel and Return
          </button>
        </div>
      </form>

      <div className="border-t border-gray-100 pt-4 text-center">
        <p className="text-[10px] text-gray-400 font-mono tracking-tight leading-relaxed">
          Authorized personnel access only. Credentials are authenticated securely on your connected Supabase cluster.
        </p>
      </div>
    </div>
  );
}
