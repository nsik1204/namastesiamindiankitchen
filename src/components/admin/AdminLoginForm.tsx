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
    <div id="admin-login-card" className="w-full max-w-[420px] bg-[#FFF9EF] p-8 rounded-3xl border border-[#E4D7BF] shadow-[0_20px_50px_rgba(23,61,50,0.12)] space-y-6 font-body">
      <div className="text-center space-y-2">
        <div className="text-3xl">🔓</div>
        <h2 className="text-2xl font-bold font-display tracking-tight text-[#173D32]">
          Staff Authentication
        </h2>
        <p className="text-xs text-[#75685A]">
          Secure Administrator portal access for Namaste Siam Indian Kitchen.
        </p>
      </div>

      <div className="flex bg-[#F8EEDB] p-2.5 rounded-xl border border-[#E4D7BF] justify-center">
        <span className="text-xs font-semibold text-[#173D32] flex items-center gap-1.5 py-0.5">
          🔑 Secure Admin Sign In
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-[#30251E] uppercase tracking-wider mb-1.5">
            Admin Email Address
          </label>
          <input
            id="admin-email-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@namastesiam.com"
            className="w-full bg-[#FFF9EF] border border-[#E4D7BF] rounded-xl p-3 text-sm text-[#30251E] focus:outline-none focus:border-[#173D32] focus:ring-1 focus:ring-[#173D32] transition-all font-body placeholder-[#75685A]/50"
            required
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#30251E] uppercase tracking-wider mb-1.5">
            Password (Min. 6 Characters)
          </label>
          <input
            id="admin-password-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            className="w-full bg-[#FFF9EF] border border-[#E4D7BF] rounded-xl p-3 text-sm text-[#30251E] focus:outline-none focus:border-[#173D32] focus:ring-1 focus:ring-[#173D32] transition-all font-body placeholder-[#75685A]/50"
            required
            disabled={loading}
            minLength={6}
          />
        </div>

        {loginError && (
          <div className="p-3 bg-[#A33C32]/10 border border-[#A33C32]/30 text-[#A33C32] text-xs rounded-xl font-medium leading-relaxed">
            ⚠️ {loginError}
          </div>
        )}

        {infoMessage && (
          <div className="p-3 bg-[#386B4D]/10 border border-[#386B4D]/30 text-[#386B4D] text-xs rounded-xl font-medium leading-relaxed">
            🌿 {infoMessage}
          </div>
        )}

        <div className="space-y-2.5 pt-2">
          <button
            id="admin-submit-button"
            type="submit"
            className="w-full bg-[#173D32] hover:bg-[#102C25] text-[#FFF9EF] font-bold py-3 px-4 rounded-xl text-sm transition-all shadow-sm border border-[#D9B66D]/40 flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-[#FFF9EF]" fill="none" viewBox="0 0 24 24">
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
            className="w-full text-center text-xs text-[#75685A] hover:text-[#173D32] transition-colors py-1"
            disabled={loading}
          >
            Cancel and Return
          </button>
        </div>
      </form>

      <div className="border-t border-[#E4D7BF] pt-4 text-center">
        <p className="text-[10px] text-[#75685A] font-body tracking-tight leading-relaxed">
          Authorized personnel access only. Credentials are authenticated securely on your connected Supabase cluster.
        </p>
      </div>
    </div>
  );
}
